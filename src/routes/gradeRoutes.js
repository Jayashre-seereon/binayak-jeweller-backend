import express from "express";
import * as ctrl from "../controllers/gradeController.js";

const router = express.Router();

router.post("/create", ctrl.createGrade);
router.get("/get", ctrl.getGrades);
router.get("/getById/:id", ctrl.getGradeById);
router.put("/update/:id", ctrl.updateGrade);
router.delete("/delete/:id", ctrl.deleteGrade);

export default router;