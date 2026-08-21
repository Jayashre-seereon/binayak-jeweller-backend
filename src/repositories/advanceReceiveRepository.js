import prisma from "../config/db.js";

export const createAdvanceReceiveRepo = async (data) => {
  return await prisma.advanceReceive.create({
    data,
  });
};

export const getAdvanceReceivesRepo = async (storeId) => {
  return await prisma.advanceReceive.findMany({
    where: {
      storeId,
    },
    orderBy: {
      id: "desc",
    },
  });
};

export const getAdvanceReceiveByIdRepo = async (id, storeId) => {
  return await prisma.advanceReceive.findFirst({
    where: {
      id,
      storeId,
    },
  });
};

export const updateAdvanceReceiveRepo = async (
  id,
  storeId,
  data
) => {
  return await prisma.advanceReceive.updateMany({
    where: {
      id,
      storeId,
    },
    data,
  });
};

export const deleteAdvanceReceiveRepo = async (
  id,
  storeId
) => {
  return await prisma.advanceReceive.deleteMany({
    where: {
      id,
      storeId,
    },
  });
};