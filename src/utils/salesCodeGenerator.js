import prisma from "../config/db.js";

const getFinancialYear = (date = new Date()) => {
  const d = new Date(date);
  const month = d.getMonth();
  const fullYear = d.getFullYear();
  if (month >= 3) {
    const nextYear = String((fullYear + 1) % 100).padStart(2, "0");
    return `${fullYear}-${nextYear}`;
  } else {
    const prevYear = fullYear - 1;
    const currentYear = String(fullYear % 100).padStart(2, "0");
    return `${prevYear}-${currentYear}`;
  }
};

export const generateSaleInvoiceNo = async (storeId) => {
  const store = await prisma.store.findUnique({
    where: { id: Number(storeId) },
    select: { storeName: true, location: true },
  });

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

  const fy = getFinancialYear();
  let prefix = "BJ";
  if (store?.storeName) {
    const cleanName = store.storeName.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    if (cleanName.length >= 2) {
      prefix = cleanName.slice(0, 4);
    }
  }

  return `${fy}/${prefix}-${String(counter.lastSaleNumber).padStart(4, "0")}`;
};