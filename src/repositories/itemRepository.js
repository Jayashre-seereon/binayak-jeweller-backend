import prisma from "../config/db.js";

export const createItemRepo = (data) => {
  return prisma.item.create({
    data,
  });
};

export const getItemsByStore = (storeId) => {
  return prisma.item.findMany({
    where: {
      storeId,
    },
    include: {
      product: true,
      design: true,
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
      product: true,
      design: true,
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
      product: true,
      design: true,
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
