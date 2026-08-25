import prisma from "../config/db.js";

export const createPurchaseRepo = async (data) => {
  return prisma.purchase.create({
    data,
    include: {
      party: true,
      employee: true,
      items: {
        include: {
          item: true,
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
          item: true,
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

export const getPurchasesByStoreAndPhone = async (
  storeId,
  phone
) => {
  return prisma.purchase.findMany({
    where: {
      storeId: Number(storeId),
      purchaseType: "OLD",
      OR: [
        {
          customerPhone: {
            equals: phone,
            mode: "insensitive",
          },
        },
        {
          party: {
            phone: {
              equals: phone,
              mode: "insensitive",
            },
          },
        },
      ],
    },
    include: {
      party: true,
      employee: true,
      payments: true,
      items: {
        include: {
          item: true,
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
      items: {
        include: {
          item: true,
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

export const getPurchaseItemsByPurchaseIdRepo = async (purchaseId, storeId) => {
  return prisma.purchaseItem.findMany({
    where: {
      purchaseId: Number(purchaseId),
      purchase: {
        storeId: Number(storeId)
      }
    },
    include: {
      item: true,
      product: true,
      metal: true,
      purityMaster: true,
      grade: true,
      stone: true,
      purchase: {
        select: {
          id: true,
          invoiceNo: true,
          purchaseType: true
        }
      }
    },
    orderBy: {
      id: "asc"
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
          item: true,
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
