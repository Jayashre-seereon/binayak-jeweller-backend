import prisma from "../config/db.js";

export const createProductRepo = (data) => {
  return prisma.product.create({ data });
};

export const getProductsByStore = (storeId) => {
  return prisma.product.findMany({
    where: { storeId },
    include: {
      category: true,
      metal: true
    }
  });
};

export const getProductByIdRepo = (id) => {
  return prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      metal: true
    }
  });
};

export const updateProductRepo = (id, data) => {
  return prisma.product.update({
    where: { id },
    data
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