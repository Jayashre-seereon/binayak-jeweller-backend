import * as repo from "../repositories/gradeRepository.js";
import { handleDeleteError } from "../utils/errorHandler.js";

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
export const getGradeByIdService = async (id, storeId) => {
  const grade = await repo.getGradeByIdRepo(id);

  if (!grade) {
    throw new Error("Grade not found");
  }

  if (grade.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return grade;
};

// UPDATE
export const updateGradeService = async (id, data, storeId) => {
  const grade = await repo.getGradeByIdRepo(id);

  if (!grade) {
    throw new Error("Grade not found");
  }

  if (grade.storeId !== storeId) {
    throw new Error("Unauthorized");
  }
  if (data.percentage && data.percentage > 100) {
    throw new Error("Percentage cannot be more than 100");
  }
  return await repo.updateGradeRepo(id, data);
};

// DELETE
export const deleteGradeService = async (id, storeId) => {
  const grade = await repo.getGradeByIdRepo(id);

  if (!grade) {
    throw new Error("Grade not found");
  }

  if (grade.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

 try {
    return await repo.deleteGradeRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "grade"));
  }
};
