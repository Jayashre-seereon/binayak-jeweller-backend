import express from "express";
import {
  createDesign,
  getDesigns,
  getDesignById,
  updateDesign,
  deleteDesign
} from "../controllers/DesignController.js";
import { upload } from "../middleware/uploadS3.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware,  upload.single("image"),createDesign);
router.get("/get", authMiddleware, getDesigns);
router.get("/getbyId/:id", authMiddleware, getDesignById);
router.put("/update/:id", authMiddleware,  upload.single("image"),updateDesign);
router.delete("/delete/:id", authMiddleware, deleteDesign);

export default router;