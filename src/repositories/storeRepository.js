import prisma from "../config/db.js";


export const findStoreByEmail = (email) => {
  return prisma.store.findUnique({
    where: { email },
  });
};


export const createStoreRepo = (data) => {
  return prisma.store.create({
    data,
  });
};


export const updateStore = (id, data) => {
  return prisma.store.update({
    where: { id },
    data,
  });
};