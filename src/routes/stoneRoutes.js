import express from "express";

import {
  createStone,
  getStones,
  getStonesByProductIdAndItemId,
  getStoneById,
  updateStone,
  deleteStone,
} from "../controllers/stoneController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/create", authMiddleware, createStone);
router.get("/get", authMiddleware, getStones);
router.get("/getByProductItem/:productId/:itemId", authMiddleware, getStonesByProductIdAndItemId);
router.get("/getById/:id", authMiddleware, getStoneById);
router.put("/update/:id", authMiddleware, updateStone);
router.delete("/delete/:id", authMiddleware, deleteStone);

export default router;
