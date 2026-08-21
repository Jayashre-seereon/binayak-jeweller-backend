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
      barcodeNo: String(barcodeNo),
      storeId: Number(storeId),
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

export const getInventoriesForLabelsRepo = async (storeId, { ids = [], barcodeNos = [] }) => {
  const idList = ids
    .map((value) => Number(value))
    .filter((value) => Number.isInteger(value) && value > 0);

  const barcodeList = barcodeNos
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (idList.length === 0 && barcodeList.length === 0) {
    return [];
  }

  const inventories = await prisma.inventory.findMany({
    where: {
      storeId: Number(storeId),
      OR: [
        ...(idList.length > 0 ? [{ id: { in: idList } }] : []),
        ...(barcodeList.length > 0
          ? [
              {
                barcodeNo: {
                  in: barcodeList,
                },
              },
            ]
          : []),
      ],
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
      id: "asc",
    },
  });

  return inventories.filter(
    (inventory, index, self) =>
      index === self.findIndex((entry) => entry.id === inventory.id)
  );
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
