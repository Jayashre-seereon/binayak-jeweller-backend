import * as purchaseService from "../services/purchaseService.js";
import * as purchasePdfService from "../services/purchasePdfService.js";
import * as reportExcelService from "../services/reportExcelService.js";
export const createPurchase = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const data = typeof req.body.data === "string"
      ? JSON.parse(req.body.data)
      : req.body;

    // ===== CHANGED: use file.location (S3 URL) instead of local path =====
    if (req.files?.document?.[0]) {
      data.document = req.files.document[0].location;
    }

    if (req.files?.itemPhotos?.length) {
      req.files.itemPhotos.forEach((file, i) => {
        if (data.items?.[i]) {
          data.items[i].itemPhoto = file.location;
        }
      });
    }

    const purchase = await purchaseService.createPurchase(data, storeId);

    res.status(201).json({
      success: true,
      message: "Purchase created successfully",
      purchase
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

export const updatePurchase = async (req, res) => {
  try {
    const data = typeof req.body.data === "string"
      ? JSON.parse(req.body.data)
      : req.body;

    // ===== CHANGED: use file.location (S3 URL) =====
    if (req.files?.document?.[0]) {
      data.document = req.files.document[0].location;
    }

    if (req.files?.itemPhotos?.length) {
      req.files.itemPhotos.forEach((file, i) => {
        if (data.items?.[i]) {
          data.items[i].itemPhoto = file.location;
        }
      });
    }

    const purchase = await purchaseService.updatePurchase(
      Number(req.params.id),
      data,
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      message: "Purchase updated successfully",
      purchase
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// getPurchases, getPurchaseById, deletePurchase, getPurchaseCount — unchanged, copy as-is
export const getPurchases = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const purchases = await purchaseService.getPurchases(
      storeId
    );

    res.json({
      success: true,
      purchases
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getPurchaseById = async (req, res) => {
  try {
    const purchase = await purchaseService.getPurchaseById(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      purchase
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getPurchaseItemsByPurchaseId = async (req, res) => {
  try {
    const purchaseItems = await purchaseService.getPurchaseItemsByPurchaseId(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      purchaseItems
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getOldGoldPurchasesByPhone = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);
    const phone = String(req.query.phone || "").trim();

    const purchases =
      await purchaseService.getOldGoldPurchasesByPhoneService(
        storeId,
        phone
      );

    res.json({
      success: true,
      purchases,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};



export const deletePurchase = async (req, res) => {
  try {
    await purchaseService.deletePurchase(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      message: "Purchase deleted successfully"
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const getPurchaseCount = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const count = await purchaseService.getPurchaseCount(
      storeId
    );

    res.json({
      success: true,
      count
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message
    });
  }
};

export const downloadPurchasePdf = async (req, res) => {
  try {
    const purchaseId = Number(req.params.id);
    const storeId = Number(req.query?.storeId || req.user?.storeId || 1);

    if (!purchaseId) {
      return res.status(400).json({
        success: false,
        message: "Please select a purchase record."
      });
    }

    await purchasePdfService.generatePurchasePdf(
      purchaseId,
      storeId,
      res
    );
  } catch (err) {
    console.error("Purchase PDF Error:", err);

    if (!res.headersSent) {
      res.status(400).json({
        success: false,
        message: err.message || "Unable to complete purchase action. Please try again."
      });
    }
  }
};
export const getPurchaseReport = async (
  req,
  res
) => {
  try {
    const storeId = Number(
      req.query.storeId
    );

    const report =
      await purchaseService.getPurchaseReportService({
        storeId,
        period:
          req.query.period ||
          "THIS_MONTH",
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        purchaseType:
          req.query.purchaseType || "ALL",
      });

    return res.json({
      success: true,
      ...report,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      message:
        error.message ||
        "Unable to load purchase report.",
    });
  }
};

export const exportPurchaseReportExcel = async (
  req,
  res
) => {
  try {
    const storeId = Number(
      req.query.storeId
    );

    const report =
      await purchaseService.getPurchaseReportService({
        storeId,
        period:
          req.query.period ||
          "THIS_MONTH",
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
        purchaseType:
          req.query.purchaseType || "ALL",
      });

    await reportExcelService.generatePurchaseReportExcel(report, res);
  } catch (error) {
    console.error("Export purchase report excel error:", error);
    if (!res.headersSent) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to export purchase report to Excel.",
      });
    }
  }
};