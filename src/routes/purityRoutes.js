import express from "express";
import * as ctrl from "../controllers/purityController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, ctrl.createPurity);
router.get("/get", authMiddleware, ctrl.getPurities);
router.get("/getById/:id", authMiddleware, ctrl.getPurityById);
router.put("/update/:id", authMiddleware, ctrl.updatePurity);
router.delete("/delete/:id", authMiddleware, ctrl.deletePurity);

export default router;