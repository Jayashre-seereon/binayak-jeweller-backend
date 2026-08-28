import express from "express";

import {
  createSale,
  getSales,
  getSaleById,
  getSaleCount,
  downloadSalePdf,
  getSalesReport
} from "../controllers/salesController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  createSale
);

router.get(
  "/get",
  authMiddleware,
  getSales
);
router.get(
  "/report",
  authMiddleware,
  getSalesReport
);
router.get(
  "/getById/:id",
  authMiddleware,
  getSaleById
);

router.get(
  "/count",
  authMiddleware,
  getSaleCount
);

router.get(
  "/downloadPdf/:id",
  authMiddleware,
  downloadSalePdf
);

export default router;
