import express from "express";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/categoryController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createCategory);
router.get("/get", authMiddleware, getCategories);
router.get("/getbyId/:id", authMiddleware, getCategoryById);
router.put("/update/:id", authMiddleware, updateCategory);
router.delete("/delete/:id", authMiddleware, deleteCategory);

export default router;