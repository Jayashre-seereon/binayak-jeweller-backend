import {
  createCategoryRepo,
  getCategoriesByStore,
  getCategoryByIdRepo,
  updateCategoryRepo,
  deleteCategoryRepo,
} from "../repositories/categoryRepository.js";

// CREATE
export const createCategory = async (data, storeId) => {
  return await createCategoryRepo({
    name: data.name,
    description: data.description,
    storeId,
  });
};

// GET ALL
export const getCategories = async (storeId) => {
  return await getCategoriesByStore(storeId);
};

// GET BY ID
export const getCategoryById = async (id, storeId) => {
  const category = await getCategoryByIdRepo(id);

  if (!category) throw new Error("Category not found");

  if (category.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return category;
};

// UPDATE
export const updateCategory = async (id, data, storeId) => {
  const category = await getCategoryByIdRepo(id);

  if (!category) throw new Error("Category not found");

  if (category.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return await updateCategoryRepo(id, {
    name: data.name,
    description: data.description,
  });
};

// DELETE
export const deleteCategory = async (id, storeId) => {
  const category = await getCategoryByIdRepo(id);

  if (!category) throw new Error("Category not found");

  if (category.storeId !== storeId) {
    throw new Error("Unauthorized");
  }
try {
    return await deleteCategoryRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "category"));
  }
  
};