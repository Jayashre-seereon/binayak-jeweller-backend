import express from "express";
import { createStoreController,getAllStoresController,  getStoreByIdController,updateStoreController,deleteStoreController, } from "../controllers/storeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { refreshStoreToken } from "../controllers/userController.js";

const router = express.Router();

router.post("/refresh-token", refreshStoreToken);
router.post("/create", authMiddleware, createStoreController);
router.get("/get",authMiddleware, getAllStoresController);
router.get("/getById/:id", authMiddleware, getStoreByIdController);
router.put("/update/:id", authMiddleware, updateStoreController);
router.delete("/delete/:id", authMiddleware, deleteStoreController);

export default router;
