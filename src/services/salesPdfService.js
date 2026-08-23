import PDFDocument from "pdfkit";
import prisma from "../config/db.js";

const PAGE_WIDTH = 595.28;
const MARGIN = 34;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  ink: "#1c1917",
  slate: "#57534e",
  muted: "#8a8580",
  gold: "#9a6a1f",
  border: "#e2ddd6",
  headerFill: "#1c1917",
  headerText: "#f5f1ea",
  zebra: "#faf8f5",
  totalFill: "#f4ede1",
  paidGreen: "#3f6b4a",
  dueRed: "#a3372f",
};

const money = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const number = (value, digits = 3) => Number(value || 0).toFixed(digits);

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

const drawLine = (doc, x1, y1, x2, y2, width = 0.6, color = COLORS.border) => {
  doc.save().lineWidth(width).strokeColor(color).moveTo(x1, y1).lineTo(x2, y2).stroke().restore();
};

const drawBox = (doc, x, y, width, height, radius = 5, color = COLORS.border) => {
  doc.save().lineWidth(0.75).strokeColor(color).roundedRect(x, y, width, height, radius).stroke().restore();
};

const drawFilledBox = (doc, x, y, width, height, fill, radius = 5) => {
  doc.save().fillColor(fill).roundedRect(x, y, width, height, radius).fill().restore();
};

const drawAccentCard = (doc, x, y, width, height, title) => {
  drawFilledBox(doc, x, y, width, height, "#ffffff");
  drawBox(doc, x, y, width, height, 5, COLORS.border);
  drawFilledBox(doc, x, y, 3.5, height, COLORS.gold, 0);
  doc.font("Helvetica-Bold").fontSize(8.5).fillColor(COLORS.gold).text(title.toUpperCase(), x + 14, y + 11);
  drawLine(doc, x + 14, y + 24, x + width - 12, y + 24, 0.5, COLORS.border);
};

const drawLabelValue = (doc, label, value, x, y, labelWidth = 72, valueWidth = 160) => {
  doc.font("Helvetica-Bold").fontSize(7.8).fillColor(COLORS.slate).text(label, x, y, { width: labelWidth });
  doc.font("Helvetica").fontSize(8.6).fillColor(COLORS.ink).text(value || "-", x + labelWidth, y, { width: valueWidth });
};

export const generateSalePdf = async (id, storeId, res) => {
  const sale = await prisma.sale.findUnique({
    where: { id: Number(id) },
    include: {
      party: true,
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
      oldGolds: { include: { purchase: true } },
      advanceAdjustments: { include: { advanceReceive: true } },
    },
  });

  if (!sale) throw new Error("Sale not found");
  if (sale.storeId !== Number(storeId)) throw new Error("Unauthorized");

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN },
    bufferPages: true,
    autoFirstPage: true,
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="sale-${sale.invoiceNo}.pdf"`);
  doc.pipe(res);

  let y = MARGIN;
  drawFilledBox(doc, MARGIN, y, CONTENT_WIDTH, 3, COLORS.gold, 0);
  y += 16;
  doc.font("Helvetica-Bold").fontSize(20).fillColor(COLORS.ink).text(sale.store?.storeName || "JEWELLERY STORE", MARGIN, y, { width: CONTENT_WIDTH, align: "center" });
  y += 24;
  y += 4;
  const pillText = "SALES INVOICE";
  doc.font("Helvetica-Bold").fontSize(10.5);
  const pillWidth = doc.widthOfString(pillText) + 28;
  const pillX = (PAGE_WIDTH - pillWidth) / 2;
  drawFilledBox(doc, pillX, y, pillWidth, 20, COLORS.ink, 10);
  doc.fillColor(COLORS.headerText).text(pillText, pillX, y + 5.5, { width: pillWidth, align: "center" });
  y += 32;

  const boxGap = 12;
  const boxWidth = (CONTENT_WIDTH - boxGap) / 2;
  drawAccentCard(doc, MARGIN, y, boxWidth, 98, "Invoice Details");
  drawLabelValue(doc, "Invoice No", sale.invoiceNo, MARGIN + 14, y + 34, 68, boxWidth - 90);
  drawLabelValue(doc, "Invoice Date", formatDate(sale.saleDate), MARGIN + 14, y + 50, 68, boxWidth - 90);
  drawLabelValue(doc, "Status", sale.status, MARGIN + 14, y + 66, 68, boxWidth - 90);
  drawLabelValue(doc, "Store", sale.store?.storeName || "-", MARGIN + 14, y + 82, 68, boxWidth - 90);

  const customerX = MARGIN + boxWidth + boxGap;
  drawAccentCard(doc, customerX, y, boxWidth, 98, "Customer");
  drawLabelValue(doc, "Name", sale.party?.name || sale.customerName || "-", customerX + 14, y + 34, 55, boxWidth - 79);
  drawLabelValue(doc, "Phone", sale.party?.phone || sale.customerPhone || "-", customerX + 14, y + 50, 55, boxWidth - 79);
  drawLabelValue(doc, "GST", sale.customerGst || sale.party?.gst || "-", customerX + 14, y + 66, 55, boxWidth - 79);
  drawLabelValue(doc, "Address", sale.customerAddress || sale.party?.address || "-", customerX + 14, y + 82, 55, boxWidth - 79);

  y += 120;
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.gold).text("SALE ITEMS", MARGIN, y);
  drawLine(doc, MARGIN, y + 15, MARGIN + CONTENT_WIDTH, y + 15, 0.8, COLORS.border);
  y += 24;

  const columns = [
    { title: "SL", width: 24, align: "center" },
    { title: "ITEM", width: 88, align: "left" },
    { title: "METAL", width: 56, align: "left" },
    { title: "QTY", width: 30, align: "center" },
    { title: "GROSS", width: 52, align: "right" },
    { title: "NET", width: 52, align: "right" },
    { title: "RATE", width: 60, align: "right" },
    { title: "AMOUNT", width: 74, align: "right" },
  ];
  const tableWidth = columns.reduce((s, c) => s + c.width, 0);
  const headerH = 24;
  drawFilledBox(doc, MARGIN, y, tableWidth, headerH, COLORS.headerFill, 3);
  let x = MARGIN;
  columns.forEach((c) => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor(COLORS.headerText).text(c.title, x + 4, y + 8.5, { width: c.width - 8, align: c.align });
    x += c.width;
  });
  y += headerH;

  const rowH = 34;
  sale.items.forEach((item, index) => {
    if (index % 2 === 1) drawFilledBox(doc, MARGIN, y, tableWidth, rowH, COLORS.zebra, 0);
    const inv = item.inventory;
    const values = [
      index + 1,
      inv?.item?.name || inv?.product?.name || "-",
      inv?.metal?.name || "-",
      item.pieces || 1,
      number(item.grossWeight),
      number(item.netWeight),
      money(item.rate),
      money(item.totalAmount),
    ];
    let px = MARGIN;
    columns.forEach((c, i) => {
      doc.font(i === 7 ? "Helvetica-Bold" : "Helvetica").fontSize(7.6).fillColor(COLORS.ink).text(String(values[i]), px + 4, y + 7, { width: c.width - 8, align: c.align, ellipsis: true });
      px += c.width;
    });
    drawLine(doc, MARGIN, y + rowH, MARGIN + tableWidth, y + rowH, 0.4, COLORS.border);
    y += rowH;
  });
  drawBox(doc, MARGIN, y - headerH, tableWidth, headerH + sale.items.length * rowH, 3, COLORS.border);

  const summaryY = y + 20;
  const summaryWidth = 245;
  const summaryX = PAGE_WIDTH - MARGIN - summaryWidth;
  drawFilledBox(doc, summaryX, summaryY, summaryWidth, 220, "#ffffff", 5);
  drawBox(doc, summaryX, summaryY, summaryWidth, 220, 5, COLORS.border);
  doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.gold).text("AMOUNT SUMMARY", summaryX + 14, summaryY + 12);
  drawLine(doc, summaryX + 14, summaryY + 27, summaryX + summaryWidth - 14, summaryY + 27, 0.5, COLORS.border);
  let totalY = summaryY + 38;
  const row = (label, value, opts = {}) => {
    doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts.size || 8.5).fillColor(opts.bold ? COLORS.ink : COLORS.slate).text(label, summaryX + 14, totalY);
    doc.font(opts.bold ? "Helvetica-Bold" : "Helvetica").fontSize(opts.size || 8.5).fillColor(opts.color || COLORS.ink).text(value, summaryX + 95, totalY, { width: summaryWidth - 109, align: "right" });
    totalY += opts.bold ? 24 : 17.5;
  };
  row("Subtotal", money(sale.subtotal));
  row("Discount", money(sale.discount));
  row("IGST", money(sale.igst));
  row("CGST", money(sale.cgst));
  row("SGST", money(sale.sgst));
  row("Tax Amount", money(sale.taxAmount));
  row("Round Off", money(sale.roundOff));
  drawFilledBox(doc, summaryX + 8, totalY - 5, summaryWidth - 16, 24, COLORS.totalFill, 4);
  row("GRAND TOTAL", money(sale.grossTotal), { bold: true, size: 9.8 });
  row("Old Gold", money(sale.oldGoldAmount), { color: COLORS.paidGreen });
  row("Advance", money(sale.advanceAmount), { color: COLORS.paidGreen });
  row("Paid Amount", money(sale.paidAmount), { color: COLORS.paidGreen });
  row("Due Amount", money(sale.dueAmount), { bold: true, color: COLORS.dueRed });

  const paymentX = MARGIN;
  const paymentWidth = CONTENT_WIDTH - summaryWidth - 15;
  drawAccentCard(doc, paymentX, summaryY, paymentWidth, 96, "Payment Details");
  const paymentsText = sale.payments.length
    ? sale.payments.map((p) => `${p.paymentMode}: ${money(p.amount)}`).join(", ")
    : "-";
  drawLabelValue(doc, "Payments", paymentsText, paymentX + 14, summaryY + 38, 78, paymentWidth - 96);
  drawLabelValue(doc, "Old Gold Used", money(sale.oldGoldAmount), paymentX + 14, summaryY + 56, 78, paymentWidth - 96);
  drawLabelValue(doc, "Advance Used", money(sale.advanceAmount), paymentX + 14, summaryY + 74, 78, paymentWidth - 96);

  if (sale.oldGolds.length || sale.advanceAdjustments.length) {
    const detailY = summaryY + 116;
    doc.font("Helvetica-Bold").fontSize(9.5).fillColor(COLORS.gold).text("ADJUSTMENTS", MARGIN, detailY);
    drawLine(doc, MARGIN, detailY + 15, MARGIN + CONTENT_WIDTH, detailY + 15, 0.8, COLORS.border);
  }

  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i += 1) {
    doc.switchToPage(i);
    doc.font("Helvetica").fontSize(7).fillColor(COLORS.muted).text(`Page ${i + 1} of ${range.count}`, PAGE_WIDTH - 100, 797, { width: 65, align: "right" });
  }

  doc.end();
};
