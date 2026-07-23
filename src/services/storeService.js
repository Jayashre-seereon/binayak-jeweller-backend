import bcrypt from "bcryptjs";
import {
  findStoreByEmail,
  createStoreRepo,
} from "../repositories/storeRepository.js";

export const createStore = async (data) => {
  const { storeName,  location,email, password } = data;

  const existing = await findStoreByEmail(email);
  if (existing) throw new Error("Store already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  return await createStoreRepo({
    storeName,
    location,
    email,
    password: hashedPassword,
    role: "STORE",
  });
};