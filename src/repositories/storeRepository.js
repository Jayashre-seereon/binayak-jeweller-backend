import prisma from "../config/db.js";


const safeStoreFields = {
  id: true,
  storeName: true,
  location: true,
  email: true,
  role: true,
};

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

export const updateStoreRepo = (id, data) => {
  return prisma.store.update({
    where: { id },
    data,
    select: safeStoreFields, 
  });
};

// GET ALL
export const getAllStoresRepo = () => {
  return prisma.store.findMany({
    select: safeStoreFields,
  });
};

// GET BY ID
export const getStoreByIdRepo = (id) => {
  return prisma.store.findUnique({
    where: { id },
    select: safeStoreFields, 
  });
};
// DELETE
export const deleteStoreRepo = (id) => {
  return prisma.store.delete({
    where: { id },
  });
};
