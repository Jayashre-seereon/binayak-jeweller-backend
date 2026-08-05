import express from "express";
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { upload } from "../middleware/uploadS3.js";

const router = express.Router();

router.post("/create", authMiddleware, upload.single("image"), createItem);
router.get("/get", authMiddleware, getItems);
router.get("/getById/:id", authMiddleware, getItemById);
router.put("/update/:id", authMiddleware, upload.single("image"), updateItem);
router.delete("/delete/:id", authMiddleware, deleteItem);

export default router;