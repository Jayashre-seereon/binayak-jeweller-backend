import express from "express";
import {
  getAccountingSummary,
  getNextNumber,
  getAccounts,
  getPendingSales,
  getPendingPurchases,
  createReceipt,
  getReceipts,
  createPayment,
  getPayments,
  createJournal,
  getJournals,
  getVoucherById,
  cancelVoucher,
} from "../controllers/accountingController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/summary", getAccountingSummary);
router.get("/next-number", getNextNumber);
router.get("/accounts", getAccounts);
router.get("/pending-sales", getPendingSales);
router.get("/pending-purchases", getPendingPurchases);

router.post("/receipts", createReceipt);
router.get("/receipts", getReceipts);

router.post("/payments", createPayment);
router.get("/payments", getPayments);

router.post("/journals", createJournal);
router.get("/journals", getJournals);

router.get("/vouchers/:id", getVoucherById);
router.post("/vouchers/:id/cancel", cancelVoucher);

export default router;
