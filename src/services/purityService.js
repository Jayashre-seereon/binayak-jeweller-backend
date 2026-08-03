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

export const getPurityById = async (id) => {
  return repo.getPurityByIdRepo(id);
};

export const updatePurity = async (id, data) => {
  return repo.updatePurityRepo(id, data);
};

export const deletePurity = async (id) => {
  return repo.deletePurityRepo(id);
};