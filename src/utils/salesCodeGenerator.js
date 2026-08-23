import prisma from "../config/db.js";

export const generateSaleInvoiceNo = async (storeId) => {
  const counter = await prisma.storeCounter.upsert({
    where: {
      storeId: Number(storeId),
    },

    update: {
      lastSaleNumber: {
        increment: 1,
      },
    },

    create: {
      storeId: Number(storeId),
      lastSaleNumber: 1,
    },

    select: {
      lastSaleNumber: true,
    },
  });

  return `SAL-${String(counter.lastSaleNumber).padStart(6, "0")}`;
};