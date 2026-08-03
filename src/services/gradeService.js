import * as repo from "../repositories/gradeRepository.js";

// CREATE
export const createGradeService = async (data, storeId) => {
  if (!data.name) {
    throw new Error("Grade name is required");
  }

  if (!data.purityId) {
    throw new Error("Purity is required");
  }

  if (data.percentage > 100) {
    throw new Error("Percentage cannot be more than 100");
  }

  return await repo.createGradeRepo({
    ...data,
    storeId,
  });
};

// GET
export const getGradesService = async (storeId) => {
  return await repo.getGradesRepo(storeId);
};
// GET BY ID
export const getGradeByIdService = async (id) => {
  return await repo.getGradeByIdRepo(id);
};

// UPDATE
export const updateGradeService = async (id, data) => {
  if (data.percentage && data.percentage > 100) {
    throw new Error("Percentage cannot be more than 100");
  }

  return await repo.updateGradeRepo(id, data);
};

// DELETE
export const deleteGradeService = async (id) => {
  return await repo.deleteGradeRepo(id);
};