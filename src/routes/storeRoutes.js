import express from "express";
import { createStoreController } from "../controllers/storeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", authMiddleware, createStoreController);

export default router;