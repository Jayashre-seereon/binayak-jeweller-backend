import express from "express";
import * as ctrl from "../controllers/gradeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/create", authMiddleware, ctrl.createGrade);
router.get("/get", authMiddleware, ctrl.getGrades);
router.get("/getById/:id", authMiddleware, ctrl.getGradeById);
router.put("/update/:id", authMiddleware, ctrl.updateGrade);
router.delete("/delete/:id", authMiddleware, ctrl.deleteGrade);

export default router;