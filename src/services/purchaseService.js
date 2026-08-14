import prisma from "../config/db.js";
import {
  createPurchaseRepo,
  getPurchasesByStore,
  getPurchaseByIdRepo,
  updatePurchaseRepo,
  deletePurchaseRepo,
  countPurchases
} from "../repositories/purchaseRepository.js";
import { generateInvoiceNo } from "../utils/purchaseCodeGenerator.js";

const buildPurchaseItemCode = (id) => `PITM-${String(id).padStart(4, "0")}`;

const sanitizePurchaseItem = (purchaseItem) => {
  const item = purchaseItem?.item || null;
  const product = purchaseItem?.product || null;

  const { itemCode, ...cleanItem } = item || {};
  const { productCode, ...cleanProduct } = product || {};

  return {
    ...purchaseItem,
    purchaseitemcode: purchaseItem?.purchaseItemCode || buildPurchaseItemCode(purchaseItem.id),
    itemcode: itemCode || null,
    item: item ? cleanItem : null,
    product: product ? cleanProduct : null
  };
};

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

  return {
    ...purchase,
    items: purchase.items.map(sanitizePurchaseItem)
  };
};

export const createPurchase = async (data, storeId) => {
  const numericStoreId = Number(storeId);

  if (!numericStoreId) {
    throw new Error("Store ID is required");
  }

 const invoiceNo = await generateInvoiceNo(numericStoreId);

  if (!data.purchaseType) {
    throw new Error("Purchase type is required");
  }

  if (!["ORNAMENT", "OLD", "BULLION"].includes(data.purchaseType)) {
    throw new Error("Invalid purchase type");
  }

  

  if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
    throw new Error("At least one purchase item is required");
  }

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
      throw new Error("Party not found for this store");
    }
  } else if (data.purchaseType === "OLD") {
    if (!data.customerName || !data.customerPhone) {
      throw new Error("Customer name and phone are required for walk-in old gold purchase");
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
      throw new Error("Employee not found for this store");
    }
  }

  for (const item of data.items) {
    if (item.productId) {
      const product = await prisma.product.findFirst({
        where: { id: Number(item.productId), storeId: numericStoreId }
      });
      if (!product) throw new Error("Product not found for this store");
    }

    if (item.metalId) {
      const metal = await prisma.metal.findFirst({
        where: { id: Number(item.metalId), storeId: numericStoreId }
      });
      if (!metal) throw new Error("Metal not found for this store");
    }

    if (item.purityId) {
      const purity = await prisma.purity.findFirst({
        where: { id: Number(item.purityId), storeId: numericStoreId }
      });
      if (!purity) throw new Error("Purity not found for this store");
    }

    if (item.gradeId) {
      const grade = await prisma.grade.findFirst({
        where: { id: Number(item.gradeId), storeId: numericStoreId }
      });
      if (!grade) throw new Error("Grade not found for this store");
    }

    if (item.stoneId) {
      const stone = await prisma.stone.findFirst({
        where: { id: Number(item.stoneId), storeId: numericStoreId }
      });
      if (!stone) throw new Error("Stone not found for this store");
    }
  }

  // ===== CHANGED: added new fields inside item mapping =====
  const purchaseItems = data.items.map((item) => ({
    itemId: item.itemId ? Number(item.itemId) : null,
    productId: item.productId ? Number(item.productId) : null,
    metalId: item.metalId ? Number(item.metalId) : null,
    purityId: item.purityId ? Number(item.purityId) : null,
    gradeId: item.gradeId ? Number(item.gradeId) : null,
    stoneId: item.stoneId ? Number(item.stoneId) : null,

    pieces: item.pieces ? Number(item.pieces) : null,                    // NEW

    grossWeight: Number(item.grossWeight || 0),
    stoneWeight: Number(item.stoneWeight || 0),
    netWeight: Number(item.netWeight || 0),

    dustWeight: Number(item.dustWeight || 0),
    deductionWeight: Number(item.deductionWeight || 0),               // NEW
    pureWeight: Number(item.pureWeight || 0),
    actualWeight: Number(item.actualWeight || 0),
    balanceWeight: Number(item.balanceWeight || 0),

    purity:
      item.purity !== undefined && item.purity !== null && item.purity !== ""
        ? Number(item.purity)
        : null,
    touchPercentage: item.touchPercentage ? Number(item.touchPercentage) : null, // NEW
    fineness: item.fineness ? Number(item.fineness) : null,           // NEW

    rate: Number(item.rate || 0),

    makingCharges: Number(item.makingCharges || 0),                   // NEW
    wastagePercentage: Number(item.wastagePercentage || 0),           // NEW
    hallmarkCharges: Number(item.hallmarkCharges || 0),                // NEW

    metalAmount: Number(item.metalAmount || 0),
    stoneAmount: Number(item.stoneAmount || 0),
    otherAmount: Number(item.otherAmount || 0),
    discount: Number(item.discount || 0),                              // NEW
    totalAmount: Number(item.totalAmount || 0),

    huidNo: item.huidNo || null,                                       // NEW
    tagNo: item.tagNo || null,                                         // NEW
    barSerialNo: item.barSerialNo || null,                             // NEW
    assayCertNo: item.assayCertNo || null,                             // NEW

    vatType: item.vatType || null,
    narration: item.narration || null,
    itemPhoto: item.itemPhoto || null,                                 // NEW
    extraDetails: item.extraDetails || null                            // NEW
  }));

  // ===== CHANGED: added new fields in purchaseData =====
  const purchaseData = {
  invoiceNo,
  purchaseType: data.purchaseType,

    partyId: data.partyId ? Number(data.partyId) : null,               // CHANGED (was always Number(data.partyId))

    employeeId: data.employeeId ? Number(data.employeeId) : null,
    storeId: numericStoreId,

    date: data.date ? new Date(data.date) : new Date(),

    referenceNo: data.referenceNo || null,
    referenceDate: data.referenceDate ? new Date(data.referenceDate) : null,

    address: data.address || null,

    placeOfSupply: data.placeOfSupply || null,                         // NEW
    isRCM: Boolean(data.isRCM),                                        // NEW

    customerName: data.customerName || null,                           // NEW
    customerPhone: data.customerPhone || null,                         // NEW
    customerIdType: data.customerIdType || null,                       // NEW
    customerIdNumber: data.customerIdNumber || null,                   // NEW

    document: data.document || null,
    attachments: data.attachments || null,                             // NEW

    subtotal: Number(data.subtotal || 0),
    discount: Number(data.discount || 0),                              // NEW

    igst: Number(data.igst || 0),
    cgst: Number(data.cgst || 0),
    sgst: Number(data.sgst || 0),

    taxAmount: Number(data.taxAmount || 0),
    roundOff: Number(data.roundOff || 0),                              // NEW
    totalAmount: Number(data.totalAmount || 0),

    paymentMode: data.paymentMode || null,

    paidAmount: Number(data.paidAmount || 0),
    dueAmount: Number(data.dueAmount || 0),

    narration: data.narration || null,


    items: {
      create: purchaseItems
    }
  };

  return await attachPurchaseItemCodes(await createPurchaseRepo(purchaseData));
};

export const getPurchases = async (storeId) => {
  const purchases = await getPurchasesByStore(Number(storeId));
  return await Promise.all(purchases.map((purchase) => attachPurchaseItemCodes(purchase)));
};

export const getPurchaseById = async (id, storeId) => {
  const purchase = await getPurchaseByIdRepo(Number(id));

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  if (purchase.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  return await attachPurchaseItemCodes(purchase);
};

// ===== CHANGED: updatePurchase - added if-blocks for all new fields =====
export const updatePurchase = async (id, data, storeId) => {
  const purchase = await getPurchaseByIdRepo(Number(id));

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  if (purchase.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  const updateData = {};

  if (data.purchaseType !== undefined) {
    if (!["ORNAMENT", "OLD", "BULLION"].includes(data.purchaseType)) {
      throw new Error("Invalid purchase type");
    }
    updateData.purchaseType = data.purchaseType;
  }

  // ===== CHANGED: partyId update now allows clearing to null =====
  if (data.partyId !== undefined) {
    if (data.partyId === null || data.partyId === "") {
      updateData.partyId = null;
    } else {
      const party = await prisma.partymaster.findFirst({
        where: { id: Number(data.partyId), storeId: Number(storeId) }
      });
      if (!party) throw new Error("Party not found for this store");
      updateData.partyId = Number(data.partyId);
    }
  }

  if (data.employeeId !== undefined) {
    if (data.employeeId === null || data.employeeId === "") {
      updateData.employeeId = null;
    } else {
      const employee = await prisma.employee.findFirst({
        where: { id: Number(data.employeeId), storeId: Number(storeId) }
      });
      if (!employee) throw new Error("Employee not found for this store");
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
      throw new Error("At least one purchase item is required");
    }

    for (const item of data.items) {
      if (item.itemId) {
        const purchaseItem = await prisma.item.findFirst({
          where: { id: Number(item.itemId), storeId: numericStoreId }
        });
        if (!purchaseItem) throw new Error("Item not found for this store");
      }

      if (item.productId) {
        const product = await prisma.product.findFirst({
          where: { id: Number(item.productId), storeId: Number(storeId) }
        });
        if (!product) throw new Error("Product not found for this store");
      }

      if (item.metalId) {
        const metal = await prisma.metal.findFirst({
          where: { id: Number(item.metalId), storeId: Number(storeId) }
        });
        if (!metal) throw new Error("Metal not found for this store");
      }

      if (item.purityId) {
        const purity = await prisma.purity.findFirst({
          where: { id: Number(item.purityId), storeId: Number(storeId) }
        });
        if (!purity) throw new Error("Purity not found for this store");
      }

      if (item.gradeId) {
        const grade = await prisma.grade.findFirst({
          where: { id: Number(item.gradeId), storeId: Number(storeId) }
        });
        if (!grade) throw new Error("Grade not found for this store");
      }

      if (item.stoneId) {
        const stone = await prisma.stone.findFirst({
          where: { id: Number(item.stoneId), storeId: Number(storeId) }
        });
        if (!stone) throw new Error("Stone not found for this store");
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
      tagNo: item.tagNo || null,
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

  return await attachPurchaseItemCodes(await updatePurchaseRepo(Number(id), updateData));
};

export const deletePurchase = async (id, storeId) => {
  const purchase = await getPurchaseByIdRepo(Number(id));

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  if (purchase.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  return await deletePurchaseRepo(Number(id));
};

export const getPurchaseCount = async (storeId) => {
  return await countPurchases(Number(storeId));
};
