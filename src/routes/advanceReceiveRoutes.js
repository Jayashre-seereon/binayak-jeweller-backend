import express from "express";

import {
  createAdvanceReceive,
  getAdvanceReceives,
  getAdvanceReceiveById,
  updateAdvanceReceive,
  deleteAdvanceReceive,
} from "../controllers/advanceReceiveController.js";

import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post(
  "/create",
  authMiddleware,
  createAdvanceReceive
);

router.get(
  "/get",
  authMiddleware,
  getAdvanceReceives
);

router.get(
  "/getById/:id",
  authMiddleware,
  getAdvanceReceiveById
);

router.put(
  "/update/:id",
  authMiddleware,
  updateAdvanceReceive
);

router.delete(
  "/delete/:id",
  authMiddleware,
  deleteAdvanceReceive
);

export default router;