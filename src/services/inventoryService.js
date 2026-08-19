import prisma from "../config/db.js";
import * as inventoryRepo from "../repositories/inventoryRepository.js";

const generateInventoryCode = async () => {
  const lastInventory = await prisma.inventory.findFirst({
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
    },
  });

  const nextNumber = (lastInventory?.id || 0) + 1;

  return `INV-${String(nextNumber).padStart(6, "0")}`;
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
  const lastInventory = await prisma.inventory.findFirst({
    where: {
      storeId: Number(storeId),
      OR: [
        {
          tagNo: {
            not: null,
          },
        },
        {
          barcodeNo: {
            not: null,
          },
        },
      ],
    },
    orderBy: {
      id: "desc",
    },
    select: {
      tagNo: true,
      barcodeNo: true,
    },
  });

  return Math.max(
    extractSequenceNumber(lastInventory?.tagNo, "TAG"),
    extractSequenceNumber(lastInventory?.tagNo, "OLD"),
    extractSequenceNumber(lastInventory?.tagNo, "BUL"),
    extractSequenceNumber(lastInventory?.barcodeNo)
  ) + 1;
};

const generateTagNo = async (storeId, purchaseType) => {
  const nextNumber = await getNextInventorySequence(storeId);

  let prefix = "TAG";

  if (purchaseType === "OLD") {
    prefix = "OLD";
  }

  if (purchaseType === "BULLION") {
    prefix = "BUL";
  }

  return `${prefix}-${String(nextNumber).padStart(6, "0")}`;
};

const generateBarcodeNo = async (storeId, sequenceNumber) => {
  const nextNumber = sequenceNumber ?? (await getNextInventorySequence(storeId));

  return `890000${String(nextNumber).padStart(6, "0")}`;
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

  const inventoryCode = await generateInventoryCode();

  let tagNo = null;
  const nextSequence = await getNextInventorySequence(storeId);

  // Inventory tag numbers are generated per inventory record, not copied from purchase data.
  if (purchaseType === "ORNAMENT" || purchaseType === "OLD" || purchaseType === "BULLION") {
    tagNo = await generateTagNo(storeId, purchaseType);
  }

  const barcodeNo = await generateBarcodeNo(storeId, nextSequence);

  const data = {
    inventoryCode,

    purchaseItemId: purchaseItem.id,
    purchaseId: purchaseItem.purchaseId,
    storeId: Number(storeId),

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

    huidNo: purchaseItem.huidNo,
    tagNo,
    barcodeNo,
    barSerialNo: purchaseItem.barSerialNo,
    assayCertNo: purchaseItem.assayCertNo,

    status: "AVAILABLE",

    itemPhoto: purchaseItem.itemPhoto,
    narration: purchaseItem.narration,
    extraDetails: purchaseItem.extraDetails,
  };

  return await inventoryRepo.createInventoryRepo(data);
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
    "TRANSFERRED",
    "RETURNED",
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
