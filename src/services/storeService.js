import bcrypt from "bcryptjs";
import {
  findStoreByEmail,
  createStoreRepo,
  updateStoreRepo,
  getAllStoresRepo,
  getStoreByIdRepo,
  deleteStoreRepo,
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

// GET ALL
export const getAllStores = async () => {
  return await getAllStoresRepo();
};

// GET BY ID
export const getStoreById = async (id) => {
  const store = await getStoreByIdRepo(id);
  if (!store) throw new Error("Store not found");
  return store;
};

// UPDATE
export const updateStore = async (id, data) => {
  return await updateStoreRepo(id, data);
};

// DELETE
export const deleteStore = async (id) => {
  return await deleteStoreRepo(id);
};