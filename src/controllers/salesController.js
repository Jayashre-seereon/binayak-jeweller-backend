import * as salesService from "../services/salesService.js";
import * as salesPdfService from "../services/salesPdfService.js";
import * as reportExcelService from "../services/reportExcelService.js";

export const createSale = async (
  req,
  res
) => {
  try {
    const storeId = Number(
      req.query.storeId
    );

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store before creating a sale.",
      });
    }

    const sale =
      await salesService.createSaleService(
        req.body,
        storeId,
        req.user
      );

    return res.status(201).json({
      success: true,
      message:
        "Sale created successfully",
      sale,
      invoiceNo: sale.invoiceNo,
      pdfUrl: `/api/sales/downloadPdf/${sale.id}?storeId=${storeId}`,
    });
  } catch (error) {
    console.error(
      "Create sale error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create sale. Please try again.",
    });
  }
};

export const getSales = async (
  req,
  res
) => {
  try {
    const storeId = Number(
      req.query.storeId
    );

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store to view sales.",
      });
    }

    const sales =
      await salesService.getSalesService(
        storeId
      );

    return res.json({
      success: true,
      count: sales.length,
      sales,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load sales at the moment.",
    });
  }
};

export const getSaleById = async (
  req,
  res
) => {
  try {
    const storeId = Number(
      req.query.storeId
    );

    const sale =
      await salesService.getSaleByIdService(
        Number(req.params.id),
        storeId
      );

    return res.json({
      success: true,
      sale,
    });
  } catch (error) {
    return res.status(404).json({
      success: false,
      message: error.message || "Sale record not found.",
    });
  }
};

export const getSaleCount = async (
  req,
  res
) => {
  try {
    const storeId = Number(
      req.query.storeId
    );

    const count =
      await salesService.getSaleCountService(
        storeId
      );

    return res.json({
      success: true,
      count,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load sale summary.",
    });
  }
};

export const downloadSalePdf = async (
  req,
  res
) => {
  try {
    const saleId = Number(req.params.id);
    const storeId = Number(req.query.storeId);

    if (!saleId) {
      return res.status(400).json({
        success: false,
        message: "Please choose a sale invoice to download.",
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store before downloading the invoice.",
      });
    }

    await salesPdfService.generateSalePdf(
      saleId,
      storeId,
      res
    );
  } catch (error) {
    console.error(
      "Download sale PDF error:",
      error
    );

    if (!res.headersSent) {
      return res.status(400).json({
        success: false,
        message: error.message || "Unable to download the invoice right now.",
      });
    }
  }
};
export const getSalesReport = async (
  req,
  res
) => {
  try {
    const storeId = Number(
      req.query.storeId
    );

    const report =
      await salesService.getSalesReportService({
        storeId,
        period:
          req.query.period || "THIS_MONTH",
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
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
        "Unable to load sales report.",
    });
  }
};

export const exportSalesReportExcel = async (
  req,
  res
) => {
  try {
    const storeId = Number(
      req.query.storeId
    );

    const report =
      await salesService.getSalesReportService({
        storeId,
        period:
          req.query.period || "THIS_MONTH",
        fromDate: req.query.fromDate,
        toDate: req.query.toDate,
      });

    await reportExcelService.generateSalesReportExcel(report, res);
  } catch (error) {
    console.error("Export sales report excel error:", error);
    if (!res.headersSent) {
      return res.status(400).json({
        success: false,
        message:
          error.message ||
          "Unable to export sales report to Excel.",
      });
    }
  }
};