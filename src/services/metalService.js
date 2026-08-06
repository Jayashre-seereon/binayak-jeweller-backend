import { createMetalRepo, getMetalsByStore, getMetalByIdRepo, updateMetalRepo, deleteMetalRepo } from "../repositories/metalRepository.js";
import { handleDeleteError } from "../utils/errorHandler.js";
// CREATE
export const createMetal = async (data, storeId) => {
  return await createMetalRepo({
    name: data.name,
    description: data.description,
    storeId,
  });
};

// GET ALL
export const getMetals = async (storeId) => {
  return await getMetalsByStore(storeId);
};

// GET BY ID
export const getMetalById = async (id, storeId) => {
  const metal = await getMetalByIdRepo(id);

  if (!metal) throw new Error("Metal not found");

  if (metal.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return metal;
};

// UPDATE
export const updateMetal = async (id, data, storeId) => {
  const metal = await getMetalByIdRepo(id);

  if (!metal) throw new Error("Metal not found");

  if (metal.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return await updateMetalRepo(id, {
    name: data.name,
    description: data.description,
  });
};

// DELETE
export const deleteMetal = async (id, storeId) => {
  const metal = await getMetalByIdRepo(id);

  if (!metal) throw new Error("Metal not found");

  if (metal.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

   try {
    return await deleteMetalRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "metal"));
  }
};