import * as repo from "../repositories/purityRepository.js";

export const createPurity = async (data, storeId) => {
  return repo.createPurityRepo({
    name: data.name,
    description: data.description,
    metalId: data.metalId,
    storeId,
  });
};

export const getPurities = async (storeId) => {
  return repo.getPuritiesRepo(storeId);
};

export const getPurityById = async (id, storeId) => {
  const purity = await repo.getPurityByIdRepo(id);

  if (!purity) {
    throw new Error("Purity not found");
  }

  if (purity.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return purity;
};

export const updatePurity = async (id, data, storeId) => {
  const purity = await repo.getPurityByIdRepo(id);

  if (!purity) {
    throw new Error("Purity not found");
  }

  if (purity.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return repo.updatePurityRepo(id, data);
};

export const deletePurity = async (id, storeId) => {
  const purity = await repo.getPurityByIdRepo(id);

  if (!purity) {
    throw new Error("Purity not found");
  }

  if (purity.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  try {
    return await repo.deletePurityRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "purity"));
  }
};