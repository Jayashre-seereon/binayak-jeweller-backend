import express from "express";
import { getDashboardSummaryController } from "../controllers/dashboardController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/summary", authMiddleware, getDashboardSummaryController);

export default router;
