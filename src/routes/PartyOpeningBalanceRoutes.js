import express from "express";
import * as ctrl from "../controllers/partyOpeningBalanceController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/create", authMiddleware, ctrl.createPartyOpeningBalance);
router.get("/get", authMiddleware, ctrl.getPartyOpeningBalances);
router.get("/getById/:id", authMiddleware, ctrl.getPartyOpeningBalanceById);
router.put("/update/:id", authMiddleware, ctrl.updatePartyOpeningBalance);
router.delete("/delete/:id", authMiddleware, ctrl.deletePartyOpeningBalance);

export default router;