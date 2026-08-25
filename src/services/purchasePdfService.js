import PDFDocument from "pdfkit";
import prisma from "../config/db.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;

const MARGIN = 34;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  ink: "#1c1917", // near-black warm gray — primary text
  slate: "#57534e", // secondary text
  muted: "#8a8580", // tertiary / placeholders
  gold: "#9a6a1f", // accent — headings, rules, brand
  goldDark: "#6b4a15",
  border: "#e2ddd6",
  headerFill: "#1c1917", // table header band
  headerText: "#f5f1ea",
  zebra: "#faf8f5",
  totalFill: "#f4ede1",
  paidGreen: "#3f6b4a",
  dueRed: "#a3372f"
};

const formatMoney = (value) => {
  return Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const formatNumber = (value, digits = 3) => {
  return Number(value || 0).toFixed(digits);
};

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
};


const drawLine = (doc, x1, y1, x2, y2, width = 0.6, color = COLORS.border) => {
  doc
    .save()
    .lineWidth(width)
    .strokeColor(color)
    .moveTo(x1, y1)
    .lineTo(x2, y2)
    .stroke()
    .restore();
};

const drawBox = (doc, x, y, width, height, radius = 5, color = COLORS.border) => {
  doc
    .save()
    .lineWidth(0.75)
    .strokeColor(color)
    .roundedRect(x, y, width, height, radius)
    .stroke()
    .restore();
};

const drawFilledBox = (doc, x, y, width, height, fill, radius = 5) => {
  doc.save().fillColor(fill).roundedRect(x, y, width, height, radius).fill().restore();
};

const drawAccentCard = (doc, x, y, width, height, title) => {
  drawFilledBox(doc, x, y, width, height, "#ffffff");
  drawBox(doc, x, y, width, height, 5, COLORS.border);
  drawFilledBox(doc, x, y, 3.5, height, COLORS.gold, 0);

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.gold)
    .text(title.toUpperCase(), x + 14, y + 11, { characterSpacing: 0.6 });

  drawLine(doc, x + 14, y + 24, x + width - 12, y + 24, 0.5, COLORS.border);
};

const drawLabelValue = (doc, label, value, x, y, labelWidth = 72, valueWidth = 160) => {
  doc
    .font("Helvetica-Bold")
    .fontSize(7.8)
    .fillColor(COLORS.slate)
    .text(label, x, y, { width: labelWidth });

  doc
    .font("Helvetica")
    .fontSize(8.6)
    .fillColor(COLORS.ink)
    .text(value || "-", x + labelWidth, y, { width: valueWidth });
};

const drawSectionTitle = (doc, title, x, y, width) => {
  doc
    .save()
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(COLORS.gold)
    .text(title.toUpperCase(), x, y, { characterSpacing: 0.6 });

  drawLine(doc, x, y + 15, x + width, y + 15, 0.8, COLORS.border);
  doc.restore();
};


export const generatePurchasePdf = async (id, storeId, res) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: Number(id) },
    include: {
      party: true,
      employee: true,
      store: true,
      payments: true,
      items: {
        include: {
          item: true,
          product: true,
          metal: true,
          purityMaster: true,
          grade: true,
          stone: true
        }
      }
    }
  });

  if (!purchase) {
    throw new Error("Purchase not found");
  }

  if (purchase.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    autoFirstPage: true
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="purchase-${purchase.invoiceNo || purchase.id}.pdf"`
  );

  doc.pipe(res);

  let y = MARGIN;

doc.save().fillColor(COLORS.gold).rect(MARGIN, y, CONTENT_WIDTH, 3).fill().restore();
  y += 16;

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(COLORS.ink)
    .text(purchase.store?.name || "JEWELLERY STORE", MARGIN, y, {
      width: CONTENT_WIDTH,
      align: "center"
    });

  y += 24;

  if (purchase.store?.address) {
    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.slate)
      .text(purchase.store.address, MARGIN, y, {
        width: CONTENT_WIDTH,
        align: "center"
      });
    y += 13;
  }

  y += 4;

  // Invoice title pill
  const pillText = "PURCHASE INVOICE";
  doc.font("Helvetica-Bold").fontSize(10.5);
  const pillWidth = doc.widthOfString(pillText) + 28;
  const pillX = (PAGE_WIDTH - pillWidth) / 2;

  drawFilledBox(doc, pillX, y, pillWidth, 20, COLORS.ink, 10);
  doc
    .fillColor(COLORS.headerText)
    .text(pillText, pillX, y + 5.5, { width: pillWidth, align: "center", characterSpacing: 0.8 });

  y += 32;

  
  const boxGap = 12;
  const boxWidth = (CONTENT_WIDTH - boxGap) / 2;
  const boxStartY = y;
  const infoBoxHeight = 106;

  drawAccentCard(doc, MARGIN, boxStartY, boxWidth, infoBoxHeight, "Invoice Details");

  drawLabelValue(doc, "Invoice No", purchase.invoiceNo, MARGIN + 14, boxStartY + 34, 68, boxWidth - 90);
  drawLabelValue(doc, "Invoice Date", formatDate(purchase.date), MARGIN + 14, boxStartY + 50, 68, boxWidth - 90);
  drawLabelValue(doc, "Type", purchase.purchaseType, MARGIN + 14, boxStartY + 66, 68, boxWidth - 90);
  drawLabelValue(doc, "Reference No", purchase.referenceNo || "-", MARGIN + 14, boxStartY + 82, 68, boxWidth - 90);

  const partyX = MARGIN + boxWidth + boxGap;
  drawAccentCard(doc, partyX, boxStartY, boxWidth, infoBoxHeight, "Party / Customer");

  const partyName = purchase.party?.name || purchase.customerName || "-";
  const partyPhone = purchase.party?.phone || purchase.customerPhone || "-";
  const partyAddress = purchase.address || purchase.party?.address || "-";

  drawLabelValue(doc, "Name", partyName, partyX + 14, boxStartY + 34, 55, boxWidth - 79);
  drawLabelValue(doc, "Phone", partyPhone, partyX + 14, boxStartY + 50, 55, boxWidth - 79);
  drawLabelValue(doc, "Address", partyAddress, partyX + 14, boxStartY + 66, 55, boxWidth - 79);

  if (purchase.customerIdType || purchase.customerIdNumber) {
    drawLabelValue(
      doc,
      "ID",
      `${purchase.customerIdType || "-"} ${purchase.customerIdNumber || ""}`,
      partyX + 14,
      boxStartY + 82,
      55,
      boxWidth - 79
    );
  }

  y = boxStartY + infoBoxHeight + 22;

  drawSectionTitle(doc, "Purchase Items", MARGIN, y, CONTENT_WIDTH);
  y += 24;

 
  const tableX = MARGIN;

  const columns = [
    { key: "sl", title: "SL", width: 22, align: "center" },
    { key: "product", title: "PRODUCT / ITEM", width: 105, align: "left" },
    { key: "hsn", title: "HSN", width: 44, align: "center" },
    { key: "purity", title: "PURITY", width: 38, align: "center" },
    { key: "pcs", title: "PCS", width: 26, align: "center" },
    { key: "gross", title: "GROSS", width: 52, align: "right" },
    { key: "net", title: "NET", width: 52, align: "right" },
    { key: "rate", title: "RATE", width: 54, align: "right" },
    { key: "other", title: "OTHER/STN", width: 54, align: "right" },
    { key: "amount", title: "TOTAL", width: 80, align: "right" }
  ];

  const tableWidth = columns.reduce((sum, c) => sum + c.width, 0);
  const HEADER_HEIGHT = 24;

  const drawTableHeader = () => {
    drawFilledBox(doc, tableX, y, tableWidth, HEADER_HEIGHT, COLORS.headerFill, 3);

    let x = tableX;
    columns.forEach((column) => {
      doc
        .font("Helvetica-Bold")
        .fontSize(7)
        .fillColor(COLORS.headerText)
        .text(column.title, x + 4, y + 8.5, {
          width: column.width - 8,
          align: column.align,
          characterSpacing: 0.3
        });
      x += column.width;
    });

    y += HEADER_HEIGHT;
  };
const SAFE_BOTTOM = 700;

 let segmentStartY = y - HEADER_HEIGHT;

  const closeTableSegment = (endY) => {
    drawBox(doc, tableX, segmentStartY, tableWidth, endY - segmentStartY, 3, COLORS.border);
  };

  const drawColumnGuides = (rowY, rowHeight) => {
    let x = tableX;
    columns.forEach((column) => {
      x += column.width;
      if (x < tableX + tableWidth) {
        drawLine(doc, x, rowY, x, rowY + rowHeight, 0.4, COLORS.border);
      }
    });
  };

  const ROW_HEIGHT = 34;

  const maybePageBreak = (neededHeight, continued = true) => {
    if (y + neededHeight > SAFE_BOTTOM) {
      if (continued) {
        closeTableSegment(y);
      }

      doc.addPage();
      y = MARGIN;

      if (continued) {
        doc
          .font("Helvetica-Bold")
          .fontSize(11)
          .fillColor(COLORS.ink)
          .text("PURCHASE INVOICE — CONTINUED", MARGIN, y, {
            width: CONTENT_WIDTH,
            align: "center"
          });
        y += 26;
        drawTableHeader();
        segmentStartY = y - HEADER_HEIGHT;
      }
      return true;
    }
    return false;
  };

  purchase.items.forEach((item, index) => {
    maybePageBreak(ROW_HEIGHT);

    const rowY = y;

    if (index % 2 === 1) {
      drawFilledBox(doc, tableX, rowY, tableWidth, ROW_HEIGHT, COLORS.zebra, 0);
    }

    const prodName = (item.item?.name || item.product?.name || "Purchase Item").toUpperCase();
    const otherVal = Number(item.stoneAmount || 0) + Number(item.otherAmount || 0);
    const purityVal = item.purityMaster?.name || (item.purity ? `${item.purity}K` : "-");
    const hsnVal = item.hsnCode || "711319";
    const huidVal = item.huidNo ? `HUID: ${item.huidNo}` : "";

    const values = [
      index + 1,
      huidVal ? `${prodName}\n${huidVal}` : prodName,
      hsnVal,
      purityVal,
      item.pieces || 1,
      formatNumber(item.grossWeight),
      formatNumber(item.netWeight),
      formatMoney(item.rate),
      formatMoney(otherVal),
      formatMoney(item.totalAmount)
    ];

    let x = tableX;
    columns.forEach((column, columnIndex) => {
      const isAmount = column.key === "amount";
      doc
        .font(isAmount ? "Helvetica-Bold" : "Helvetica")
        .fontSize(columnIndex === 1 ? 7.2 : 7.6)
        .fillColor(COLORS.ink)
        .text(String(values[columnIndex]), x + 3, rowY + (columnIndex === 1 ? 5 : 8), {
          width: column.width - 6,
          height: ROW_HEIGHT - 6,
          align: column.align,
          ellipsis: true
        });
      x += column.width;
    });

    drawColumnGuides(rowY, ROW_HEIGHT);
    drawLine(doc, tableX, rowY + ROW_HEIGHT, tableX + tableWidth, rowY + ROW_HEIGHT, 0.4, COLORS.border);

    y += ROW_HEIGHT;
  });

  closeTableSegment(y);

  const summaryHeight = 200;
  if (y + summaryHeight > SAFE_BOTTOM) {
    doc.addPage();
    y = MARGIN;
  }

  y += 14;

  const summaryY = y;
  const summaryWidth = 245;
  const summaryX = PAGE_WIDTH - MARGIN - summaryWidth;

  drawFilledBox(doc, summaryX, summaryY, summaryWidth, summaryHeight, "#ffffff", 5);
  drawBox(doc, summaryX, summaryY, summaryWidth, summaryHeight, 5, COLORS.border);

  doc
    .font("Helvetica-Bold")
    .fontSize(9.5)
    .fillColor(COLORS.gold)
    .text("AMOUNT SUMMARY", summaryX + 14, summaryY + 12, { characterSpacing: 0.5 });

  drawLine(doc, summaryX + 14, summaryY + 27, summaryX + summaryWidth - 14, summaryY + 27, 0.5, COLORS.border);

  let totalY = summaryY + 36;

  const summaryRow = (label, value, opts = {}) => {
    const { bold = false, color = COLORS.ink, size = 8.2 } = opts;
    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(size)
      .fillColor(bold ? COLORS.ink : COLORS.slate)
      .text(label, summaryX + 14, totalY);

    doc
      .font(bold ? "Helvetica-Bold" : "Helvetica")
      .fontSize(size)
      .fillColor(color)
      .text(value, summaryX + 95, totalY, {
        width: summaryWidth - 109,
        align: "right"
      });

    totalY += bold ? 20 : 15;
  };

  const taxableVal = purchase.taxableAmount || (purchase.grossAmount ? purchase.grossAmount - purchase.discount : purchase.subtotal);
  summaryRow("Gross Amount", formatMoney(purchase.grossAmount || purchase.subtotal));
  if (Number(purchase.discount || 0) > 0) {
    summaryRow("Discount", formatMoney(purchase.discount));
  }
  summaryRow("Taxable Amount", formatMoney(taxableVal));
  if (Number(purchase.cgst || 0) > 0 || Number(purchase.sgst || 0) > 0) {
    summaryRow("CGST (1.5%)", formatMoney(purchase.cgst));
    summaryRow("SGST (1.5%)", formatMoney(purchase.sgst));
  } else if (Number(purchase.igst || 0) > 0) {
    summaryRow("IGST (3.0%)", formatMoney(purchase.igst));
  }
  if (Number(purchase.taxAmount || 0) > 0) {
    summaryRow("Total Tax", formatMoney(purchase.taxAmount));
  }
  if (Number(purchase.roundOff || 0) !== 0) {
    summaryRow("Round Off", formatMoney(purchase.roundOff));
  }

  drawLine(doc, summaryX + 14, totalY - 4, summaryX + summaryWidth - 14, totalY - 4, 0.7, COLORS.border);
  totalY += 4;

  const netPayableVal = purchase.netPayable || purchase.totalAmount;
  drawFilledBox(doc, summaryX + 8, totalY - 4, summaryWidth - 16, 22, COLORS.totalFill, 4);
  summaryRow("NET PAYABLE", formatMoney(netPayableVal), { bold: true, size: 9.2 });

  summaryRow("Paid Amount", formatMoney(purchase.paidAmount), { color: COLORS.paidGreen, bold: true });
  summaryRow("Due Amount", formatMoney(purchase.dueAmount), { bold: true, color: COLORS.dueRed });

  // =========================================================
  // PAYMENT DETAILS
  // =========================================================

  const paymentX = MARGIN;
  const paymentWidth = CONTENT_WIDTH - summaryWidth - 15;

  const paymentCardHeight = purchase.payments?.length ? Math.min(summaryHeight, 60 + purchase.payments.length * 22) : 100;
  drawAccentCard(doc, paymentX, summaryY, paymentWidth, paymentCardHeight, "Payment Details");

  let pY = summaryY + 34;
  if (purchase.payments && purchase.payments.length > 0) {
    purchase.payments.forEach((pmt, pIdx) => {
      const modeLabel = pmt.paymentChannel ? `${pmt.paymentMode} (${pmt.paymentChannel})` : pmt.paymentMode;
      const refStr = pmt.transactionId ? ` | Ref: ${pmt.transactionId}` : "";
      drawLabelValue(doc, `${modeLabel}`, `Rs. ${formatMoney(pmt.amount)}${refStr}`, paymentX + 14, pY, 90, paymentWidth - 108);
      pY += 18;
    });
  } else {
    drawLabelValue(doc, "Mode", purchase.paymentMode || "CASH", paymentX + 14, pY, 78, paymentWidth - 96);
    pY += 18;
    drawLabelValue(doc, "Paid Amount", `Rs. ${formatMoney(purchase.paidAmount)}`, paymentX + 14, pY, 78, paymentWidth - 96);
    pY += 18;
  }

  drawLabelValue(doc, "Place of Supply", purchase.placeOfSupply || "-", paymentX + 14, pY, 90, paymentWidth - 108);

  // =========================================================
  // NARRATION
  // =========================================================

  let bottomY = Math.max(summaryY + summaryHeight + 15, totalY + 20);

  if (purchase.narration) {
     const NARRATION_RESERVE = 70;

    if (bottomY + NARRATION_RESERVE > SAFE_BOTTOM) {
      doc.addPage();
      bottomY = MARGIN;
    }

    drawSectionTitle(doc, "Narration", MARGIN, bottomY, CONTENT_WIDTH);
    bottomY += 22;

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(COLORS.ink)
      .text(purchase.narration, MARGIN, bottomY, { width: CONTENT_WIDTH });

    bottomY += 30;
  }

   if (bottomY > SAFE_BOTTOM) {
    doc.addPage();
  }

  const signatureY = 728;

  drawLine(doc, MARGIN + 10, signatureY, MARGIN + 150, signatureY, 0.7, COLORS.muted);
  drawLine(doc, PAGE_WIDTH - MARGIN - 150, signatureY, PAGE_WIDTH - MARGIN - 10, signatureY, 0.7, COLORS.muted);

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.slate)
    .text("Prepared By", MARGIN + 10, signatureY + 6, { width: 140, align: "center" });

  doc
    .font("Helvetica")
    .fontSize(7.5)
    .fillColor(COLORS.slate)
    .text("Authorized Signature", PAGE_WIDTH - MARGIN - 150, signatureY + 6, { width: 140, align: "center" });

  drawLine(doc, MARGIN, 788, PAGE_WIDTH - MARGIN, 788, 0.6, COLORS.border);

  doc
    .font("Helvetica")
    .fontSize(7)
    .fillColor(COLORS.muted)
    .text("This is a computer generated purchase document.", MARGIN, 797, {
      width: CONTENT_WIDTH,
      align: "center"
    });

  // =========================================================
  // PAGE NUMBERS
  // =========================================================

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(COLORS.muted)
      .text(`Page ${i + 1} of ${range.count}`, PAGE_WIDTH - 100, 797, {
        width: 65,
        align: "right"
      });
  }

  doc.end();
};
