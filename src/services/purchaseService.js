import prisma from "../config/db.js";
import { numberToWordsIndian } from "../utils/numberToWords.js";
import {
  createPurchaseRepo,
  getPurchasesByStore,
  getPurchasesByStoreAndPhone,
  getPurchaseByIdRepo,
  getPurchaseItemsByPurchaseIdRepo,
  updatePurchaseRepo,
  deletePurchaseRepo,
  getPurchaseReportRepo,
  countPurchases
} from "../repositories/purchaseRepository.js";
import { generateInvoiceNo } from "../utils/purchaseCodeGenerator.js";
import { getOrCreateCustomerService } from "./customerService.js";
import { getReportDateRange } from "../utils/reportDateFilter.js";
const purchaseError = (message) => new Error(message);

const hasInventoryForPurchase = async (purchaseId) => {
  const inventory = await prisma.inventory.findFirst({
    where: {
      purchaseId: Number(purchaseId),
    },
    select: {
      id: true,
    },
  });

  return Boolean(inventory);
};

const buildPurchaseItemCode = (id) => `PITM-${String(id).padStart(4, "0")}`;

const sanitizePurchaseItem = (purchaseItem) => {
  return {
    ...purchaseItem,
    purchaseitemcode: purchaseItem?.purchaseItemCode || buildPurchaseItemCode(purchaseItem.id),
  };
};

const withPurchaseItemUnits = (purchase) => ({
  ...purchase,
  unit: "₹",
  weightUnit: "gm",
  items: Array.isArray(purchase?.items)
    ? purchase.items.map((item) => ({
        ...sanitizePurchaseItem(item),
        unit: "₹",
        weightUnit: "gm",
        grossWeightUnit: "gm",
        stoneWeightUnit: "gm",
        netWeightUnit: "gm",
        actualWeightUnit: "gm",
        balanceWeightUnit: "gm",
        rateUnit: "₹/gm",
        metalAmountUnit: "₹",
        stoneAmountUnit: "₹",
        otherAmountUnit: "₹",
        totalAmountUnit: "₹",
      }))
    : purchase?.items,
});

const attachPurchaseItemCodes = async (purchase) => {
  if (!purchase?.items?.length) return purchase;

  for (const purchaseItem of purchase.items) {
    if (!purchaseItem.purchaseItemCode) {
      const purchaseItemCode = buildPurchaseItemCode(purchaseItem.id);
      await prisma.purchaseItem.update({
        where: { id: purchaseItem.id },
        data: { purchaseItemCode }
      });
      purchaseItem.purchaseItemCode = purchaseItemCode;
    }
  }

  return withPurchaseItemUnits({
    ...purchase,
    items: purchase.items.map(sanitizePurchaseItem)
  });
};

export const createPurchase = async (data, storeId) => {
  const numericStoreId = Number(storeId);

  if (!numericStoreId) {
    throw purchaseError("Please select a store before creating a purchase.");
  }

  if (!data.purchaseType) {
    throw purchaseError("Please select a purchase type.");
  }

  if (!["ORNAMENT", "OLD", "BULLION"].includes(data.purchaseType)) {
    throw purchaseError("Please choose a valid purchase type.");
  }

  


  

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw purchaseError("Please add at least one purchase item.");
  }

  const purchaseItems = data.items.map((item) => ({
    itemId: item.itemId ? Number(item.itemId) : null,
    productId: item.productId ? Number(item.productId) : null,
    metalId: item.metalId ? Number(item.metalId) : null,
    purityId: item.purityId ? Number(item.purityId) : null,
    gradeId: item.gradeId ? Number(item.gradeId) : null,
    stoneId: item.stoneId ? Number(item.stoneId) : null,

    pieces: item.pieces ? Number(item.pieces) : null,

    grossWeight: Number(item.grossWeight || 0),
    stoneWeight: Number(item.stoneWeight || 0),
    netWeight: Number(item.netWeight || 0),

    dustWeight: Number(item.dustWeight || 0),
    deductionWeight: Number(item.deductionWeight || 0),
    pureWeight: Number(item.pureWeight || 0),
    actualWeight: Number(item.actualWeight || 0),
    balanceWeight: Number(item.balanceWeight || 0),

    purity:
      item.purity !== undefined && item.purity !== null && item.purity !== ""
        ? Number(item.purity)
        : null,
    touchPercentage: item.touchPercentage ? Number(item.touchPercentage) : null,
    fineness: item.fineness ? Number(item.fineness) : null,

    rate: Number(item.rate || 0),

    makingCharges: Number(item.makingCharges || 0),
    wastagePercentage: Number(item.wastagePercentage || 0),
    hallmarkCharges: Number(item.hallmarkCharges || 0),

    metalAmount: Number(item.metalAmount || 0),
    stoneAmount: Number(item.stoneAmount || 0),
    otherAmount: Number(item.otherAmount || 0),
    discount: Number(item.discount || 0),
    totalAmount: Number(item.totalAmount || 0),

    huidNo: item.huidNo || null,
    hsnCode: item.hsnCode || "711319",
    barSerialNo: item.barSerialNo || null,
    assayCertNo: item.assayCertNo || null,
    vatType: item.vatType || null,
    narration: item.narration || null,
    itemPhoto: item.itemPhoto || null,
    extraDetails: item.extraDetails || null
  }));

  const rawPayments = Array.isArray(data.payments) && data.payments.length > 0
    ? data.payments
    : Number(data.paidAmount || 0) > 0
      ? [{ paymentMode: data.paymentMode || "CASH", amount: Number(data.paidAmount) }]
      : [];

  const purchasePayments = rawPayments
    .filter((p) => Number(p.amount || 0) > 0)
    .map((p) => ({
      storeId: numericStoreId,
      paymentMode: p.paymentMode || "CASH",
      paymentChannel: p.paymentChannel || null,
      amount: Math.round((Number(p.amount || 0) + Number.EPSILON) * 100) / 100,
      transactionId: p.transactionId || p.referenceNo || null,
      referenceNo: p.referenceNo || p.transactionId || null,
      description: p.description || null,
      paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
      narration: p.narration || null,
    }));

  const totalPaid = Math.round((purchasePayments.reduce((s, p) => s + Number(p.amount || 0), 0) + Number.EPSILON) * 100) / 100;
  const netPayable = Number(data.netPayable || data.totalAmount || 0);

  if (Math.abs(totalPaid - netPayable) > 0.01) {
    throw purchaseError(
      `Paid amount (${totalPaid.toFixed(2)}) must exactly match total amount (${netPayable.toFixed(2)}).`
    );
  }

  let customerId = null;
  if (data.customerPhone?.trim()) {
    const customer = await getOrCreateCustomerService(
      {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        customerAddress: data.address,
        customerIdType: data.customerIdType,
        customerIdNumber: data.customerIdNumber,
      },
      numericStoreId
    );
    customerId = customer?.id || null;
  }

  const buildPurchaseData = (invoiceNo) => ({
    invoiceNo,
    purchaseType: data.purchaseType,
    partyId: data.partyId ? Number(data.partyId) : null,
    employeeId: data.employeeId ? Number(data.employeeId) : null,
    customerId,
    storeId: numericStoreId,
    date: data.date ? new Date(data.date) : new Date(),
    referenceNo: data.referenceNo || null,
    referenceDate: data.referenceDate ? new Date(data.referenceDate) : null,
    address: data.address || null,
    placeOfSupply: data.placeOfSupply || null,
    isRCM: Boolean(data.isRCM),
    customerName: data.customerName || null,
    customerPhone: data.customerPhone || null,
    customerIdType: data.customerIdType || null,
    customerIdNumber: data.customerIdNumber || null,
    document: data.document || null,
    attachments: data.attachments || null,
    grossAmount: Number(data.grossAmount || data.subtotal || 0),
    taxableAmount: Number(data.taxableAmount || data.subtotal || 0),
    subtotal: Number(data.subtotal || 0),
    discount: Number(data.discount || 0),
    igst: Number(data.igst || 0),
    cgst: Number(data.cgst || 0),
    sgst: Number(data.sgst || 0),
    taxAmount: Number(data.taxAmount || 0),
    roundOff: Number(data.roundOff || 0),
    totalAmount: Number(data.totalAmount || netPayable),
    netPayable: netPayable,
    adjustedAmount: 0,
    balanceAmount: netPayable,
    adjustmentStatus: "AVAILABLE",
    paymentMode: data.paymentMode || (purchasePayments[0]?.paymentMode ?? null),
    paidAmount: totalPaid,
    dueAmount: Math.max(0, Math.round((netPayable - totalPaid + Number.EPSILON) * 100) / 100),
    narration: data.narration || null,
    items: {
      create: purchaseItems
    },
    payments: {
      create: purchasePayments
    }
  });

  // Retry on unique invoice collisions.
  const maxAttempts = 3;
  let lastError = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const invoiceNo = await generateInvoiceNo(numericStoreId);

    // ===== CHANGED: only look up party if partyId given; else require walk-in KYC for OLD =====
    let party = null;
    if (data.partyId) {
      party = await prisma.partymaster.findFirst({
        where: {
          id: Number(data.partyId),
          storeId: numericStoreId
        }
      });

      if (!party) {
        throw purchaseError("The selected customer is not linked to this store. Please choose a valid customer.");
      }
    } else if (data.purchaseType === "OLD") {
      if (!data.customerName || !data.customerPhone) {
        throw purchaseError("Please enter customer name and phone for a walk-in old gold purchase.");
      }
    }

    if (data.employeeId) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: Number(data.employeeId),
          storeId: numericStoreId
        }
      });

      if (!employee) {
        throw purchaseError("The selected employee is not linked to this store. Please choose a valid employee.");
      }
    }

    for (const item of data.items) {
      if (item.productId) {
        const product = await prisma.product.findFirst({
          where: { id: Number(item.productId), storeId: numericStoreId }
        });
        if (!product) throw purchaseError("The selected product is not linked to this store.");
      }

      if (item.metalId) {
        const metal = await prisma.metal.findFirst({
          where: { id: Number(item.metalId), storeId: numericStoreId }
        });
        if (!metal) throw purchaseError("The selected metal is not linked to this store.");
      }

      if (item.purityId) {
        const purity = await prisma.purity.findFirst({
          where: { id: Number(item.purityId), storeId: numericStoreId }
        });
        if (!purity) throw purchaseError("The selected purity is not linked to this store.");
      }

      if (item.gradeId) {
        const grade = await prisma.grade.findFirst({
          where: { id: Number(item.gradeId), storeId: numericStoreId }
        });
        if (!grade) throw purchaseError("The selected grade is not linked to this store.");
      }

      if (item.stoneId) {
        const stone = await prisma.stone.findFirst({
          where: { id: Number(item.stoneId), storeId: numericStoreId }
        });
        if (!stone) throw purchaseError("The selected stone is not linked to this store.");
      }
    }

    try {
      return withPurchaseItemUnits(
        await attachPurchaseItemCodes(
          await createPurchaseRepo(buildPurchaseData(invoiceNo))
        )
      );
    } catch (error) {
      lastError = error;
      if (error?.code === "P2002" && attempt < maxAttempts) {
        continue;
      }
      throw error;
    }
  }

  throw lastError || new Error("Failed to create purchase");
};

export const getPurchases = async (storeId) => {
  const purchases = await getPurchasesByStore(Number(storeId));
  return await Promise.all(purchases.map((purchase) => attachPurchaseItemCodes(purchase)));
};

export const getPurchaseById = async (id, storeId) => {
  const purchase = await getPurchaseByIdRepo(Number(id));

  if (!purchase) {
    throw purchaseError("Purchase record not found.");
  }

  if (purchase.storeId !== Number(storeId)) {
    throw purchaseError("You do not have access to this purchase.");
  }

  return await attachPurchaseItemCodes(purchase);
};

export const getPurchaseItemsByPurchaseId = async (purchaseId, storeId) => {
  const purchase = await getPurchaseByIdRepo(Number(purchaseId));

  if (!purchase) {
    throw purchaseError("Purchase record not found.");
  }

  if (purchase.storeId !== Number(storeId)) {
    throw purchaseError("You do not have access to this purchase.");
  }

  const purchaseItems = await getPurchaseItemsByPurchaseIdRepo(
    Number(purchaseId),
    Number(storeId)
  );

  return purchaseItems.map(sanitizePurchaseItem);
};

// ===== CHANGED: updatePurchase - added if-blocks for all new fields =====
export const updatePurchase = async (id, data, storeId) => {
  const numericStoreId = Number(storeId);

  const purchase = await getPurchaseByIdRepo(Number(id));

  if (!purchase) {
    throw purchaseError("Purchase record not found.");
  }

  if (purchase.storeId !== numericStoreId) {
    throw purchaseError("You do not have access to this purchase.");
  }

  if (await hasInventoryForPurchase(purchase.id)) {
    throw purchaseError(
      "This purchase has already been added to inventory and cannot be edited."
    );
  }

  const updateData = {};

  if (data.purchaseType !== undefined) {
    if (!["ORNAMENT", "OLD", "BULLION"].includes(data.purchaseType)) {
      throw purchaseError("Please choose a valid purchase type.");
    }
    updateData.purchaseType = data.purchaseType;
  }

  // ===== CHANGED: partyId update now allows clearing to null =====
  if (data.partyId !== undefined) {
    if (data.partyId === null || data.partyId === "") {
      updateData.partyId = null;
    } else {
      const party = await prisma.partymaster.findFirst({
        where: { id: Number(data.partyId), storeId: numericStoreId }
      });
      if (!party) throw purchaseError("The selected customer is not linked to this store. Please choose a valid customer.");
      updateData.partyId = Number(data.partyId);
    }
  }

  if (data.employeeId !== undefined) {
    if (data.employeeId === null || data.employeeId === "") {
      updateData.employeeId = null;
    } else {
      const employee = await prisma.employee.findFirst({
        where: { id: Number(data.employeeId), storeId: numericStoreId }
      });
      if (!employee) throw purchaseError("The selected employee is not linked to this store. Please choose a valid employee.");
      updateData.employeeId = Number(data.employeeId);
    }
  }

  if (data.date !== undefined) {
    updateData.date = new Date(data.date);
  }

  if (data.referenceNo !== undefined) {
    updateData.referenceNo = data.referenceNo;
  }

  if (data.referenceDate !== undefined) {
    updateData.referenceDate = data.referenceDate ? new Date(data.referenceDate) : null;
  }

  if (data.address !== undefined) {
    updateData.address = data.address;
  }

  if (data.placeOfSupply !== undefined) {                              // NEW
    updateData.placeOfSupply = data.placeOfSupply;
  }

  if (data.isRCM !== undefined) {                                      // NEW
    updateData.isRCM = Boolean(data.isRCM);
  }

  if (data.customerName !== undefined) {                                // NEW
    updateData.customerName = data.customerName;
  }

  if (data.customerPhone !== undefined) {                               // NEW
    updateData.customerPhone = data.customerPhone;
  }

  if (data.customerIdType !== undefined) {                              // NEW
    updateData.customerIdType = data.customerIdType;
  }

  if (data.customerIdNumber !== undefined) {                            // NEW
    updateData.customerIdNumber = data.customerIdNumber;
  }

  if (data.document !== undefined) {
    updateData.document = data.document;
  }

  if (data.attachments !== undefined) {                                 // NEW
    updateData.attachments = data.attachments;
  }

  if (data.subtotal !== undefined) {
    updateData.subtotal = Number(data.subtotal || 0);
  }

  if (data.discount !== undefined) {                                    // NEW
    updateData.discount = Number(data.discount || 0);
  }

  if (data.igst !== undefined) {
    updateData.igst = Number(data.igst || 0);
  }

  if (data.cgst !== undefined) {
    updateData.cgst = Number(data.cgst || 0);
  }

  if (data.sgst !== undefined) {
    updateData.sgst = Number(data.sgst || 0);
  }

  if (data.taxAmount !== undefined) {
    updateData.taxAmount = Number(data.taxAmount || 0);
  }

  if (data.roundOff !== undefined) {                                    // NEW
    updateData.roundOff = Number(data.roundOff || 0);
  }

  if (data.totalAmount !== undefined) {
    updateData.totalAmount = Number(data.totalAmount || 0);
  }

  if (data.paymentMode !== undefined) {
    updateData.paymentMode = data.paymentMode;
  }

  if (data.paidAmount !== undefined) {
    updateData.paidAmount = Number(data.paidAmount || 0);
  }

  if (data.dueAmount !== undefined) {
    updateData.dueAmount = Number(data.dueAmount || 0);
  }

  if (data.narration !== undefined) {
    updateData.narration = data.narration;
  }

  if (data.items !== undefined) {
    if (!Array.isArray(data.items) || data.items.length === 0) {
      throw purchaseError("Please add at least one purchase item.");
    }

    for (const item of data.items) {
      if (item.itemId) {
        const purchaseItem = await prisma.item.findFirst({
          where: { id: Number(item.itemId), storeId: numericStoreId }
        });
        if (!purchaseItem) throw purchaseError("The selected item is not linked to this store.");
      }

      if (item.productId) {
        const product = await prisma.product.findFirst({
          where: { id: Number(item.productId), storeId: numericStoreId }
        });
        if (!product) throw purchaseError("The selected product is not linked to this store.");
      }

      if (item.metalId) {
        const metal = await prisma.metal.findFirst({
          where: { id: Number(item.metalId), storeId: numericStoreId }
        });
        if (!metal) throw purchaseError("The selected metal is not linked to this store.");
      }

      if (item.purityId) {
        const purity = await prisma.purity.findFirst({
          where: { id: Number(item.purityId), storeId: numericStoreId }
        });
        if (!purity) throw purchaseError("The selected purity is not linked to this store.");
      }

      if (item.gradeId) {
        const grade = await prisma.grade.findFirst({
          where: { id: Number(item.gradeId), storeId: numericStoreId }
        });
        if (!grade) throw purchaseError("The selected grade is not linked to this store.");
      }

      if (item.stoneId) {
        const stone = await prisma.stone.findFirst({
          where: { id: Number(item.stoneId), storeId: numericStoreId }
        });
        if (!stone) throw purchaseError("The selected stone is not linked to this store.");
      }
    }

    const purchaseItems = data.items.map((item) => ({
      itemId: item.itemId ? Number(item.itemId) : null,
      productId: item.productId ? Number(item.productId) : null,
      metalId: item.metalId ? Number(item.metalId) : null,
      purityId: item.purityId ? Number(item.purityId) : null,
      gradeId: item.gradeId ? Number(item.gradeId) : null,
      stoneId: item.stoneId ? Number(item.stoneId) : null,
      pieces: item.pieces ? Number(item.pieces) : null,
      grossWeight: Number(item.grossWeight || 0),
      stoneWeight: Number(item.stoneWeight || 0),
      netWeight: Number(item.netWeight || 0),
      dustWeight: Number(item.dustWeight || 0),
      deductionWeight: Number(item.deductionWeight || 0),
      pureWeight: Number(item.pureWeight || 0),
      actualWeight: Number(item.actualWeight || 0),
      balanceWeight: Number(item.balanceWeight || 0),
      purity:
        item.purity !== undefined && item.purity !== null && item.purity !== ""
          ? Number(item.purity)
          : null,
      touchPercentage: item.touchPercentage ? Number(item.touchPercentage) : null,
      fineness: item.fineness ? Number(item.fineness) : null,
      rate: Number(item.rate || 0),
      makingCharges: Number(item.makingCharges || 0),
      wastagePercentage: Number(item.wastagePercentage || 0),
      hallmarkCharges: Number(item.hallmarkCharges || 0),
      metalAmount: Number(item.metalAmount || 0),
      stoneAmount: Number(item.stoneAmount || 0),
      otherAmount: Number(item.otherAmount || 0),
      discount: Number(item.discount || 0),
      totalAmount: Number(item.totalAmount || 0),
      huidNo: item.huidNo || null,
      hsnCode: item.hsnCode || "711319",
      barSerialNo: item.barSerialNo || null,
      assayCertNo: item.assayCertNo || null,
      vatType: item.vatType || null,
      narration: item.narration || null,
      itemPhoto: item.itemPhoto || null,
      extraDetails: item.extraDetails || null
    }));

    updateData.items = {
      deleteMany: {},
      create: purchaseItems
    };
  }

  if (data.grossAmount !== undefined) updateData.grossAmount = Number(data.grossAmount || 0);
  if (data.taxableAmount !== undefined) updateData.taxableAmount = Number(data.taxableAmount || 0);
  if (data.netPayable !== undefined) updateData.netPayable = Number(data.netPayable || 0);

  if (data.payments !== undefined && Array.isArray(data.payments)) {
    const updatedPayments = data.payments
      .filter((p) => Number(p.amount || 0) > 0)
      .map((p) => ({
        storeId: numericStoreId,
        paymentMode: p.paymentMode || "CASH",
        paymentChannel: p.paymentChannel || null,
        amount: Math.round((Number(p.amount || 0) + Number.EPSILON) * 100) / 100,
        transactionId: p.transactionId || p.referenceNo || null,
        referenceNo: p.referenceNo || p.transactionId || null,
        description: p.description || null,
        paymentDate: p.paymentDate ? new Date(p.paymentDate) : new Date(),
        narration: p.narration || null,
      }));

    const totalPaid = Math.round((updatedPayments.reduce((s, p) => s + Number(p.amount || 0), 0) + Number.EPSILON) * 100) / 100;
    const net = Number(data.netPayable || data.totalAmount || purchase.netPayable || purchase.totalAmount || 0);

    if (Math.abs(totalPaid - net) > 0.01) {
      throw purchaseError(
        `Paid amount (${totalPaid.toFixed(2)}) must exactly match total amount (${net.toFixed(2)}).`
      );
    }

    updateData.paidAmount = totalPaid;
    updateData.dueAmount = Math.max(0, Math.round((net - totalPaid + Number.EPSILON) * 100) / 100);
    if (updatedPayments[0]?.paymentMode) updateData.paymentMode = updatedPayments[0].paymentMode;

    updateData.payments = {
      deleteMany: {},
      create: updatedPayments
    };
  }

  return withPurchaseItemUnits(await attachPurchaseItemCodes(await updatePurchaseRepo(Number(id), updateData)));
};

export const deletePurchase = async (id, storeId) => {
  const purchase = await getPurchaseByIdRepo(Number(id));

  if (!purchase) {
    throw purchaseError("Purchase record not found.");
  }

  if (purchase.storeId !== Number(storeId)) {
    throw purchaseError("You do not have access to this purchase.");
  }

  if (await hasInventoryForPurchase(purchase.id)) {
    throw purchaseError(
      "This purchase has already been added to inventory and cannot be deleted."
    );
  }

  return await deletePurchaseRepo(Number(id));
};

export const getPurchaseCount = async (storeId) => {
  return await countPurchases(Number(storeId));
};

export const getOldGoldPurchasesByPhoneService = async (
  storeId,
  phone
) => {
  const numericStoreId = Number(storeId);
  const customerPhone = String(phone || "").trim();

  if (!numericStoreId) {
    throw purchaseError("Please select a store before viewing old gold purchases.");
  }

  if (!customerPhone) {
    throw purchaseError("Please enter a customer phone number.");
  }

  return await getPurchasesByStoreAndPhone(numericStoreId, customerPhone);
};

export const getPurchaseReportService = async ({
  storeId,
  period = "THIS_MONTH",
  fromDate,
  toDate,
  purchaseType = "ALL",
}) => {
  const dateRange = getReportDateRange(
    period,
    fromDate,
    toDate
  );

  const purchases =
    await getPurchaseReportRepo(
      storeId ? Number(storeId) : undefined,
      dateRange.fromDate,
      dateRange.toDate,
      purchaseType
    );

  const summary = purchases.reduce(
    (acc, purchase) => {
      acc.totalBills += 1;
      acc.totalInvoices += 1;

      acc.totalItems +=
        purchase.items?.length || 0;

      const amount = Number(
        purchase.netPayable ||
        purchase.totalAmount ||
        purchase.grossAmount ||
        0
      );

      acc.totalPurchase += amount;
      acc.netPurchase += amount;
      acc.totalAmount += amount;

      const gross = Number(purchase.grossAmount || amount);
      acc.grossAmount += gross;

      const paid = Number(purchase.paidAmount || 0);
      acc.paidAmount += paid;

      const due = Number(
        purchase.balanceAmount ??
        purchase.dueAmount ??
        Math.max(0, amount - paid)
      );
      acc.balanceAmount += due;
      acc.dueAmount += due;

      if (
        purchase.purchaseType === "ORNAMENT"
      ) {
        acc.ornamentPurchase += amount;
      } else if (
        purchase.purchaseType === "OLD"
      ) {
        acc.oldPurchase += amount;
      } else if (
        purchase.purchaseType === "BULLION"
      ) {
        acc.bullionPurchase += amount;
      }

      return acc;
    },
    {
      totalBills: 0,
      totalInvoices: 0,
      totalItems: 0,
      totalPurchase: 0,
      netPurchase: 0,
      totalAmount: 0,
      grossAmount: 0,
      paidAmount: 0,
      balanceAmount: 0,
      dueAmount: 0,
      ornamentPurchase: 0,
      oldPurchase: 0,
      bullionPurchase: 0,
    }
  );

  return {
    filter: {
      period,
      purchaseType,
      fromDate: dateRange.fromDate,
      toDate: dateRange.toDate,
    },

    summary,

    purchases,
  };
};