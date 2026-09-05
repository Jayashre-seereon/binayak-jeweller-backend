import prisma from "../config/db.js";
import {
  findCustomerByPhoneRepo,
  findCustomerByIdRepo,
  createCustomerRepo,
  updateCustomerRepo,
  getCustomerAdjustmentLogsRepo,
} from "../repositories/customerRepository.js";

const roundMoney = (val) => Math.round((Number(val || 0) + Number.EPSILON) * 100) / 100;

export const getOrCreateCustomerService = async (data, storeId, tx = prisma) => {
  const cleanPhone = String(data.customerPhone || data.phone || "").trim().replace(/\D/g, "");
  if (!cleanPhone) return null;

  let customer = await findCustomerByPhoneRepo(cleanPhone, storeId, tx);

  if (!customer) {
    const count = await tx.customer.count({ where: { storeId: Number(storeId) } });
    const customerCode = `CUST-${String(count + 1).padStart(4, "0")}`;

    customer = await createCustomerRepo(
      {
        name: data.customerName || data.name || "Customer",
        phone: cleanPhone,
        address: data.customerAddress || data.address || null,
        city: data.customerCity || data.city || null,
        state: data.customerState || data.state || "ODISHA",
        pan: data.customerPan || data.pan || null,
        gst: data.customerGst || data.gst || null,
        idType: data.customerIdType || data.idType || null,
        idNumber: data.customerIdNumber || data.idNumber || null,
        customerCode,
        storeId: Number(storeId),
      },
      tx
    );
  } else {
    // Optionally update fields if provided
    const updateData = {};
    if (data.customerName && data.customerName.trim() !== "" && customer.name === "Customer") {
      updateData.name = data.customerName.trim();
    }
    if (data.customerAddress && !customer.address) updateData.address = data.customerAddress.trim();
    if (data.customerCity && !customer.city) updateData.city = data.customerCity.trim();
    if (data.customerPan && !customer.pan) updateData.pan = data.customerPan.trim().toUpperCase();
    if (data.customerGst && !customer.gst) updateData.gst = data.customerGst.trim().toUpperCase();

    if (Object.keys(updateData).length > 0) {
      customer = await updateCustomerRepo(customer.id, updateData, tx);
    }
  }

  return customer;
};

export const lookupCustomerByPhoneService = async (phone, storeId) => {
  const cleanPhone = String(phone || "").trim().replace(/\D/g, "");
  if (!cleanPhone || cleanPhone.length < 10) {
    return {
      exists: false,
      customer: null,
      availableAdvances: [],
      availableOldJewellery: [],
      allAdvances: [],
      allOldJewellery: [],
      adjustmentLogs: [],
      pastSales: [],
      summary: {
        totalAvailableAdvance: 0,
        totalAvailableOldGold: 0,
        totalAdjustedHistory: 0,
        totalSalesCount: 0,
      },
    };
  }

  const rawStoreId = Array.isArray(storeId) ? storeId[0] : storeId;
  const numericStoreId = Number(rawStoreId) || 1;

  // 1. Find or discover customer
  let customer = await findCustomerByPhoneRepo(cleanPhone, numericStoreId);

  // 2. Fetch all Advance Receives for this phone / customer
  const advances = await prisma.advanceReceive.findMany({
    where: {
      status: { not: "CANCELLED" },
      OR: [
        ...(customer?.id ? [{ customerId: customer.id }] : []),
        { contactNumber: cleanPhone },
      ],
      storeId: numericStoreId,
    },
    include: {
      vouchers: {
        select: {
          voucherNo: true,
          date: true,
        },
      },
      saleAdjustments: {
        include: {
          sale: {
            select: {
              id: true,
              invoiceNo: true,
              saleDate: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // If customer didn't exist in Customer table but has an advance record, auto-create customer now
  if (!customer && advances.length > 0) {
    const firstAdv = advances[0];
    customer = await getOrCreateCustomerService(
      {
        name: firstAdv.customerName || "Customer",
        phone: cleanPhone,
        address: firstAdv.address,
      },
      numericStoreId
    );
  }

  // 3. Fetch all Old Jewellery Purchases for this phone / customer
  const oldPurchases = await prisma.purchase.findMany({
    where: {
      purchaseType: "OLD",
      OR: [
        ...(customer?.id ? [{ customerId: customer.id }] : []),
        { customerPhone: cleanPhone },
      ],
      storeId: numericStoreId,
    },
    include: {
      items: {
        include: {
          item: true,
          product: true,
          metal: true,
          purityMaster: true,
        },
      },
      saleOldGolds: {
        include: {
          sale: {
            select: {
              id: true,
              invoiceNo: true,
              saleDate: true,
            },
          },
        },
      },
    },
    orderBy: { date: "desc" },
  });

  // If customer didn't exist but has old purchase, auto-create customer
  if (!customer && oldPurchases.length > 0) {
    const firstPur = oldPurchases[0];
    customer = await getOrCreateCustomerService(
      {
        name: firstPur.customerName || "Customer",
        phone: cleanPhone,
        address: firstPur.address,
        idType: firstPur.customerIdType,
        idNumber: firstPur.customerIdNumber,
      },
      numericStoreId
    );
  }

  // 4. Process Advances: Calculate remaining balances & usage history
  const allAdvances = advances.map((adv) => {
    const totalAmount = roundMoney(Number(adv.amount || 0));
    const usedSum = roundMoney(
      adv.saleAdjustments.reduce((s, adj) => s + Number(adj.amount || adj.adjustedAmount || 0), 0)
    );
    const adjustedAmount = Math.max(usedSum, roundMoney(Number(adv.adjustedAmount || 0)));
    const balanceAmount = roundMoney(Math.max(0, totalAmount - adjustedAmount));
    const isFullyUsed = balanceAmount <= 0.01 || adv.status === "FULLY_ADJUSTED";

    const voucherNo = adv.vouchers?.[0]?.voucherNo;
    const displayReceiptNo = voucherNo
      ? `${voucherNo}`
      : adv.specification && adv.specification.startsWith("Receipt Voucher")
      ? adv.specification.replace("Receipt Voucher ", "")
      : `ADV-${adv.id}`;

    return {
      id: adv.id,
      receiptNo: displayReceiptNo,
      voucherNo: voucherNo || null,
      date: adv.createdAt,
      totalAmount,
      adjustedAmount,
      balanceAmount,
      paymentMode: adv.paymentMode,
      specification: adv.specification || "-",
      status: isFullyUsed ? "FULLY_ADJUSTED" : adjustedAmount > 0 ? "PARTIALLY_ADJUSTED" : "AVAILABLE",
      isAvailable: !isFullyUsed,
      adjustments: adv.saleAdjustments.map((adj) => ({
        id: adj.id,
        saleId: adj.saleId,
        invoiceNo: adj.sale?.invoiceNo || `#${adj.saleId}`,
        saleDate: adj.sale?.saleDate || adj.createdAt,
        amount: Number(adj.amount || adj.adjustedAmount || 0),
        remainingBalance: Number(adj.remainingBalance || 0),
        cashierName: adj.cashierName || "-",
      })),
    };
  });

  const availableAdvances = allAdvances.filter((a) => a.isAvailable && a.balanceAmount > 0);

  // 5. Process Old Jewellery: Calculate remaining balances & usage history
  const allOldJewellery = oldPurchases.map((pur) => {
    const totalValuation = roundMoney(Number(pur.netPayable || pur.totalAmount || pur.grossAmount || 0));
    const usedSum = roundMoney(
      pur.saleOldGolds.reduce((s, og) => s + Number(og.value || og.adjustedAmount || 0), 0)
    );
    const adjustedAmount = Math.max(usedSum, roundMoney(Number(pur.adjustedAmount || 0)));
    const balanceAmount = roundMoney(Math.max(0, totalValuation - adjustedAmount));
    const isFullyUsed = balanceAmount <= 0.01 || pur.adjustmentStatus === "FULLY_ADJUSTED";

    const itemSummary = pur.items
      .map((it) => {
        const name = it.item?.name || it.product?.name || it.metal?.name || "Old Jewellery";
        const purity = it.purityMaster?.name || (it.purity ? `${it.purity}K` : "");
        const wt = Number(it.grossWeight || 0).toFixed(3);
        return `${name} ${purity} (${wt}g)`;
      })
      .join(", ");

    const totalGrossWt = pur.items.reduce((s, it) => s + Number(it.grossWeight || 0), 0);
    const totalNetWt = pur.items.reduce((s, it) => s + Number(it.netWeight || it.grossWeight || 0), 0);
    const totalPcs = pur.items.reduce((s, it) => s + Number(it.pieces || 1), 0);

    return {
      id: pur.id,
      invoiceNo: pur.invoiceNo || pur.referenceNo || `PUR-OLD-${pur.id}`,
      date: pur.date,
      itemSummary: itemSummary || "Old Jewellery Items",
      totalPcs,
      totalGrossWeight: roundMoney(totalGrossWt),
      totalNetWeight: roundMoney(totalNetWt),
      totalValuation,
      adjustedAmount,
      balanceAmount,
      status: isFullyUsed ? "FULLY_ADJUSTED" : adjustedAmount > 0 ? "PARTIALLY_ADJUSTED" : "AVAILABLE",
      isAvailable: !isFullyUsed,
      adjustments: pur.saleOldGolds.map((og) => ({
        id: og.id,
        saleId: og.saleId,
        invoiceNo: og.sale?.invoiceNo || `#${og.saleId}`,
        saleDate: og.sale?.saleDate || og.createdAt,
        amount: Number(og.value || og.adjustedAmount || 0),
        remainingBalance: Number(og.remainingBalance || 0),
        cashierName: og.cashierName || "-",
      })),
    };
  });

  const availableOldJewellery = allOldJewellery.filter((oj) => oj.isAvailable && oj.balanceAmount > 0);

  // 6. Fetch Adjustment Logs
  let adjustmentLogs = [];
  if (customer?.id) {
    adjustmentLogs = await getCustomerAdjustmentLogsRepo(customer.id, numericStoreId);
  }

  // 7. Fetch Past Sales
  const pastSales = await prisma.sale.findMany({
    where: {
      OR: [
        ...(customer?.id ? [{ customerId: customer.id }] : []),
        { customerPhone: cleanPhone },
      ],
      storeId: numericStoreId,
    },
    select: {
      id: true,
      invoiceNo: true,
      saleDate: true,
      grossAmount: true,
      totalTax: true,
      subTotal: true,
      advanceAmount: true,
      oldGoldAmount: true,
      netPayable: true,
      paidAmount: true,
      dueAmount: true,
      cashierName: true,
    },
    orderBy: { saleDate: "desc" },
  });

  const totalAvailableAdvance = roundMoney(
    availableAdvances.reduce((s, a) => s + a.balanceAmount, 0)
  );
  const totalAvailableOldGold = roundMoney(
    availableOldJewellery.reduce((s, oj) => s + oj.balanceAmount, 0)
  );
  const totalAdjustedHistory = roundMoney(
    adjustmentLogs.reduce((s, log) => s + Number(log.adjustedAmount || 0), 0)
  );

  return {
    exists: Boolean(customer),
    customer: customer || {
      name: "",
      phone: cleanPhone,
      address: "",
      city: "Bhubaneswar - 766001",
      state: "ODISHA",
      pan: "",
      gst: "",
    },
    availableAdvances,
    availableOldJewellery,
    allAdvances,
    allOldJewellery,
    adjustmentLogs,
    pastSales,
    summary: {
      totalAvailableAdvance,
      totalAvailableOldGold,
      totalAdjustedHistory,
      totalSalesCount: pastSales.length,
    },
  };
};
