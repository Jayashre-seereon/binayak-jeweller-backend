import prisma from "../config/db.js";

export const createProductRepo = (data) => {
  return prisma.product.create({ data });
};

export const getProductsByStore = (storeId) => {
  return prisma.product.findMany({
    where: { storeId },
    include: {
      category: true,
      metal: true,
      purity: true,
    },
    orderBy: {
      id: "desc",
    },
  });
};

export const getProductsByMetalIdRepo = (metalId, storeId) => {
  return prisma.product.findMany({
    where: { metalId, storeId },
    include: {
      category: true,
      metal: true,
      purity: true,
    },
    orderBy: {
      id: "asc",
    },
  });
};

export const getProductByIdRepo = (id) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      metal: true,
      purity: true,
    }
  });
};

export const updateProductRepo = (id, data) => {
  return prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
      metal: true,
      purity: true,
    },
  });
};

export const deleteProductRepo = (id) => {
  return prisma.product.delete({
    where: { id }
  });
};

export const countProducts = async () => {
  return prisma.product.count();
};
