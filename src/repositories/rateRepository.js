import prisma from "../config/db.js";

// Create a new rate
export const createRateRepo = (data) => {
  return prisma.rateMaster.create({
    data,
  });
};

// Get all rates
export const getRatesRepo = (storeId) => {
  return prisma.rateMaster.findMany({
    where: { storeId },
    include: {
      metal: true,
      purity: true,
      grade: true,
    },
  });
};

// Get rate by ID
export const getRateByIdRepo = (id) => {
  return prisma.rateMaster.findUnique({
    where: { id },
    include: {
      metal: true,
      purity: true,
      grade: true,
    },
  });
};

// Update rate
export const updateRateRepo = (id, data) => {
  return prisma.rateMaster.update({
    where: { id },
    data,
  });
};

// Delete rate
export const deleteRateRepo = (id) => {
  return prisma.rateMaster.delete({
    where: { id },
  });
};
