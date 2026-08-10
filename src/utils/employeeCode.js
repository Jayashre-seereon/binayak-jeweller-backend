import prisma from "../config/db.js";

/**
 * Atomically gets the next employee code for a store using the
 * StoreCounter table. `increment` is executed as a single UPDATE
 * statement in Postgres, so the database itself serializes concurrent
 * calls — two requests can never receive the same number, even if they
 * run at the exact same time. No retry logic is needed anywhere else.
 */
export const generateEmployeeCode = async (storeId) => {
  const counter = await prisma.storeCounter.upsert({
    where: { storeId: Number(storeId) },
    create: { storeId: Number(storeId), lastEmpNumber: 1 },
    update: { lastEmpNumber: { increment: 1 } },
  });

  return `EMP-${String(counter.lastEmpNumber).padStart(4, "0")}`;
};