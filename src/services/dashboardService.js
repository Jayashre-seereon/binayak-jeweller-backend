import prisma from "../config/db.js";

const roundMoney = (v) => Math.round((Number(v || 0) + Number.EPSILON) * 100) / 100;
const roundWeight = (v) => Math.round((Number(v || 0) + Number.EPSILON) * 1000) / 1000;

/**
 * Calculate Date range based on period: today, this_week, this_month
 */
const getDateRange = (period) => {
  const now = new Date();
  const p = String(period || "this_month").toLowerCase();

  let start;
  let end;

  if (p === "today") {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  } else if (p === "this_week") {
    const dayOfWeek = now.getDay();
    const diffToMonday = (dayOfWeek + 6) % 7; // Monday as 0
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0, 0);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    // Default: this_month
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start, end };
};

export const getDashboardSummaryService = async (storeId, period = "this_month") => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) throw new Error("Valid storeId is required");

  const normalizedPeriod = ["today", "this_week", "this_month"].includes(String(period).toLowerCase())
    ? String(period).toLowerCase()
    : "this_month";

  const { start, end } = getDateRange(normalizedPeriod);

  // 1. Live Gold & Silver Board Rates
  const ratesPromise = prisma.rateMaster.findMany({
    where: { storeId: numericStoreId },
    include: { metal: true, purity: true, grade: true },
    orderBy: { updatedAt: "desc" },
  });

  // 2. Total Sales in selected period (Today, This Week, or This Month)
  const salesAggregatePromise = prisma.sale.aggregate({
    _sum: {
      grossAmount: true,
      discount: true,
      netPayable: true,
      paidAmount: true,
      dueAmount: true,
    },
    _count: { id: true },
    where: {
      storeId: numericStoreId,
      status: "COMPLETED",
      saleDate: { gte: start, lte: end },
    },
  });

  // 3. Total Sold Weight in selected period
  const salesItemsPromise = prisma.saleItem.aggregate({
    _sum: {
      grossWeight: true,
      netWeight: true,
      pieces: true,
    },
    where: {
      sale: {
        storeId: numericStoreId,
        status: "COMPLETED",
        saleDate: { gte: start, lte: end },
      },
    },
  });

  // 4. Sales list in selected period (to build the dynamic graph)
  const salesListPromise = prisma.sale.findMany({
    where: {
      storeId: numericStoreId,
      status: "COMPLETED",
      saleDate: { gte: start, lte: end },
    },
    select: {
      saleDate: true,
      netPayable: true,
    },
  });

  // 5. Total Stock in Vault (Available inventory items & net weight)
  const inventoryAggregatePromise = prisma.inventory.aggregate({
    _sum: {
      grossWeight: true,
      netWeight: true,
      pieces: true,
    },
    _count: { id: true },
    where: {
      storeId: numericStoreId,
      status: "AVAILABLE",
    },
  });

  // 6. Active Customer Advances available for deduction
  const advancesPromise = prisma.advanceReceive.aggregate({
    _sum: { balanceAmount: true },
    _count: { id: true },
    where: {
      storeId: numericStoreId,
      status: { not: "CANCELLED" },
      balanceAmount: { gt: 0.01 },
    },
  });

  // 7. Supplier Outstanding Dues
  const supplierDuesPromise = prisma.purchase.aggregate({
    _sum: { dueAmount: true },
    _count: { id: true },
    where: {
      storeId: numericStoreId,
      dueAmount: { gt: 0.01 },
    },
  });

  // 8. Recent Sales (Latest 6 bills)
  const recentSalesPromise = prisma.sale.findMany({
    where: { storeId: numericStoreId, status: "COMPLETED" },
    select: {
      id: true,
      invoiceNo: true,
      customerName: true,
      customerPhone: true,
      saleDate: true,
      netPayable: true,
      paidAmount: true,
      dueAmount: true,
    },
    orderBy: { saleDate: "desc" },
    take: 6,
  });

  // Execute all queries concurrently
  const [
    rates,
    salesAgg,
    salesItemsAgg,
    salesList,
    inventoryAgg,
    advances,
    supplierDues,
    recentSales,
  ] = await Promise.all([
    ratesPromise,
    salesAggregatePromise,
    salesItemsPromise,
    salesListPromise,
    inventoryAggregatePromise,
    advancesPromise,
    supplierDuesPromise,
    recentSalesPromise,
  ]);

  // Map Live Board Rates
  const liveRates = {
    gold24k: null,
    gold22k: null,
    gold18k: null,
    silver: null,
  };

  rates.forEach((r) => {
    const metalName = String(r.metal?.name || "").toUpperCase();
    const purityName = String(r.purity?.name || "").toUpperCase();

    if (metalName.includes("GOLD") || purityName.includes("24") || purityName.includes("22") || purityName.includes("18")) {
      if (purityName.includes("24") && !liveRates.gold24k) liveRates.gold24k = roundMoney(r.rate);
      else if (purityName.includes("22") && !liveRates.gold22k) liveRates.gold22k = roundMoney(r.rate);
      else if (purityName.includes("18") && !liveRates.gold18k) liveRates.gold18k = roundMoney(r.rate);
    }
    if (metalName.includes("SILVER") && !liveRates.silver) {
      liveRates.silver = roundMoney(r.rate);
    }
  });

  // Clean KPI numbers
  const sales = {
    totalRevenue: roundMoney(salesAgg._sum.netPayable || 0),
    invoicesCount: salesAgg._count.id || 0,
    grossWeightSold: roundWeight(salesItemsAgg._sum.grossWeight || 0),
    netWeightSold: roundWeight(salesItemsAgg._sum.netWeight || 0),
    piecesSold: salesItemsAgg._sum.pieces || 0,
  };

  const inventory = {
    totalPieces: inventoryAgg._count.id || 0,
    totalGrossWeight: roundWeight(inventoryAgg._sum.grossWeight || 0),
    totalNetWeight: roundWeight(inventoryAgg._sum.netWeight || 0),
  };

  const customerAdvances = {
    totalAvailableBalance: roundMoney(advances._sum.balanceAmount || 0),
    activeAdvancesCount: advances._count.id || 0,
  };

  const supplierDuesData = {
    totalSupplierDue: roundMoney(supplierDues._sum.dueAmount || 0),
    pendingPurchasesCount: supplierDues._count.id || 0,
  };

  // Build Dynamic Sales Graph based on selected period
  let salesTrend = [];

  if (normalizedPeriod === "today") {
    // 2-hour interval slots across the day (8 AM to 10 PM)
    const slots = [
      { label: "8 AM - 10 AM", hourStart: 8, hourEnd: 10, sales: 0, bills: 0 },
      { label: "10 AM - 12 PM", hourStart: 10, hourEnd: 12, sales: 0, bills: 0 },
      { label: "12 PM - 2 PM", hourStart: 12, hourEnd: 14, sales: 0, bills: 0 },
      { label: "2 PM - 4 PM", hourStart: 14, hourEnd: 16, sales: 0, bills: 0 },
      { label: "4 PM - 6 PM", hourStart: 16, hourEnd: 18, sales: 0, bills: 0 },
      { label: "6 PM - 8 PM", hourStart: 18, hourEnd: 20, sales: 0, bills: 0 },
      { label: "8 PM - 10 PM", hourStart: 20, hourEnd: 22, sales: 0, bills: 0 },
    ];

    salesList.forEach((s) => {
      const saleHour = new Date(s.saleDate).getHours();
      const slot = slots.find((sl) => saleHour >= sl.hourStart && saleHour < sl.hourEnd);
      if (slot) {
        slot.sales = roundMoney(slot.sales + (s.netPayable || 0));
        slot.bills += 1;
      } else if (saleHour >= 22) {
        slots[slots.length - 1].sales = roundMoney(slots[slots.length - 1].sales + (s.netPayable || 0));
        slots[slots.length - 1].bills += 1;
      } else if (saleHour < 8) {
        slots[0].sales = roundMoney(slots[0].sales + (s.netPayable || 0));
        slots[0].bills += 1;
      }
    });

    salesTrend = slots.map((sl) => ({
      name: sl.label,
      sales: sl.sales,
      bills: sl.bills,
    }));
  } else if (normalizedPeriod === "this_week") {
    // 7 Days of Current Week: Mon, Tue, Wed, Thu, Fri, Sat, Sun
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const weekMap = {};

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      weekMap[key] = {
        name: `${dayNames[i]} (${d.getDate()} ${d.toLocaleDateString("en-IN", { month: "short" })})`,
        shortName: dayNames[i],
        sales: 0,
        bills: 0,
      };
    }

    salesList.forEach((s) => {
      const key = new Date(s.saleDate).toISOString().slice(0, 10);
      if (weekMap[key]) {
        weekMap[key].sales = roundMoney(weekMap[key].sales + (s.netPayable || 0));
        weekMap[key].bills += 1;
      }
    });

    salesTrend = Object.values(weekMap);
  } else {
    // This Month: Days of Current Month from 1 to End of Month
    const totalDaysInMonth = end.getDate();
    const monthMap = {};

    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateObj = new Date(start.getFullYear(), start.getMonth(), d);
      const key = dateObj.toISOString().slice(0, 10);
      monthMap[key] = {
        name: `${d} ${dateObj.toLocaleDateString("en-IN", { month: "short" })}`,
        shortName: `${d}`,
        sales: 0,
        bills: 0,
      };
    }

    salesList.forEach((s) => {
      const key = new Date(s.saleDate).toISOString().slice(0, 10);
      if (monthMap[key]) {
        monthMap[key].sales = roundMoney(monthMap[key].sales + (s.netPayable || 0));
        monthMap[key].bills += 1;
      }
    });

    salesTrend = Object.values(monthMap);
  }

  return {
    period: normalizedPeriod,
    dateRange: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    },
    liveRates,
    sales,
    inventory,
    customerAdvances,
    supplierDues: supplierDuesData,
    salesTrend,
    recentSales,
  };
};
