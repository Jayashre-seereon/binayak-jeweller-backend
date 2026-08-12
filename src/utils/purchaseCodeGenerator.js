import prisma from "../config/db.js";

export const generateInvoiceNo = async (storeId) => {
  const counter = await prisma.storeCounter.upsert({
    where: {
      storeId: Number(storeId)
    },
    create: {
      storeId: Number(storeId),
      lastInvoiceNumber: 1
    },
    update: {
      lastInvoiceNumber: {
        increment: 1
      }
    }
  });

  return `INV-${String(counter.lastInvoiceNumber).padStart(4, "0")}`;
};