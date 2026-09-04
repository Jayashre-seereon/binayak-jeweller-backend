import express from "express";
import * as ctrl from "../controllers/rateController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, ctrl.createRate);
router.get("/get", authMiddleware, ctrl.getRates);
router.get("/getById/:id", authMiddleware, ctrl.getRateById);
router.put("/update/:id", authMiddleware, ctrl.updateRate);
router.delete("/delete/:id", authMiddleware, ctrl.deleteRate);

export default router;