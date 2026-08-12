import prisma from "../config/db.js";

export const createPurchaseRepo = async (data) => {
  return prisma.purchase.create({
    data,
    include: {
      party: true,
      employee: true,
      items: {
        include: {
          product: true,
          metal: true,
          purityMaster: true,
          grade: true,
          stone: true
        }
      }
    }
  });
};

export const getPurchasesByStore = async (storeId) => {
  return prisma.purchase.findMany({
    where: {
      storeId: Number(storeId)
    },
    include: {
      party: true,
      employee: true,
      items: {
        include: {
          product: true,
          metal: true,
          purityMaster: true,
          grade: true,
          stone: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });
};

export const getPurchaseByIdRepo = async (id) => {
  return prisma.purchase.findUnique({
    where: {
      id: Number(id)
    },
    include: {
      party: true,
      employee: true,
      store: true,
      items: {
        include: {
          product: true,
          metal: true,
          purityMaster: true,
          grade: true,
          stone: true
        }
      }
    }
  });
};

export const updatePurchaseRepo = async (id, data) => {
  return prisma.purchase.update({
    where: {
      id: Number(id)
    },
    data,
    include: {
      party: true,
      employee: true,
      items: {
        include: {
          product: true,
          metal: true,
          purityMaster: true,
          grade: true,
          stone: true
        }
      }
    }
  });
};

export const deletePurchaseRepo = async (id) => {
  return prisma.purchase.delete({
    where: {
      id: Number(id)
    }
  });
};

export const countPurchases = async (storeId) => {
  return prisma.purchase.count({
    where: {
      storeId: Number(storeId)
    }
  });
};