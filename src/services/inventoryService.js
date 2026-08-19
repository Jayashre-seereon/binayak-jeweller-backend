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

const generateBarcodeNo = async () => {
  const lastInventory = await prisma.inventory.findFirst({
    where: {
      barcodeNo: {
        not: null,
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
    },
  });

  const nextNumber = (lastInventory?.id || 0) + 1;

  return `890000${String(nextNumber).padStart(6, "0")}`;
};

const generateTagNo = async (purchaseType) => {
  const lastInventory = await prisma.inventory.findFirst({
    where: {
      tagNo: {
        not: null,
      },
    },
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
    },
  });

  const nextNumber = (lastInventory?.id || 0) + 1;

  let prefix = "TAG";

  if (purchaseType === "OLD") {
    prefix = "OLD";
  }

  if (purchaseType === "BULLION") {
    prefix = "BUL";
  }

  return `${prefix}-${String(nextNumber).padStart(6, "0")}`;
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
  let barcodeNo = purchaseItem.barcodeNo || null;

  if (purchaseType === "ORNAMENT") {
    tagNo = await generateTagNo(purchaseType);
    if (!barcodeNo) {
      barcodeNo = await generateBarcodeNo();
    }
  }

  if (purchaseType === "OLD") {
    tagNo = await generateTagNo(purchaseType);

    // Barcode is recommended but optional.
    if (!barcodeNo) {
      barcodeNo = await generateBarcodeNo();
    }
  }

  if (purchaseType === "BULLION") {
    if (!barcodeNo) {
      barcodeNo = await generateBarcodeNo();
    }
  }

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
