import * as categoryService from "../services/categoryService.js";

// CREATE
export const createCategory = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const category = await categoryService.createCategory(
      req.body,
      storeId
    );

    res.status(201).json({
      success: true,
      category,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// GET ALL
export const getCategories = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const categories = await categoryService.getCategories(storeId);

    res.json({
      success: true,
      categories,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// GET BY ID
export const getCategoryById = async (req, res) => {
  try {
    const category = await categoryService.getCategoryById(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      category,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// UPDATE
export const updateCategory = async (req, res) => {
  try {
    const category = await categoryService.updateCategory(
      Number(req.params.id),
      req.body,
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      category,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// DELETE
export const deleteCategory = async (req, res) => {
  try {
    await categoryService.deleteCategory(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};