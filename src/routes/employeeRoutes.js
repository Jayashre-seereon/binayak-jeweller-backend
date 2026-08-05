import express from "express";
import {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} from "../controllers/employeeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
const router = express.Router();

router.post("/create", authMiddleware, createEmployee);
router.get("/get", authMiddleware, getEmployees);
router.get("/getById/:id", authMiddleware, getEmployeeById);
router.put("/update/:id", authMiddleware, updateEmployee);
router.delete("/delete/:id", authMiddleware, deleteEmployee);

export default router;