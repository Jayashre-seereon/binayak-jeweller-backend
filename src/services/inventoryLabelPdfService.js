import PDFDocument from "pdfkit";
import prisma from "../config/db.js";

const PAGE_WIDTH = 220;
const PAGE_HEIGHT = 65;

const COLORS = {
  ink: "#111111",
  slate: "#444444",
  border: "#111111",
};

const formatText = (value, fallback = "-") =>
  value === null || value === undefined || value === ""
    ? fallback
    : String(value);

const drawBarcode = (doc, value, x, y, width, height) => {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return;

  const bars = [];

  let seed = 7;

  for (const ch of digits) {
    seed = (seed * 31 + Number(ch)) % 9973;

    bars.push(
      ...[1, 2, 1, 1, 2, 1, 2].map((n, i) =>
        (seed >> i) & 1 ? n + 1 : n
      )
    );
  }

  const totalUnits = bars.reduce((sum, n) => sum + n, 0);

  const unit = width / totalUnits;

  let currentX = x;
  let black = true;

  bars.forEach((barUnits) => {
    const barWidth = barUnits * unit;

    if (black) {
      doc
        .rect(currentX, y, barWidth, height)
        .fill(COLORS.ink);
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

    margins: {
      top: 2,
      bottom: 2,
      left: 4,
      right: 4,
    },
  });

  res.setHeader("Content-Type", "application/pdf");

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="inventory-label-${
      inventory.tagNo ||
      inventory.inventoryCode ||
      inventory.id
    }.pdf"`
  );

  doc.pipe(res);

  // Label dimensions
  const labelWidth = PAGE_WIDTH - 8;
  const labelHeight = PAGE_HEIGHT - 8;

  // Border
  doc
    .lineWidth(1)
    .rect(
      4,
      4,
      labelWidth,
      labelHeight
    )
    .stroke(COLORS.border);

  // Barcode
  const barcode = formatText(
    inventory.barcodeNo || inventory.inventoryCode,
    ""
  );

  // Move barcode closer to top
  const barcodeY = 17;

  drawBarcode(
    doc,
    barcode,
    10,
    barcodeY,
    labelWidth - 12,
    22
  );

  // Barcode number
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text(
      barcode,
      8,
      barcodeY + 27,
      {
        width: labelWidth - 8,
        align: "center",
        lineBreak: false,
      }
    );

  doc.end();
};