import express from "express";
import {
  createPartyType,
  getPartyTypes,
  getPartyTypeById,
  updatePartyType,
  deletePartyType
} from "../controllers/partytypeController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createPartyType);
router.get("/get", authMiddleware, getPartyTypes);
router.get("/getbyId/:id", authMiddleware, getPartyTypeById);
router.put("/update/:id", authMiddleware, updatePartyType);
router.delete("/delete/:id", authMiddleware, deletePartyType);

export default router;