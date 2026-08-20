import PDFDocument from "pdfkit";
import prisma from "../config/db.js";

const PAGE_WIDTH = 280;
const PAGE_HEIGHT = 170;

const COLORS = {
  ink: "#111111",
  slate: "#444444",
  border: "#111111",
};

const formatWeight = (value) => `${Number(value || 0).toFixed(3)} g`;
const formatText = (value, fallback = "-") =>
  value === null || value === undefined || value === "" ? fallback : String(value);
const formatName = (entity, fallbackValue = "-") =>
  formatText(entity?.name || entity?.title || entity?.metalName || entity?.purityName || fallbackValue);

const drawBarcode = (doc, value, x, y, width, height) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return;

  const bars = [];
  let seed = 7;
  for (const ch of digits) {
    seed = (seed * 31 + Number(ch)) % 9973;
    bars.push(...[1, 2, 1, 1, 2, 1, 2].map((n, i) => ((seed >> i) & 1 ? n + 1 : n)));
  }

  const totalUnits = bars.reduce((sum, n) => sum + n, 0);
  const unit = width / totalUnits;
  let currentX = x;
  let black = true;

  bars.forEach((barUnits) => {
    const barWidth = barUnits * unit;
    if (black) {
      doc.rect(currentX, y, barWidth, height).fill(COLORS.ink);
    }
    currentX += barWidth;
    black = !black;
  });
};

export const generateInventoryLabelPdf = async (id, storeId, res) => {
  const inventory = await prisma.inventory.findFirst({
    where: {
      id: Number(id),
      storeId: Number(storeId),
    },
    include: {
      store: true,
      product: true,
      item: true,
      metal: true,
      purityMaster: true,
      purchase: true,
      purchaseItem: true,
    },
  });

  if (!inventory) {
    throw new Error("Inventory not found");
  }

  const doc = new PDFDocument({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    margins: { top: 8, bottom: 8, left: 8, right: 8 },
  });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="inventory-label-${inventory.tagNo || inventory.inventoryCode || inventory.id}.pdf"`
  );

  doc.pipe(res);

  const labelWidth = PAGE_WIDTH - 16;
  const labelHeight = PAGE_HEIGHT - 16;

  doc
    .lineWidth(1)
    .rect(8, 8, labelWidth, labelHeight)
    .stroke(COLORS.border);

  let y = 16;

  doc
    .font("Helvetica-Bold")
    .fontSize(12)
    .fillColor(COLORS.ink)
    .text(inventory.store?.storeName || "BINAYAK JEWELLERS", 16, y, {
      width: labelWidth - 16,
      align: "center",
    });

  y += 22;

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.ink)
    .text(`TAG NO: ${formatText(inventory.tagNo)}`, 16, y, {
      width: labelWidth - 16,
      align: "left",
    });

  y += 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.ink)
    .text(`METAL: ${formatName(inventory.metal)}`, 16, y, {
      width: labelWidth - 16,
      align: "left",
    });

  y += 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.ink)
    .text(`PURITY: ${formatName(inventory.purityMaster, formatText(inventory.purity))}`, 16, y, {
      width: labelWidth - 16,
      align: "left",
    });

  y += 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.slate)
    .text(`WEIGHT: ${formatWeight(inventory.netWeight || inventory.grossWeight)}`, 16, y, {
      width: labelWidth - 16,
      align: "left",
    });

  y += 14;

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(COLORS.slate)
    .text(`HUID: ${formatText(inventory.huidNo)}`, 16, y, {
      width: labelWidth - 16,
      align: "left",
    });

  y += 18;

  drawBarcode(doc, formatText(inventory.barcodeNo || inventory.inventoryCode, ""), 18, y, labelWidth - 20, 20);

  y += 24;

  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(COLORS.ink)
    .text(formatText(inventory.barcodeNo || inventory.inventoryCode), 16, y, {
      width: labelWidth - 16,
      align: "center",
    });

  doc.end();
};
