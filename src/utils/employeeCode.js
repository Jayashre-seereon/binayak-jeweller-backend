import prisma from "../config/db.js";

export const generateEmployeeCode = async (storeId) => {
  const lastEmployee = await prisma.employee.findFirst({
    where: {
      storeId: Number(storeId),
    },
    orderBy: {
      id: "desc",
    },
    select: {
      empCode: true,
    },
  });

  let nextNumber = 1;

  if (lastEmployee?.empCode) {
    const match = lastEmployee.empCode.match(/^EMP-(\d+)$/);

    if (match) {
      nextNumber = Number(match[1]) + 1;
    }
  }

  return `EMP-${String(nextNumber).padStart(4, "0")}`;
};