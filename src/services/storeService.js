import prisma from "../config/db.js";
import bcrypt from "bcryptjs";

export const createStore = async (data) => {
  const { storeName, email, password } = data;

  const existing = await prisma.store.findUnique({ where: { email } });
  if (existing) throw new Error("Store already exists");

  const hashedPassword = await bcrypt.hash(password, 10);


  return await prisma.store.create({
    data: {
      storeName,
      email,
      password: hashedPassword,
      role: "STORE",
    },
  });
};