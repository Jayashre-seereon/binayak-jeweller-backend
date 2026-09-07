import prisma from "../config/db.js";

export const generateVoucherNo = async (storeId, voucherType, tx = prisma) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) {
    throw new Error("Valid storeId is required for voucher numbering.");
  }

  const type = String(voucherType).toUpperCase();
  let counterField = "lastReceiptVoucherNumber";
  let prefix = "RV";

  if (type === "PAYMENT") {
    counterField = "lastPaymentVoucherNumber";
    prefix = "PV";
  } else if (type === "JOURNAL") {
    counterField = "lastJournalVoucherNumber";
    prefix = "JE";
  }

  const counter = await tx.storeCounter.upsert({
    where: { storeId: numericStoreId },
    update: {
      [counterField]: {
        increment: 1,
      },
    },
    create: {
      storeId: numericStoreId,
      [counterField]: 1,
    },
    select: {
      [counterField]: true,
    },
  });

  const nextNum = counter[counterField];
  return `${prefix}-${String(nextNum).padStart(6, "0")}`;
};

export const peekNextVoucherNo = async (storeId, voucherType, tx = prisma) => {
  const numericStoreId = Number(storeId);
  if (!numericStoreId) return "";

  const type = String(voucherType).toUpperCase();
  let counterField = "lastReceiptVoucherNumber";
  let prefix = "RV";

  if (type === "PAYMENT") {
    counterField = "lastPaymentVoucherNumber";
    prefix = "PV";
  } else if (type === "JOURNAL") {
    counterField = "lastJournalVoucherNumber";
    prefix = "JE";
  }

  const counter = await tx.storeCounter.findUnique({
    where: { storeId: numericStoreId },
    select: {
      [counterField]: true,
    },
  });

  const nextNum = (counter?.[counterField] || 0) + 1;
  return `${prefix}-${String(nextNum).padStart(6, "0")}`;
};
