import express from "express";
import { createStoreController,getAllStoresController,  getStoreByIdController,updateStoreController,deleteStoreController, } from "../controllers/storeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/create", authMiddleware, createStoreController);
router.get("/get",authMiddleware, getAllStoresController);
router.get("/getById/:id", authMiddleware, getStoreByIdController);
router.put("/update/:id", authMiddleware, updateStoreController);
router.delete("/delete/:id", authMiddleware, deleteStoreController);

export default router;