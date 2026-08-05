import express from "express";
import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productController.js";
import { upload } from "../middleware/uploadS3.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", upload.single("image"), createProduct);
router.get("/get/", getProducts);
router.get("/getById/:id", getProductById);
router.put("/update/:id", upload.single("image"), updateProduct);
router.delete("/delete/:id", deleteProduct);
export default router;