import prisma from "../config/db.js";


export const generateEmployeeCode = async (storeId) => {
  const counter = await prisma.storeCounter.upsert({
    where: { storeId: Number(storeId) },
    create: { storeId: Number(storeId), lastEmpNumber: 1 },
    update: { lastEmpNumber: { increment: 1 } },
  });

  return `EMP-${String(counter.lastEmpNumber).padStart(4, "0")}`;
};