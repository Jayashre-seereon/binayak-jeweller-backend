import PDFDocument from "pdfkit";
import prisma from "../config/db.js";
import { numberToWordsIndian } from "../utils/numberToWords.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 24;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2; // 547.28

const COLORS = {
  black: "#000000",
  text: "#111827",
  muted: "#4b5563",
  border: "#9ca3af",
  darkBorder: "#374151",
  lightBorder: "#d1d5db",
  zebra: "#f9fafb",
  headerBg: "#f3f4f6",
};

const money = (val) =>
  Number(val || 0).toFixed(2);

const weightStr = (val) =>
  Number(val || 0).toFixed(3);

const formatDateTime = (dateVal) => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const hoursStr = String(hours).padStart(2, "0");

  return `${day}/${month}/${year} / ${hoursStr}:${minutes}:${ampm}`;
};

const drawHLine = (doc, x, y, width, strokeWidth = 0.5, color = COLORS.border) => {
  doc.save().lineWidth(strokeWidth).strokeColor(color).moveTo(x, y).lineTo(x + width, y).stroke().restore();
};

const drawVLine = (doc, x, y1, y2, strokeWidth = 0.5, color = COLORS.border) => {
  doc.save().lineWidth(strokeWidth).strokeColor(color).moveTo(x, y1).lineTo(x, y2).stroke().restore();
};

const drawRect = (doc, x, y, width, height, strokeWidth = 0.6, color = COLORS.darkBorder) => {
  doc.save().lineWidth(strokeWidth).strokeColor(color).rect(x, y, width, height).stroke().restore();
};

export const generateSalePdf = async (id, storeId, res) => {
  const sale = await prisma.sale.findUnique({
    where: { id: Number(id) },
    include: {
      party: true,
      customer: true,
      store: true,
      items: {
        include: {
          inventory: {
            include: {
              item: true,
              product: true,
              metal: true,
              purityMaster: true,
              grade: true,
              stone: true,
            },
          },
        },
      },
      payments: true,
      advanceAdjustments: {
        include: {
          advanceReceive: true,
        },
      },
      oldGolds: {
        include: {
          purchase: true,
        },
      },
    },
  });

  if (!sale) throw new Error("Sale invoice not found");
  if (sale.storeId !== Number(storeId)) throw new Error("Unauthorized access to invoice");

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    autoFirstPage: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="Invoice-${sale.invoiceNo}.pdf"`);
  doc.pipe(res);

  let y = MARGIN;

  /*
  ========================================
  1. TOP HEADER (TAX INVOICE | CUSTOMER COPY | BRANCH)
  ========================================
  */
  doc.font("Helvetica-Bold").fontSize(11).fillColor(COLORS.black);
  doc.text("TAX INVOICE", MARGIN, y, { width: CONTENT_WIDTH, align: "center" });

  doc.fontSize(9.5).text("CUSTOMER COPY", MARGIN + 300, y, { width: CONTENT_WIDTH - 300, align: "right" });
  y += 12;

  const branchName = sale.store?.storeName || "Bhubaneswar Branch";
  doc.font("Helvetica-Bold").fontSize(9).text(branchName.includes("Branch") ? branchName : `${branchName} Branch`, MARGIN + 300, y, { width: CONTENT_WIDTH - 300, align: "right" });
  y += 16;

  /*
  ========================================
  2. CUSTOMER & INVOICE DETAILS (2 COLUMNS)
  ========================================
  */
  const detailStartY = y;
  const col1X = MARGIN;
  const col2X = MARGIN + 310;
  const labelWidth1 = 70;
  const labelWidth2 = 85;

  const customerName = sale.party?.name || sale.customerName || "-";
  const customerAddress = sale.party?.address || sale.customerAddress || "-";
  const customerCity = sale.customerCity || "Bhubaneswar - 766001";
  const customerPhone = sale.party?.phone || sale.customerPhone || "-";
  const customerPan = sale.customerPan || "-";
  const customerGst = sale.party?.gst || sale.customerGst || "-";
  const customerState = sale.customerState || sale.store?.state || "ODISHA";

  const cinNo = sale.cinNo || sale.store?.cinNo || "U36911OR2005PTCC008217";
  const storeGst = sale.storeGst || sale.store?.gstNo || "21AAFCA3795A1Z5";
  const placeOfSupply = sale.placeOfSupply || customerState || "ODISHA";
  const invoiceNo = sale.invoiceNo || "-";
  const invoiceDateTime = formatDateTime(sale.saleDate);

  // Col 1 - Customer Details
  let c1Y = detailStartY;
  const renderField = (x, yPos, label, val, lWidth = 70) => {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.black).text(label, x, yPos, { width: lWidth });
    doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.black).text(":", x + lWidth - 8, yPos);
    doc.font("Helvetica").fontSize(8).fillColor(COLORS.black).text(String(val || ""), x + lWidth, yPos, { width: 230 - lWidth });
  };

  renderField(col1X, c1Y, "Name", customerName.toUpperCase(), labelWidth1);
  c1Y += 12;
  renderField(col1X, c1Y, "Address", customerAddress, labelWidth1);
  c1Y += 12;
  renderField(col1X, c1Y, "City", customerCity, labelWidth1);
  c1Y += 12;
  renderField(col1X, c1Y, "Contact No.", customerPhone, labelWidth1);
  c1Y += 12;
  renderField(col1X, c1Y, "PAN No.", customerPan === "-" ? "" : customerPan, labelWidth1);
  c1Y += 12;
  renderField(col1X, c1Y, "GST No.", customerGst === "-" ? "" : customerGst, labelWidth1);
  c1Y += 12;
  renderField(col1X, c1Y, "State", customerState.toUpperCase(), labelWidth1);
  c1Y += 14;

  // Col 2 - Store & Invoice Details
  let c2Y = detailStartY;
  renderField(col2X, c2Y, "CIN No.", cinNo, labelWidth2);
  c2Y += 12;
  renderField(col2X, c2Y, "GST No.", storeGst, labelWidth2);
  c2Y += 12;
  renderField(col2X, c2Y, "Place of Supply", placeOfSupply.toUpperCase(), labelWidth2);
  c2Y += 12;
  renderField(col2X, c2Y, "Invoice No.", invoiceNo, labelWidth2);
  c2Y += 12;
  renderField(col2X, c2Y, "Date", invoiceDateTime, labelWidth2);
  c2Y += 14;

  y = Math.max(c1Y, c2Y);

  /*
  ========================================
  3. ITEM DETAILS TABLE
  ========================================
  */
  const columns = [
    { key: "sr", title: "Sr.\nNo.", width: 24, align: "center" },
    { key: "particulars", title: "Particulars", width: 122, align: "left" },
    { key: "hsn", title: "HSN", width: 44, align: "center" },
    { key: "purity", title: "Purity", width: 34, align: "center" },
    { key: "pcs", title: "Pcs", width: 26, align: "center" },
    { key: "grossWt", title: "Gross Wt.\n[Gm.]", width: 50, align: "right" },
    { key: "netWt", title: "Net Wt.\n[Gm.]", width: 50, align: "right" },
    { key: "rate", title: "Rate\n[Gm/Pc]", width: 54, align: "right" },
    { key: "making", title: "Making\nCharges", width: 54, align: "right" },
    { key: "other", title: "Other\nCharges", width: 42, align: "right" },
    { key: "total", title: "Total\nAmount", width: 47, align: "right" },
  ];

  const tableX = MARGIN;
  const headerHeight = 22;
  const tableStartY = y;

  // Table Outer Box Top & Headers
  doc.rect(tableX, tableStartY, CONTENT_WIDTH, headerHeight).fillAndStroke(COLORS.headerBg, COLORS.darkBorder);

  let curX = tableX;
  columns.forEach((col, idx) => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.black);
    doc.text(col.title, curX + 2, tableStartY + 3, {
      width: col.width - 4,
      align: col.align,
    });

    if (idx < columns.length - 1) {
      drawVLine(doc, curX + col.width, tableStartY, tableStartY + headerHeight, 0.5, COLORS.border);
    }
    curX += col.width;
  });

  y = tableStartY + headerHeight;

  let totalGrossWt = 0;
  let totalNetWt = 0;
  let totalPcs = 0;
  let totalItemAmount = 0;

  const rows = sale.items || [];
  const minTableHeight = Math.max(rows.length * 30, 90);
  const rowsStartY = y;

  rows.forEach((item, index) => {
    const rowHeight = 28;
    const inv = item.inventory;

    const particularsName = (item.particulars || inv?.item?.name || inv?.product?.name || "EARRING").toUpperCase();
    const itemCodeStr = item.itemCode || inv?.barcodeNo || inv?.tagNo || inv?.inventoryCode || "";
    const hsnStr = item.hsnCode || "711319";
    const purityStr = item.purityName || (inv?.purityMaster?.name || (item.purity ? `${item.purity}K` : "22K"));
    const pcsVal = item.pieces || 1;
    const grossVal = Number(item.grossWeight || 0);
    const netVal = Number(item.netWeight || 0);
    const rateVal = Number(item.rate || 0);

    let makingStr = "";
    if (item.makingChargeType === "PERCENT" || item.makingChargeRate > 0) {
      makingStr = `${Number(item.makingChargeRate || 0).toFixed(3)} %`;
    } else {
      makingStr = money(item.makingCharges);
    }

    const otherVal = Number(item.otherCharges || item.otherAmount || 0);
    const totalVal = Number(item.totalAmount || 0);

    totalGrossWt += grossVal;
    totalNetWt += netVal;
    totalPcs += pcsVal;
    totalItemAmount += totalVal;

    let rx = tableX;
    // Sr
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(String(index + 1), rx + 2, y + 6, { width: columns[0].width - 4, align: "center" });
    rx += columns[0].width;

    const huidStr = item.huidNo || inv?.huidNo || "";
    let codeHuidText = itemCodeStr;
    if (huidStr) {
      codeHuidText = itemCodeStr ? `${itemCodeStr} | HUID: ${huidStr}` : `HUID: ${huidStr}`;
    }

    if (codeHuidText) {
      doc.font("Helvetica").fontSize(6.5).fillColor(COLORS.muted).text(codeHuidText, rx + 4, y + 14, { width: columns[1].width - 8, align: "left" });
    }
    rx += columns[1].width;

    // HSN
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(hsnStr, rx + 2, y + 6, { width: columns[2].width - 4, align: "center" });
    rx += columns[2].width;

    // Purity
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(purityStr, rx + 2, y + 6, { width: columns[3].width - 4, align: "center" });
    rx += columns[3].width;

    // Pcs
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(String(pcsVal), rx + 2, y + 6, { width: columns[4].width - 4, align: "center" });
    rx += columns[4].width;

    // Gross Wt
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(weightStr(grossVal), rx + 2, y + 6, { width: columns[5].width - 4, align: "right" });
    rx += columns[5].width;

    // Net Wt
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(weightStr(netVal), rx + 2, y + 6, { width: columns[6].width - 4, align: "right" });
    rx += columns[6].width;

    // Rate
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(money(rateVal), rx + 2, y + 6, { width: columns[7].width - 4, align: "right" });
    rx += columns[7].width;

    // Making Charges
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(makingStr, rx + 2, y + 4, { width: columns[8].width - 4, align: "right" });
    doc.font("Helvetica").fontSize(6.5).fillColor(COLORS.muted).text("0.00 /PG", rx + 2, y + 14, { width: columns[8].width - 4, align: "right" });
    rx += columns[8].width;

    // Other Charges
    doc.font("Helvetica").fontSize(7.5).fillColor(COLORS.black).text(money(otherVal), rx + 2, y + 6, { width: columns[9].width - 4, align: "right" });
    rx += columns[9].width;

    // Total Amount
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.black).text(money(totalVal), rx + 2, y + 6, { width: columns[10].width - 4, align: "right" });

    y += rowHeight;
    drawHLine(doc, tableX, y, CONTENT_WIDTH, 0.4, COLORS.lightBorder);
  });

  // If table is short, pad it
  if (y - rowsStartY < minTableHeight) {
    y = rowsStartY + minTableHeight;
  }

  // Draw Vertical Column Grid lines for the table body
  let lineX = tableX;
  columns.forEach((col, idx) => {
    if (idx < columns.length - 1) {
      drawVLine(doc, lineX + col.width, tableStartY + headerHeight, y, 0.4, COLORS.lightBorder);
    }
    lineX += col.width;
  });

  // Table Total Row
  const totalRowHeight = 18;
  drawHLine(doc, tableX, y, CONTENT_WIDTH, 0.6, COLORS.darkBorder);
  doc.rect(tableX, y, CONTENT_WIDTH, totalRowHeight).fillAndStroke("#ffffff", COLORS.darkBorder);

  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.black);
  doc.text("Total", tableX + 8, y + 5);

  const grossColX = tableX + columns[0].width + columns[1].width + columns[2].width + columns[3].width + columns[4].width;
  doc.text(weightStr(totalGrossWt), grossColX + 2, y + 5, { width: columns[5].width - 4, align: "right" });
  doc.text(weightStr(totalNetWt), grossColX + columns[5].width + 2, y + 5, { width: columns[6].width - 4, align: "right" });

  const totalAmountX = tableX + CONTENT_WIDTH - columns[10].width;
  const grossAmountVal = sale.grossAmount || totalItemAmount || sale.subtotal || 0;
  doc.text(money(grossAmountVal), totalAmountX + 2, y + 5, { width: columns[10].width - 4, align: "right" });

  // Draw table border box
  drawRect(doc, tableX, tableStartY, CONTENT_WIDTH, y + totalRowHeight - tableStartY, 0.8, COLORS.darkBorder);

  y += totalRowHeight + 6;

  /*
  ========================================
  4. BOTTOM SPLIT (LEFT: PAYMENT & HSN & TERMS | RIGHT: AMOUNT SUMMARY)
  ========================================
  */
  const splitStartY = y;
  const leftColWidth = 320;
  const rightColX = MARGIN + leftColWidth + 6;
  const rightColWidth = CONTENT_WIDTH - leftColWidth - 6;

  // ----------------------------------------
  // LEFT COLUMN: PAYMENTS
  // ----------------------------------------
  let ly = splitStartY;
  const primaryPayment = sale.payments?.[0];
  const paymentModeName = primaryPayment?.paymentChannel || (primaryPayment?.paymentMode ? `By ${primaryPayment.paymentMode}` : "By PhonePe");
  const paidAmountVal = sale.paidAmount || primaryPayment?.amount || sale.netPayable || 0;

  doc.font("Helvetica-Bold").fontSize(7.8).fillColor(COLORS.black);
  doc.text(paymentModeName.startsWith("By") ? paymentModeName : `By ${paymentModeName}`, MARGIN, ly);
  ly += 10;
  doc.font("Helvetica-Bold").fontSize(8).fillColor(COLORS.black);
  doc.text(money(paidAmountVal), MARGIN, ly);
  ly += 12;

  const trId = primaryPayment?.transactionId || primaryPayment?.referenceNo || "565708411501";
  const pDesc = primaryPayment?.description || primaryPayment?.narration || "UPI/QR CODE RECEIPT";
  doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
  doc.text(`Online :${primaryPayment?.paymentChannel || "PhonePe"}Tr.Id:${trId},${pDesc},Description :]`, MARGIN, ly, { width: leftColWidth });
  ly += 14;

  // ----------------------------------------
  // LEFT COLUMN: HSN SUMMARY TABLE
  // ----------------------------------------
  const hsnTableStartY = ly;
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.black);
  doc.text("HSN SUMMARY", MARGIN, hsnTableStartY, { width: leftColWidth, align: "center" });
  ly += 11;

  const hsnCols = [
    { title: "Sr.", width: 18, align: "center" },
    { title: "HSN/SAC", width: 44, align: "center" },
    { title: "CGST%", width: 34, align: "right" },
    { title: "CGST Amt.", width: 42, align: "right" },
    { title: "SGST%", width: 34, align: "right" },
    { title: "SGST Amt.", width: 42, align: "right" },
    { title: "IGST%", width: 32, align: "right" },
    { title: "IGST Amt.", width: 38, align: "right" },
    { title: "Total Tax", width: 36, align: "right" },
  ];

  const hsnTableH = 14;
  doc.rect(MARGIN, ly, leftColWidth, hsnTableH).fillAndStroke(COLORS.headerBg, COLORS.border);

  let hx = MARGIN;
  hsnCols.forEach((col) => {
    doc.font("Helvetica-Bold").fontSize(6).fillColor(COLORS.black);
    doc.text(col.title, hx + 1, ly + 3.5, { width: col.width - 2, align: col.align });
    hx += col.width;
  });
  ly += hsnTableH;

  // HSN Row 1
  const hsnRowH = 14;
  doc.rect(MARGIN, ly, leftColWidth, hsnRowH).stroke(COLORS.border);
  hx = MARGIN;

  const hsnCodeStr = sale.items?.[0]?.hsnCode || "711319";
  const cgstP = sale.cgstPercent !== undefined ? sale.cgstPercent : 1.5;
  const cgstA = sale.cgstAmount || (sale.taxableAmount ? (sale.taxableAmount * cgstP) / 100 : sale.cgst || 0);
  const sgstP = sale.sgstPercent !== undefined ? sale.sgstPercent : 1.5;
  const sgstA = sale.sgstAmount || (sale.taxableAmount ? (sale.taxableAmount * sgstP) / 100 : sale.sgst || 0);
  const igstP = sale.igstPercent !== undefined ? sale.igstPercent : 0.0;
  const igstA = sale.igstAmount || (sale.taxableAmount ? (sale.taxableAmount * igstP) / 100 : sale.igst || 0);
  const totalTaxA = sale.totalTax || (cgstA + sgstA + igstA) || sale.taxAmount || 0;

  const hsnVals = [
    { text: "1", align: "center" },
    { text: hsnCodeStr, align: "center" },
    { text: Number(cgstP).toFixed(3), align: "right" },
    { text: money(cgstA), align: "right" },
    { text: Number(sgstP).toFixed(3), align: "right" },
    { text: money(sgstA), align: "right" },
    { text: Number(igstP).toFixed(2), align: "right" },
    { text: money(igstA), align: "right" },
    { text: money(totalTaxA), align: "right" },
  ];

  hsnCols.forEach((col, idx) => {
    doc.font("Helvetica").fontSize(6.5).fillColor(COLORS.black);
    doc.text(hsnVals[idx].text, hx + 1, ly + 3.5, { width: col.width - 2, align: hsnVals[idx].align });
    hx += col.width;
  });

  ly += hsnRowH + 8;

  // ----------------------------------------
  // LEFT COLUMN: WORDS & DECLARATIONS
  // ----------------------------------------
  const inWords = sale.amountInWords || numberToWordsIndian(sale.netPayable || sale.grossTotal || 0);
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.black);
  doc.text("Invoice Value [ In Words ] : ", MARGIN, ly, { continued: true });
  doc.font("Helvetica").fontSize(7.5).text(inWords);
  ly += 16;

  doc.font("Helvetica-Bold").fontSize(7.5).text("Narration : ", MARGIN, ly, { continued: true });
  doc.font("Helvetica").text(sale.narration || "-");
  ly += 12;

  doc.font("Helvetica-Bold").fontSize(7.5).text("IRN No. : ", MARGIN, ly, { continued: true });
  doc.font("Helvetica").text(sale.irnNo || "-");
  ly += 14;

  const storeTagline = sale.store?.tagline || `Thank You For Visit ${sale.store?.storeName || "Binayak Jewellers"} ...`;
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.black).text(storeTagline, MARGIN, ly);
  ly += 18;

  doc.font("Helvetica").fontSize(6.5).fillColor(COLORS.muted);
  doc.text("I have verified the Weight & Pieces & found ok", MARGIN, ly);
  ly += 8;
  doc.text("I hereby agree to the Terms & Conditions mentioned backside", MARGIN, ly);
  ly += 16;

  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.black);
  doc.text("Customer Signature:", MARGIN, ly);

  // ----------------------------------------
  // RIGHT COLUMN: AMOUNT SUMMARY BREAKDOWN
  // ----------------------------------------
  let ry = splitStartY;
  drawRect(doc, rightColX, ry, rightColWidth, 204, 0.7, COLORS.border);

  const renderSumRow = (label, valStr, isBold = false, color = COLORS.black) => {
    doc.font(isBold ? "Helvetica-Bold" : "Helvetica").fontSize(7.3).fillColor(color);
    doc.text(label, rightColX + 8, ry + 3);
    doc.text(valStr, rightColX + 110, ry + 3, { width: rightColWidth - 118, align: "right" });
    ry += 12.5;
  };

  const offerDisc = Number(sale.offerDiscount || 0);
  const addDisc = Number(sale.discount || 0);
  const taxableAmt = Number(sale.taxableAmount || (grossAmountVal - offerDisc - addDisc));
  const subTotalAmt = Number(sale.subTotal || (taxableAmt + cgstA + sgstA + igstA));
  const advanceAdjAmt = Number(sale.advanceAmount || 0);
  const oldGoldAdjAmt = Number(sale.oldGoldAmount || sale.lessUrd || 0);
  const roundOffAmt = Number(sale.roundOff || 0);
  const netPayableAmt = Number(sale.netPayable || sale.grossTotal || (subTotalAmt - advanceAdjAmt - oldGoldAdjAmt + roundOffAmt));
  const paidAmt = Number(sale.paidAmount || paidAmountVal || 0);
  const dueAmt = Number(sale.dueAmount ?? Math.max(0, netPayableAmt - paidAmt));

  renderSumRow("Gross Amount", money(grossAmountVal));
  if (offerDisc > 0) renderSumRow("Offer Discount [-]", money(offerDisc));
  if (addDisc > 0) renderSumRow("Discount [-]", money(addDisc));
  renderSumRow("Taxable Amount", money(taxableAmt), true);
  if (!isInterState) {
    renderSumRow("CGST Amt. [ + ]", money(cgstA));
    renderSumRow("SGST Amt. [ + ]", money(sgstA));
  } else {
    renderSumRow("IGST Amt. [ + ]", money(igstA));
  }
  renderSumRow("Sub Total", money(subTotalAmt), true);
  if (advanceAdjAmt > 0) renderSumRow("Advance Adj. [-]", money(advanceAdjAmt), false, "#047857");
  if (oldGoldAdjAmt > 0) renderSumRow("Old Jewellery / Less URD [-]", money(oldGoldAdjAmt), false, "#b45309");
  renderSumRow("Round Off [ +/- ]", money(roundOffAmt));
  drawHLine(doc, rightColX, ry + 1, rightColWidth, 0.5, COLORS.border);
  ry += 3;
  renderSumRow("Net Payable", money(netPayableAmt), true);
  renderSumRow("Paid Amount", money(paidAmt), true, "#047857");
  if (dueAmt > 0) {
    renderSumRow("Due Amount", money(dueAmt), true, "#b91c1c");
  }

  ry += 4;
  const cashierDisplay = sale.cashierName || sale.store?.storeName || "AdityaSahoo";
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.black);
  doc.text(`Cashier : ${cashierDisplay}`, rightColX + 8, ry);
  ry += 14;

  doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted);
  doc.text(`For ${sale.store?.storeName || "Binayak Jewellers"}`, rightColX + 8, ry, { width: rightColWidth - 16, align: "right" });
  ry += 18;

  doc.font("Helvetica-Bold").fontSize(7.5).fillColor(COLORS.black);
  doc.text("Authorised Signatory", rightColX + 8, ry, { width: rightColWidth - 16, align: "right" });

  doc.end();
};
