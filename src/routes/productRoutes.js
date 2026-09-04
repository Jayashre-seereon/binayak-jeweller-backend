import express from "express";
import {
  createProduct,
  getProducts,
  getProductsByMetalId,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { upload } from "../middleware/uploadS3.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, upload.single("image"), createProduct);
router.get("/get/", authMiddleware, getProducts);
router.get("/getByMetal/:metalId", authMiddleware, getProductsByMetalId);
router.get("/getById/:id", authMiddleware, getProductById);
router.put("/update/:id", authMiddleware, upload.single("image"), updateProduct);
router.delete("/delete/:id", authMiddleware, deleteProduct);
export default router;
