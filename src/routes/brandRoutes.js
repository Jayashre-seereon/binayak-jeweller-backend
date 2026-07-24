import express from "express";
import {
  createBrand,
  getBrands,
  updateBrand,
  deleteBrand,
    getBrandById
} from "../controllers/brandController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createBrand);
router.get("/get", authMiddleware, getBrands);
router.get("/getbyId/:id", authMiddleware, getBrandById);
router.put("/update/:id", authMiddleware, updateBrand);
router.delete("/delete/:id", authMiddleware, deleteBrand);

export default router;