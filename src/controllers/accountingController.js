import * as accountingService from "../services/accountingService.js";
import { generateVoucherPdf } from "../services/voucherPdfService.js";

const getStoreId = (req) => {
  const s = req.query.storeId || req.body.storeId || req.headers["x-store-id"];
  return Number(s);
};

export const getAccountingSummary = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const summary = await accountingService.getAccountingSummaryService(storeId);
    return res.status(200).json({ success: true, data: summary });
  } catch (error) {
    console.error("getAccountingSummary error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getNextNumber = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    const type = req.query.type || "RECEIPT";
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const nextNumber = await accountingService.getNextVoucherNumberPreviewService(type, storeId);
    return res.status(200).json({ success: true, nextNumber });
  } catch (error) {
    console.error("getNextNumber error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getAccounts = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const accounts = await accountingService.getAccountsService(storeId);
    return res.status(200).json({ success: true, data: accounts });
  } catch (error) {
    console.error("getAccounts error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getPendingSales = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    const { customerId, phone } = req.query;
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const sales = await accountingService.getCustomerPendingSalesService(customerId, phone, storeId);
    return res.status(200).json({ success: true, data: sales });
  } catch (error) {
    console.error("getPendingSales error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getPendingPurchases = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    const { partyId, phone } = req.query;
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const result = await accountingService.getSupplierPendingPurchasesService({ partyId, phone }, storeId);
    return res.status(200).json({
      success: true,
      supplier: result.supplier,
      totalOutstandingDue: result.totalOutstandingDue,
      data: result.data,
    });
  } catch (error) {
    console.error("getPendingPurchases error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getPendingSuppliers = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const suppliers = await accountingService.getPendingSuppliersService(storeId);
    return res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    console.error("getPendingSuppliers error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createReceipt = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const voucher = await accountingService.createReceiptVoucherService(req.body, storeId, req.user);
    return res.status(201).json({
      success: true,
      message: `Receipt Voucher ${voucher.voucherNo} created successfully`,
      data: { ...voucher, pdfUrl: `/api/accounting/vouchers/${voucher.id}/downloadPdf?storeId=${storeId}` },
    });
  } catch (error) {
    console.error("createReceipt error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getReceipts = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const result = await accountingService.getVouchersService("RECEIPT", storeId, req.query);
    return res.status(200).json({
      success: true,
      ...result,
      vouchers: result.vouchers.map((voucher) => ({
        ...voucher,
        pdfUrl: `/api/accounting/vouchers/${voucher.id}/downloadPdf?storeId=${storeId}`,
      })),
    });
  } catch (error) {
    console.error("getReceipts error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createPayment = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const voucher = await accountingService.createPaymentVoucherService(req.body, storeId, req.user);
    return res.status(201).json({
      success: true,
      message: `Payment Voucher ${voucher.voucherNo} created successfully`,
      data: { ...voucher, pdfUrl: `/api/accounting/vouchers/${voucher.id}/downloadPdf?storeId=${storeId}` },
    });
  } catch (error) {
    console.error("createPayment error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const result = await accountingService.getVouchersService("PAYMENT", storeId, req.query);
    return res.status(200).json({
      success: true,
      ...result,
      vouchers: result.vouchers.map((voucher) => ({
        ...voucher,
        pdfUrl: `/api/accounting/vouchers/${voucher.id}/downloadPdf?storeId=${storeId}`,
      })),
    });
  } catch (error) {
    console.error("getPayments error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const createJournal = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const voucher = await accountingService.createJournalEntryService(req.body, storeId, req.user);
    return res.status(201).json({
      success: true,
      message: `Journal Entry ${voucher.voucherNo} created successfully`,
      data: { ...voucher, pdfUrl: `/api/accounting/vouchers/${voucher.id}/downloadPdf?storeId=${storeId}` },
    });
  } catch (error) {
    console.error("createJournal error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getJournals = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const result = await accountingService.getVouchersService("JOURNAL", storeId, req.query);
    return res.status(200).json({
      success: true,
      ...result,
      vouchers: result.vouchers.map((voucher) => ({
        ...voucher,
        pdfUrl: `/api/accounting/vouchers/${voucher.id}/downloadPdf?storeId=${storeId}`,
      })),
    });
  } catch (error) {
    console.error("getJournals error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};

export const getVoucherById = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const voucher = await accountingService.getVoucherByIdService(id, storeId);
    return res.status(200).json({
      success: true,
      data: { ...voucher, pdfUrl: `/api/accounting/vouchers/${voucher.id}/downloadPdf?storeId=${storeId}` },
    });
  } catch (error) {
    console.error("getVoucherById error:", error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

export const downloadVoucherPdf = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    if (!storeId) return res.status(400).json({ success: false, message: "storeId is required" });
    const voucher = await accountingService.getVoucherByIdService(req.params.id, storeId);
    await generateVoucherPdf(voucher, res);
  } catch (error) {
    console.error("downloadVoucherPdf error:", error);
    if (!res.headersSent) return res.status(404).json({ success: false, message: error.message });
  }
};

export const cancelVoucher = async (req, res) => {
  try {
    const storeId = getStoreId(req);
    const { id } = req.params;
    const { reason } = req.body;
    if (!storeId) {
      return res.status(400).json({ success: false, message: "storeId is required" });
    }
    const updated = await accountingService.cancelVoucherService(id, storeId, reason, req.user);
    return res.status(200).json({
      success: true,
      message: `Voucher ${updated.voucherNo} has been cancelled and reversed safely`,
      data: updated,
    });
  } catch (error) {
    console.error("cancelVoucher error:", error);
    return res.status(400).json({ success: false, message: error.message });
  }
};
