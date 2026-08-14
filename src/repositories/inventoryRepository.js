import prisma from "../config/db.js";

export const createInventoryRepo = async (data) => {
  return prisma.inventory.create({
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
};

export const getInventoriesRepo = async (storeId, filters = {}) => {
  return prisma.inventory.findMany({
    where: {
      storeId,
      ...(filters.purchaseType
        ? { purchaseType: filters.purchaseType }
        : {}),
      ...(filters.status
        ? { status: filters.status }
        : {}),
      ...(filters.itemId
        ? { itemId: Number(filters.itemId) }
        : {}),
      ...(filters.productId
        ? { productId: Number(filters.productId) }
        : {}),
      ...(filters.metalId
        ? { metalId: Number(filters.metalId) }
        : {}),
      ...(filters.purityId
        ? { purityId: Number(filters.purityId) }
        : {}),
      ...(filters.barcodeNo
        ? { barcodeNo: filters.barcodeNo }
        : {}),
      ...(filters.tagNo
        ? { tagNo: filters.tagNo }
        : {}),
      ...(filters.huidNo
        ? { huidNo: filters.huidNo }
        : {}),
      ...(filters.barSerialNo
        ? { barSerialNo: filters.barSerialNo }
        : {}),
    },
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
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getInventoryByIdRepo = async (id, storeId) => {
  return prisma.inventory.findFirst({
    where: {
      id: Number(id),
      storeId,
    },
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
};

export const getInventoryByBarcodeRepo = async (barcodeNo, storeId) => {
  return prisma.inventory.findFirst({
    where: {
      barcodeNo,
      storeId,
    },
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
};

export const getInventoryByTagRepo = async (tagNo, storeId) => {
  return prisma.inventory.findFirst({
    where: {
      tagNo,
      storeId,
    },
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
};

export const updateInventoryRepo = async (id, storeId, data) => {
  return prisma.inventory.updateMany({
    where: {
      id: Number(id),
      storeId,
    },
    data,
  });
};

export const updateInventoryStatusRepo = async (
  id,
  storeId,
  status
) => {
  return prisma.inventory.updateMany({
    where: {
      id: Number(id),
      storeId,
    },
    data: {
      status,
    },
  });
};

export const deleteInventoryRepo = async (id, storeId) => {
  return prisma.inventory.deleteMany({
    where: {
      id: Number(id),
      storeId,
    },
  });
};