import express from "express";

import {
  createInventory,
  getInventories,
  getInventoryById,
  updateInventory,
  updateInventoryStatus,
  deleteInventory,
} from "../controllers/inventoryController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createInventory);

router.get("/get", authMiddleware, getInventories);

router.get("/getById/:id", authMiddleware, getInventoryById);

router.put("/update/:id", authMiddleware, updateInventory);

router.put(
  "/status/:id",
  authMiddleware,
  updateInventoryStatus
);

router.delete("/delete/:id", authMiddleware, deleteInventory);

export default router;
