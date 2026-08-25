import prisma from "../config/db.js";
import * as inventoryRepo from "../repositories/inventoryRepository.js";

const inventoryError = (message) => new Error(message);

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

const extractInventorySequence = (value) => {
  if (!value) return 0;
  const match = String(value).trim().match(/^INV-(\d+)$/i);
  if (!match) return 0;

  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) ? sequence : 0;
};

const extractTagSequence = (value) => {
  if (!value) return 0;
  const match = String(value).trim().match(/^(?:TAG|OLD|BUL)-(\d+)$/i);
  if (!match) return 0;

  const sequence = Number(match[1]);
  return Number.isSafeInteger(sequence) ? sequence : 0;
};

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
    throw inventoryError("The selected purchase item was not found. Please refresh and try again.");
  }

  const existingInventory =
    await prisma.inventory.findUnique({
      where: {
        purchaseItemId: purchaseItem.id,
      },
    });

  if (existingInventory) {
    throw inventoryError(
      "Inventory has already been created for this purchase item."
    );
  }

  const purchaseType = purchaseItem.purchase.purchaseType;
  const storeIdNumber = Number(storeId);
  return prisma.$transaction(async (tx) => {
    const [inventoryMax, tagMax] = await Promise.all([
      tx.inventory.aggregate({
        where: {
          storeId: storeIdNumber,
        },
        _max: {
          inventoryCode: true,
        },
      }),
      tx.inventory.aggregate({
        where: {
          storeId: storeIdNumber,
        },
        _max: {
          tagNo: true,
        },
      }),
    ]);

    const currentMaxSequence = Math.max(
      extractInventorySequence(inventoryMax._max.inventoryCode),
      extractTagSequence(tagMax._max.tagNo)
    );

    const counter = await tx.storeCounter.upsert({
      where: {
        storeId: storeIdNumber,
      },
      update: {
        lastInventoryNumber: Math.max(0, currentMaxSequence),
      },
      create: {
        storeId: storeIdNumber,
        lastInventoryNumber: currentMaxSequence,
      },
      select: {
        lastInventoryNumber: true,
      },
    });

    const sequenceNumber = Math.max(
      Number(counter.lastInventoryNumber || 0),
      currentMaxSequence
    ) + 1;

    if (!Number.isSafeInteger(sequenceNumber)) {
      throw inventoryError(
        "Inventory numbers have reached the supported limit. Please reset the store counter or migrate the counter columns to BIGINT."
      );
    }

    await tx.storeCounter.update({
      where: {
        storeId: storeIdNumber,
      },
      data: {
        lastInventoryNumber: sequenceNumber,
      },
    });

    const inventoryCode = `INV-${String(sequenceNumber).padStart(6, "0")}`;
    const barcodeNo = generateBarcodeNo(sequenceNumber);
    const tagNo =
      purchaseType === "ORNAMENT" ||
      purchaseType === "OLD" ||
      purchaseType === "BULLION"
        ? generateTagNo(sequenceNumber, purchaseType)
        : null;

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
      pieces: Math.max(1, Number(purchaseItem.pieces || 1)),

      dustWeight: purchaseItem.dustWeight,
      deductionWeight: purchaseItem.deductionWeight,

      pureWeight: purchaseItem.pureWeight,
      actualWeight: purchaseItem.actualWeight,
      balanceWeight: purchaseItem.balanceWeight,

      purity: purchaseItem.purity,
      touchPercentage: purchaseItem.touchPercentage,
      fineness: purchaseItem.fineness,

      huidNo: asString(purchaseItem.huidNo),
      hsnCode: asString(purchaseItem.hsnCode) || "711319",
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
      return await tx.inventory.create({
        data,
        include: {
          purchase: true,
          purchaseItem: true,
          item: true,
          product: true,
          metal: true,
          purityMaster: true,
          grade: true,
          stone: true,
        },
      });
    } catch (error) {
      if (isUniqueInventoryCodeError(error)) {
        throw inventoryError("We could not generate a unique inventory number for this store. Please try again.");
      }

      throw error;
    }
  });
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
    throw inventoryError("Inventory record not found.");
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
    throw inventoryError("Inventory record not found.");
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
    throw inventoryError("Inventory record not found.");
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
    throw inventoryError("We could not update the inventory. Please try again.");
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
    throw inventoryError("Please choose a valid inventory status.");
  }

  const inventory =
    await inventoryRepo.getInventoryByIdRepo(
      id,
      Number(storeId)
    );

  if (!inventory) {
    throw inventoryError("Inventory record not found.");
  }

  const result =
    await inventoryRepo.updateInventoryStatusRepo(
      id,
      Number(storeId),
      status
    );

  if (result.count === 0) {
    throw inventoryError("We could not update the inventory status. Please try again.");
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
    throw inventoryError("Inventory record not found.");
  }

  if (inventory.status === "SOLD") {
    throw inventoryError(
      "Sold inventory cannot be deleted."
    );
  }

  const result =
    await inventoryRepo.deleteInventoryRepo(
      id,
      Number(storeId)
    );

  if (result.count === 0) {
    throw inventoryError("We could not delete the inventory. Please try again.");
  }

  return true;
};
