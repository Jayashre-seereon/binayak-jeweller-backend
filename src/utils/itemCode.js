import prisma from "../config/db.js";

export const generateItemCode = async (product, design) => {
  const pro = product?.slice(0, 3).toUpperCase() || "PRD";
  const des = design?.slice(0, 3).toUpperCase() || "DSN";

  const prefix = `ITM-${pro}-${des}`;

  // Find last item with same prefix
  const lastItem = await prisma.item.findFirst({
    where: {
      itemCode: {
        startsWith: prefix,
      },
    },
    orderBy: {
      itemCode: "desc",
    },
  });

  let nextNumber = 1;

  if (lastItem) {
    const lastCode = lastItem.itemCode;
    const lastNumber = parseInt(lastCode.split("-").pop());
    nextNumber = lastNumber + 1;
  }

  const formattedNumber = String(nextNumber).padStart(4, "0");

  return `${prefix}-${formattedNumber}`;
};