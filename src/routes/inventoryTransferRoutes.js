import express from "express";

import {
  createInventoryTransfer,
  getInventoryTransfers,
  getInventoryTransferById,
  receiveInventoryTransfer,
  updateInventoryTransfer,
} from "../controllers/inventoryTransferController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Create transfer → PENDING
router.post(
  "/create",
  authMiddleware,
  createInventoryTransfer
);

// Get all transfers
router.get(
  "/get",
  authMiddleware,
  getInventoryTransfers
);

// Get transfer by ID
router.get(
  "/getById/:id",
  authMiddleware,
  getInventoryTransferById
);

// Update transfer → ONLY when PENDING
router.put(
  "/update/:id",
  authMiddleware,
  updateInventoryTransfer
);

// Receive transfer → PENDING → RECEIVED
router.put(
  "/receive/:id",
  authMiddleware,
  receiveInventoryTransfer
);

export default router;