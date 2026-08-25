import prisma from "../config/db.js";

const saleInclude = {
  store: true,
  party: true,
  customer: true,
  adjustmentLogs: true,

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
        },
      },
    },
  },

  payments: true,

  oldGolds: {
    include: {
      purchase: true,
    },
  },

  advanceAdjustments: {
    include: {
      advanceReceive: true,
    },
  },
};

export const createSaleRepo = async (data, tx = prisma) => {
  return tx.sale.create({
    data,
    include: saleInclude,
  });
};

export const getSaleByIdRepo = async (id, storeId) => {
  return prisma.sale.findFirst({
    where: {
      id: Number(id),
      storeId: Number(storeId),
    },
    include: saleInclude,
  });
};

export const getSalesRepo = async (storeId) => {
  return prisma.sale.findMany({
    where: {
      storeId: Number(storeId),
    },

    include: saleInclude,

    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getSaleCountRepo = async (storeId) => {
  return prisma.sale.count({
    where: {
      storeId: Number(storeId),
    },
  });
};