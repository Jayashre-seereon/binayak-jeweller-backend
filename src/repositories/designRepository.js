import prisma from "../config/db.js";

export const createDesignRepo = (data) => {
  return prisma.design.create({
    data,
    include: {
      category: true,
    },
  });
};

export const getDesignsByStore = (storeId) => {
  return prisma.design.findMany({
    where: { storeId },
    include: {
      category: true,
    },
    orderBy: {
      id: "desc",
    },
  });
};

export const getDesignByIdRepo = (id)=>{
  return prisma.design.findUnique({
    where:{
      id
    },
    include: {
      category: true,
    },
  });
};

export const updateDesignRepo = (id, data) => {
  return prisma.design.update({
    where: { id },
    data,
    include: {
      category: true,
    },
  });
};

export const deleteDesignRepo = (id) => {
  return prisma.design.delete({
    where: { id },
  });
};
