import express from "express";
import {
  createMetal,
  getMetals,
  getMetalById,
  updateMetal,
  deleteMetal
} from "../controllers/metalController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createMetal);
router.get("/get", authMiddleware, getMetals);
router.get("/getById/:id", authMiddleware, getMetalById);
router.put("/update/:id", authMiddleware, updateMetal);
router.delete("/delete/:id", authMiddleware, deleteMetal);

export default router;