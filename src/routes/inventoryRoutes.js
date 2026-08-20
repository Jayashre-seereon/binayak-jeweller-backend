import express from "express";

import {
  createInventory,
  getInventories,
  getInventoryById,
  getInventoryByBarcode,
  updateInventory,
  updateInventoryStatus,
  printInventoryLabel,
  deleteInventory,
} from "../controllers/inventoryController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createInventory);

router.get("/get", authMiddleware, getInventories);

router.get("/getById/:id", authMiddleware, getInventoryById);
router.get("/getByBarcode/:barcodeNo", authMiddleware, getInventoryByBarcode);

router.get("/label/:id", authMiddleware, printInventoryLabel);

router.put("/update/:id", authMiddleware, updateInventory);

router.put(
  "/status/:id",
  authMiddleware,
  updateInventoryStatus
);

router.delete("/delete/:id", authMiddleware, deleteInventory);

export default router;
