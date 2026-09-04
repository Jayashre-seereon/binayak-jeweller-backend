import ExcelJS from "exceljs";

const formatDate = (dateVal) => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatCurrency = (val) => {
  const n = Number(val || 0);
  return Math.round((n + Number.EPSILON) * 100) / 100;
};

/**
 * Common styling helper for header cells
 */
const applyHeaderStyle = (row) => {
  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF1E293B" }, // Slate 800
    };
    cell.font = {
      bold: true,
      color: { argb: "FFFFFFFF" },
      size: 11,
    };
    cell.alignment = {
      vertical: "middle",
      horizontal: "center",
      wrapText: true,
    };
    cell.border = {
      top: { style: "thin", color: { argb: "FF94A3B8" } },
      left: { style: "thin", color: { argb: "FF94A3B8" } },
      bottom: { style: "medium", color: { argb: "FF64748B" } },
      right: { style: "thin", color: { argb: "FF94A3B8" } },
    };
  });
  row.height = 28;
};

/**
 * Generate and stream Sales Report Excel (.xlsx)
 */
export const generateSalesReportExcel = async (reportData, res) => {
  const { filter, summary, sales = [] } = reportData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Vinayak Jewellers ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Sales Report", {
    views: [{ showGridLines: true }],
  });

  // Column definitions (automatically creates Row 1 with headers)
  worksheet.columns = [
    { header: "Sl No", key: "slNo", width: 8 },
    { header: "Date", key: "saleDate", width: 14 },
    { header: "Invoice No", key: "invoiceNo", width: 16 },
    { header: "Customer / Party", key: "customerName", width: 24 },
    { header: "Phone", key: "customerPhone", width: 15 },
    { header: "State", key: "customerState", width: 14 },
    { header: "Items", key: "itemsCount", width: 8 },
    { header: "Gross Total (₹)", key: "grossAmount", width: 16 },
    { header: "Discount (₹)", key: "discount", width: 14 },
    { header: "Taxable (₹)", key: "taxableAmount", width: 16 },
    { header: "GST (₹)", key: "totalTax", width: 14 },
    { header: "Old Gold Adj (₹)", key: "oldGoldAmount", width: 16 },
    { header: "Adv Adj (₹)", key: "advanceAmount", width: 14 },
    { header: "Net Payable (₹)", key: "netPayable", width: 16 },
    { header: "Paid (₹)", key: "paidAmount", width: 14 },
    { header: "Due (₹)", key: "dueAmount", width: 14 },
    { header: "Payment Modes", key: "paymentModes", width: 20 },
  ];

  // Header Row styling (Row 1)
  const headerRow = worksheet.getRow(1);
  applyHeaderStyle(headerRow);

  // Add Data Rows
  sales.forEach((s, idx) => {
    const custName = s.customerName || s.party?.name || s.customer?.name || "-";
    const phone = s.customerPhone || s.party?.phone || s.customer?.phone || "-";
    const state = s.customerState || s.placeOfSupply || "-";
    const itemsCount = s.items?.length || 0;
    const gross = formatCurrency(s.grossAmount || s.subTotal || s.grossTotal || 0);
    const disc = formatCurrency(Number(s.discount || 0) + Number(s.offerDiscount || 0));
    const taxable = formatCurrency(s.taxableAmount || 0);
    const tax = formatCurrency(s.totalTax || s.taxAmount || 0);
    const oldGold = formatCurrency(s.oldGoldAmount || 0);
    const adv = formatCurrency(s.advanceAmount || 0);
    const net = formatCurrency(s.netPayable || s.payableAmount || s.totalAmount || 0);
    const paid = formatCurrency(s.paidAmount || 0);
    const due = formatCurrency(s.dueAmount ?? Math.max(0, net - paid));
    const payModes = s.payments?.map((p) => p.paymentMode).filter(Boolean).join(", ") || "-";

    const row = worksheet.addRow({
      slNo: idx + 1,
      saleDate: formatDate(s.saleDate || s.createdAt),
      invoiceNo: s.invoiceNo || "-",
      customerName: custName,
      customerPhone: phone,
      customerState: state,
      itemsCount: itemsCount,
      grossAmount: gross,
      discount: disc,
      taxableAmount: taxable,
      totalTax: tax,
      oldGoldAmount: oldGold,
      advanceAmount: adv,
      netPayable: net,
      paidAmount: paid,
      dueAmount: due,
      paymentModes: payModes,
    });

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (colNumber === 1 || colNumber === 2 || colNumber === 7) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber >= 8 && colNumber <= 16) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "₹#,##0.00";
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });

    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      });
    }
  });

  // Summary Row at Bottom
  const totalNet = formatCurrency(summary?.totalSales || summary?.netSales || 0);
  const totalGross = formatCurrency(summary?.totalGrossAmount || summary?.grossTotal || 0);
  const totalDisc = formatCurrency(summary?.totalDiscount || 0);
  const totalTax = formatCurrency(summary?.totalTax || summary?.taxAmount || 0);
  const totalPaid = formatCurrency(summary?.totalPaid || summary?.paidAmount || 0);
  const totalDue = formatCurrency(summary?.totalDue || summary?.dueAmount || 0);
  const totalAdv = formatCurrency(summary?.totalAdvanceAdjusted || 0);
  const totalOld = formatCurrency(summary?.totalOldGoldAdjusted || 0);

  const summaryRow = worksheet.addRow([
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    summary?.totalItems || 0,
    totalGross,
    totalDisc,
    "",
    totalTax,
    totalOld,
    totalAdv,
    totalNet,
    totalPaid,
    totalDue,
    "",
  ]);

  summaryRow.height = 26;
  summaryRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF475569" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
    if (colNumber >= 8 && colNumber <= 16) {
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.numFmt = "₹#,##0.00";
    } else {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  // Set response headers and stream output
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  const filename = `Sales_Report_${filter?.period || "Report"}_${new Date().toISOString().split("T")[0]}.xlsx`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Generate and stream Purchase Report Excel (.xlsx)
 */
export const generatePurchaseReportExcel = async (reportData, res) => {
  const { filter, summary, purchases = [] } = reportData;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Vinayak Jewellers ERP";
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet("Purchase Report", {
    views: [{ showGridLines: true }],
  });

  // Columns (automatically creates Row 1 with headers)
  worksheet.columns = [
    { header: "Sl No", key: "slNo", width: 8 },
    { header: "Date", key: "date", width: 14 },
    { header: "Invoice No", key: "invoiceNo", width: 16 },
    { header: "Purchase Type", key: "purchaseType", width: 16 },
    { header: "Party / Customer", key: "partyName", width: 24 },
    { header: "Phone", key: "phone", width: 15 },
    { header: "Items", key: "itemsCount", width: 8 },
    { header: "Gross Wt (gm)", key: "grossWeight", width: 15 },
    { header: "Net Wt (gm)", key: "netWeight", width: 15 },
    { header: "Gross Amount (₹)", key: "grossAmount", width: 16 },
    { header: "Net Amount (₹)", key: "netAmount", width: 16 },
    { header: "Paid Amount (₹)", key: "paidAmount", width: 15 },
    { header: "Balance Amount (₹)", key: "balanceAmount", width: 16 },
  ];

  // Header row styling (Row 1)
  const headerRow = worksheet.getRow(1);
  applyHeaderStyle(headerRow);

  // Add Data
  let totalGrossWt = 0;
  let totalNetWt = 0;

  purchases.forEach((p, idx) => {
    const partyName = p.party?.name || p.customerName || p.customer?.name || "-";
    const phone = p.customerPhone || p.party?.phone || p.customer?.phone || "-";
    const itemsCount = p.items?.length || 0;

    const grossWt = p.items?.reduce((s, it) => s + Number(it.grossWeight || 0), 0) || 0;
    const netWt = p.items?.reduce((s, it) => s + Number(it.netWeight || 0), 0) || 0;
    totalGrossWt += grossWt;
    totalNetWt += netWt;

    const grossAmt = formatCurrency(p.grossAmount || p.totalAmount || p.netPayable || 0);
    const netAmt = formatCurrency(p.netPayable || p.totalAmount || p.grossAmount || 0);
    const paidAmt = formatCurrency(p.paidAmount || 0);
    const balanceAmt = formatCurrency(p.balanceAmount ?? p.dueAmount ?? Math.max(0, netAmt - paidAmt));

    const row = worksheet.addRow({
      slNo: idx + 1,
      date: formatDate(p.date || p.purchaseDate || p.createdAt),
      invoiceNo: p.invoiceNo || "-",
      purchaseType: p.purchaseType || "-",
      partyName,
      phone,
      itemsCount,
      grossWeight: Math.round((grossWt + Number.EPSILON) * 1000) / 1000,
      netWeight: Math.round((netWt + Number.EPSILON) * 1000) / 1000,
      grossAmount: grossAmt,
      netAmount: netAmt,
      paidAmount: paidAmt,
      balanceAmount: balanceAmt,
    });

    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 7) {
        cell.alignment = { horizontal: "center", vertical: "middle" };
      } else if (colNumber === 8 || colNumber === 9) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "#,##0.000";
      } else if (colNumber >= 10 && colNumber <= 13) {
        cell.alignment = { horizontal: "right", vertical: "middle" };
        cell.numFmt = "₹#,##0.00";
      } else {
        cell.alignment = { horizontal: "left", vertical: "middle" };
      }
    });

    if (idx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8FAFC" },
        };
      });
    }
  });

  // Summary row
  const totalPurchase = formatCurrency(summary?.totalPurchase || summary?.netPurchase || 0);
  const totalGrossAmt = formatCurrency(summary?.grossAmount || summary?.totalPurchase || 0);
  const totalPaid = formatCurrency(summary?.paidAmount || 0);
  const totalBalance = formatCurrency(summary?.balanceAmount || summary?.dueAmount || 0);

  const summaryRow = worksheet.addRow([
    "TOTAL",
    "",
    "",
    "",
    "",
    "",
    summary?.totalItems || 0,
    Math.round((totalGrossWt + Number.EPSILON) * 1000) / 1000,
    Math.round((totalNetWt + Number.EPSILON) * 1000) / 1000,
    totalGrossAmt,
    totalPurchase,
    totalPaid,
    totalBalance,
  ]);

  summaryRow.height = 26;
  summaryRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 11, color: { argb: "FF0F172A" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFF1F5F9" },
    };
    cell.border = {
      top: { style: "medium", color: { argb: "FF475569" } },
      bottom: { style: "double", color: { argb: "FF475569" } },
      left: { style: "thin", color: { argb: "FFE2E8F0" } },
      right: { style: "thin", color: { argb: "FFE2E8F0" } },
    };
    if (colNumber === 8 || colNumber === 9) {
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.numFmt = "#,##0.000";
    } else if (colNumber >= 10 && colNumber <= 13) {
      cell.alignment = { horizontal: "right", vertical: "middle" };
      cell.numFmt = "₹#,##0.00";
    } else {
      cell.alignment = { horizontal: "center", vertical: "middle" };
    }
  });

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  const filename = `Purchase_Report_${filter?.period || "Report"}_${new Date().toISOString().split("T")[0]}.xlsx`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  await workbook.xlsx.write(res);
  res.end();
};
