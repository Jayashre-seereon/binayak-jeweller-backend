import prisma from "../config/db.js";

export const createItemRepo = (data) => {
  return prisma.item.create({
    data,
    include: {
      product: {
        include: {
          category: true,
          metal: true,
          purity: true,
        },
      },
      design: {
        include: {
          category: true,
        },
      },
      purity: true,
      store: true,
    },
  });
};

export const getItemsByStore = (storeId) => {
  return prisma.item.findMany({
    where: {
      storeId,
    },
    include: {
      product: {
        include: {
          category: true,
          metal: true,
          purity: true,
        },
      },
      design: {
        include: {
          category: true,
        },
      },
      purity: true,
      store: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const getItemsByProductIdRepo = (productId, storeId) => {
  return prisma.item.findMany({
    where: {
      productId,
      storeId,
    },
    include: {
      product: {
        include: {
          category: true,
          metal: true,
          purity: true,
        },
      },
      design: {
        include: {
          category: true,
        },
      },
      purity: true,
      store: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getItemByIdRepo = (id) => {
  return prisma.item.findUnique({
    where: {
      id,
    },
    include: {
      product: {
        include: {
          category: true,
          metal: true,
          purity: true,
        },
      },
      design: {
        include: {
          category: true,
        },
      },
      purity: true,
      store: true,
    },
  });
};

export const updateItemRepo = (id, data) => {
  return prisma.item.update({
    where: {
      id,
    },
    data,
    include: {
      product: {
        include: {
          category: true,
          metal: true,
          purity: true,
        },
      },
      design: {
        include: {
          category: true,
        },
      },
      purity: true,
      store: true,
    },
  });
};

export const deleteItemRepo = (id) => {
  return prisma.item.delete({
    where: {
      id,
    },
  });
};

export const countItems = () => {
  return prisma.item.count();
};
