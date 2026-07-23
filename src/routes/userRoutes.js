import express from "express";
import { signup, login, forgot, reset, logout } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/errorHandler.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", authMiddleware, logout);
router.post("/forgot", forgot);
router.post("/reset", reset);

export default router;