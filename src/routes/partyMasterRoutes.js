import express from "express";
import * as ctrl from "../controllers/partyMasterController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/create", authMiddleware, ctrl.createPartyMaster);
router.get("/get", authMiddleware, ctrl.getPartyMasters);
router.get("/getById/:id", authMiddleware, ctrl.getPartyMasterById);
router.put("/update/:id", authMiddleware, ctrl.updatePartyMaster);
router.delete("/delete/:id", authMiddleware, ctrl.deletePartyMaster);

export default router;