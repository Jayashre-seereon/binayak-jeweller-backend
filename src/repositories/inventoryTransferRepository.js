import prisma from "../config/db.js";

const transferInclude = {
  fromStore: {
    select: {
      id: true,
      storeName: true,
      location: true,
    },
  },

  toStore: {
    select: {
      id: true,
      storeName: true,
      location: true,
    },
  },

  items: {
    include: {
      inventory: {
        include: {
          item: true,
          product: true,
          metal: true,
          purityMaster: true,
          grade: true,
          stone: true,
          purchase: true,
          purchaseItem: true,
        },
      },
    },
  },
};

export const createTransferRepo = async (tx, data) => {
  return tx.inventoryTransfer.create({
    data,
    include: transferInclude,
  });
};

export const getTransferByIdRepo = async (id) => {
  return prisma.inventoryTransfer.findUnique({
    where: {
      id: Number(id),
    },
    include: transferInclude,
  });
};

export const getTransfersRepo = async ({
  storeId,
  status,
}) => {
  return prisma.inventoryTransfer.findMany({
    where: {
      ...(storeId
        ? {
            OR: [
              {
                fromStoreId: Number(storeId),
              },
              {
                toStoreId: Number(storeId),
              },
            ],
          }
        : {}),

      ...(status
        ? {
            status,
          }
        : {}),
    },

    include: transferInclude,

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getInventoryForTransferRepo = async (
  inventoryIds,
  fromStoreId
) => {
  return prisma.inventory.findMany({
    where: {
      id: {
        in: inventoryIds.map(Number),
      },

      storeId: Number(fromStoreId),
    },
  });
};

export const createTransferItemsRepo = async (
  tx,
  transferId,
  inventoryIds
) => {
  return tx.inventoryTransferItem.createMany({
    data: inventoryIds.map((inventoryId) => ({
      transferId: Number(transferId),
      inventoryId: Number(inventoryId),
    })),
  });
};

export const updateTransferStatusRepo = async (
  tx,
  transferId,
  status,
  receivedDate = undefined
) => {
  return tx.inventoryTransfer.update({
    where: {
      id: Number(transferId),
    },

    data: {
      status,

      ...(receivedDate !== undefined
        ? {
            receivedDate,
          }
        : {}),
    },
  });
};

export const updateInventoryStatusRepo = async (
  tx,
  inventoryIds,
  status,
  storeId = undefined
) => {
  return tx.inventory.updateMany({
    where: {
      id: {
        in: inventoryIds.map(Number),
      },
      ...(storeId !== undefined
        ? {
            storeId: Number(storeId),
          }
        : {}),
    },
    data: {
      status,
    },
  });
};



export const receiveInventoryRepo = async (
  tx,
  inventoryIds,
  toStoreId
) => {
  return tx.inventory.updateMany({
    where: {
      id: {
        in: inventoryIds.map(Number),
      },
    },

    data: {
      storeId: Number(toStoreId),
      status: "AVAILABLE",
    },
  });
};

export const getTransferItemsRepo = async (transferId) => {
  return prisma.inventoryTransferItem.findMany({
    where: {
      transferId: Number(transferId),
    },

    include: {
      inventory: true,
    },
  });
};

export const getActiveTransferItemRepo = async (
  inventoryIds
) => {
  return prisma.inventoryTransferItem.findMany({
    where: {
      inventoryId: {
        in: inventoryIds.map(Number),
      },

     transfer: {
  status: "PENDING",
},
    },

    include: {
      transfer: true,
    },
  });
};
