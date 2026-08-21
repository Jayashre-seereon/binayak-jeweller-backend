import prisma from "../config/db.js";
import * as inventoryRepo from "../repositories/inventoryRepository.js";

const extractInventoryCodeNumber = (value) => {
  if (!value) return 0;

  const match = String(value).trim().match(/^INV-(\d+)$/i);
  return match ? Number(match[1]) : 0;
};

const extractSequenceNumber = (value, prefix) => {
  if (!value) return 0;
  const normalized = value.toString().trim();

  if (prefix) {
    const match = normalized.match(new RegExp(`^${prefix}-(\\d+)$`, "i"));
    return match ? Number(match[1]) : 0;
  }

  const match = normalized.match(/(\d+)$/);
  return match ? Number(match[1]) : 0;
};

const getNextInventorySequence = async (storeId) => {
  const inventories = await prisma.inventory.findMany({
    where: {
      storeId: Number(storeId),
    },
    select: {
      inventoryCode: true,
      tagNo: true,
      barcodeNo: true,
    },
  });

  const nextFromInventoryCode = inventories.reduce(
    (max, inventory) => Math.max(max, extractInventoryCodeNumber(inventory.inventoryCode)),
    0
  );

  const nextFromLabels = inventories.reduce((max, inventory) => {
    return Math.max(
      max,
      extractSequenceNumber(inventory.tagNo, "TAG"),
      extractSequenceNumber(inventory.tagNo, "OLD"),
      extractSequenceNumber(inventory.tagNo, "BUL"),
      extractSequenceNumber(inventory.barcodeNo)
    );
  }, 0);

  return Math.max(nextFromInventoryCode, nextFromLabels) + 1;
};

const generateTagNo = (sequenceNumber, purchaseType) => {
  let prefix = "TAG";

  if (purchaseType === "OLD") {
    prefix = "OLD";
  }

  if (purchaseType === "BULLION") {
    prefix = "BUL";
  }

  return `${prefix}-${String(sequenceNumber).padStart(6, "0")}`;
};

const generateBarcodeNo = (sequenceNumber) => {
  return `890000${String(sequenceNumber).padStart(6, "0")}`;
};

const isUniqueInventoryCodeError = (error) => {
  const target = error?.meta?.target;
  const targetKey = Array.isArray(target) ? target.join(",") : String(target || "");

  return (
    error?.code === "P2002" &&
    (targetKey.includes("inventoryCode") ||
      targetKey.includes("tagNo") ||
      targetKey.includes("barcodeNo"))
  );
};

const asString = (value) => (value === null || value === undefined ? null : String(value));

export const createInventoryService = async (
  purchaseItemId,
  storeId
) => {
  const purchaseItem = await prisma.purchaseItem.findFirst({
    where: {
      id: Number(purchaseItemId),
      purchase: {
        storeId: Number(storeId),
      },
    },
    include: {
      purchase: true,
      item: true,
      product: true,
      metal: true,
      purityMaster: true,
      grade: true,
      stone: true,
    },
  });

  if (!purchaseItem) {
    throw new Error("Purchase item not found");
  }

  const existingInventory =
    await prisma.inventory.findUnique({
      where: {
        purchaseItemId: purchaseItem.id,
      },
    });

  if (existingInventory) {
    throw new Error(
      "Inventory already exists for this purchase item"
    );
  }

  const purchaseType = purchaseItem.purchase.purchaseType;
  const storeIdNumber = Number(storeId);
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const nextSequence = await getNextInventorySequence(storeIdNumber);
    const inventoryCode = `INV-${String(nextSequence).padStart(6, "0")}`;
    const barcodeNo = generateBarcodeNo(nextSequence);
    const tagNo =
      purchaseType === "ORNAMENT" ||
      purchaseType === "OLD" ||
      purchaseType === "BULLION"
        ? generateTagNo(nextSequence, purchaseType)
        : null;

    const duplicateCheck = await prisma.inventory.findFirst({
      where: {
        storeId: storeIdNumber,
        OR: [
          { inventoryCode },
          ...(tagNo ? [{ tagNo }] : []),
          ...(barcodeNo ? [{ barcodeNo }] : []),
        ],
      },
      select: {
        id: true,
      },
    });

    if (duplicateCheck) {
      if (attempt < maxAttempts) {
        continue;
      }

      throw new Error("Unable to generate a unique inventory sequence for this store");
    }

    const data = {
      inventoryCode,

      purchaseItemId: purchaseItem.id,
      purchaseId: purchaseItem.purchaseId,
      storeId: storeIdNumber,

      purchaseType,

      itemId: purchaseItem.itemId,
      productId: purchaseItem.productId,
      metalId: purchaseItem.metalId,
      purityId: purchaseItem.purityId,
      gradeId: purchaseItem.gradeId,
      stoneId: purchaseItem.stoneId,

      grossWeight: purchaseItem.grossWeight,
      stoneWeight: purchaseItem.stoneWeight,
      netWeight: purchaseItem.netWeight,

      dustWeight: purchaseItem.dustWeight,
      deductionWeight: purchaseItem.deductionWeight,

      pureWeight: purchaseItem.pureWeight,
      actualWeight: purchaseItem.actualWeight,
      balanceWeight: purchaseItem.balanceWeight,

      purity: purchaseItem.purity,
      touchPercentage: purchaseItem.touchPercentage,
      fineness: purchaseItem.fineness,

      huidNo: asString(purchaseItem.huidNo),
      tagNo: asString(tagNo),
      barcodeNo: asString(barcodeNo),
      barSerialNo: asString(purchaseItem.barSerialNo),
      assayCertNo: asString(purchaseItem.assayCertNo),

      status: "AVAILABLE",

      itemPhoto: purchaseItem.itemPhoto,
      narration: purchaseItem.narration,
      extraDetails: purchaseItem.extraDetails,
    };

    try {
      return await inventoryRepo.createInventoryRepo(data);
    } catch (error) {
      if (isUniqueInventoryCodeError(error) && attempt < maxAttempts) {
        continue;
      }

      throw error;
    }
  }

  throw new Error("Failed to generate a unique inventory code");
};

export const getInventoriesService = async (
  storeId,
  filters
) => {
  return await inventoryRepo.getInventoriesRepo(
    Number(storeId),
    filters
  );
};

export const getInventoryByIdService = async (
  id,
  storeId
) => {
  const inventory =
    await inventoryRepo.getInventoryByIdRepo(
      id,
      Number(storeId)
    );

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  return inventory;
};

export const getInventoryByBarcodeService = async (
  barcodeNo,
  storeId
) => {
  const inventory = await inventoryRepo.getInventoryByBarcodeRepo(
    String(barcodeNo),
    Number(storeId)
  );

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  return inventory;
};

export const updateInventoryService = async (
  id,
  storeId,
  data
) => {
  const inventory =
    await inventoryRepo.getInventoryByIdRepo(
      id,
      Number(storeId)
    );

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  delete data.purchaseItemId;
  delete data.purchaseId;
  delete data.storeId;
  delete data.purchaseType;
  delete data.purchaseItemCode;
  delete data.itemId;
  delete data.productId;
  delete data.metalId;
  delete data.purityId;
  delete data.gradeId;
  delete data.stoneId;

  const result =
    await inventoryRepo.updateInventoryRepo(
      id,
      Number(storeId),
      data
    );

  if (result.count === 0) {
    throw new Error("Inventory update failed");
  }

  return await inventoryRepo.getInventoryByIdRepo(
    id,
    Number(storeId)
  );
};

export const updateInventoryStatusService = async (
  id,
  storeId,
  status
) => {
  const allowedStatuses = [
    "AVAILABLE",
    "RESERVED",
    "SOLD",
    "MELTED",
    "REFINED",
    "DAMAGED",
  ];

  if (!allowedStatuses.includes(status)) {
    throw new Error("Invalid inventory status");
  }

  const inventory =
    await inventoryRepo.getInventoryByIdRepo(
      id,
      Number(storeId)
    );

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  const result =
    await inventoryRepo.updateInventoryStatusRepo(
      id,
      Number(storeId),
      status
    );

  if (result.count === 0) {
    throw new Error("Status update failed");
  }

  return await inventoryRepo.getInventoryByIdRepo(
    id,
    Number(storeId)
  );
};

export const deleteInventoryService = async (
  id,
  storeId
) => {
  const inventory =
    await inventoryRepo.getInventoryByIdRepo(
      id,
      Number(storeId)
    );

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  if (inventory.status === "SOLD") {
    throw new Error(
      "Sold inventory cannot be deleted"
    );
  }

  const result =
    await inventoryRepo.deleteInventoryRepo(
      id,
      Number(storeId)
    );

  if (result.count === 0) {
    throw new Error("Inventory deletion failed");
  }

  return true;
};
