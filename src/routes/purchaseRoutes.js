import express from "express";
import { upload } from "../middleware/uploadS3.js";  // CHANGED - use your S3 multer config

import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  getPurchaseItemsByPurchaseId,
  updatePurchase,
  deletePurchase,
  getPurchaseCount,
  downloadPurchasePdf
} from "../controllers/purchaseController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// ===== CHANGED: use S3 upload instead of local diskStorage =====
const purchaseUpload = upload.fields([
  { name: "document", maxCount: 1 },
  { name: "itemPhotos", maxCount: 10 }
]);

router.post("/create", authMiddleware, purchaseUpload, createPurchase);

router.get("/get", authMiddleware, getPurchases);

router.get("/getById/:id", authMiddleware, getPurchaseById);

router.get("/itemsByPurchase/:id", authMiddleware, getPurchaseItemsByPurchaseId);

router.put("/update/:id", authMiddleware, purchaseUpload, updatePurchase);

router.delete("/delete/:id", authMiddleware, deletePurchase);

router.get("/count", authMiddleware, getPurchaseCount);
router.get("/downloadPdf/:id", authMiddleware, downloadPurchasePdf);
export default router;
