import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import prisma from "../config/db.js";

const PAGE_WIDTH = 100;
const PAGE_HEIGHT = 70;

const COLORS = {
  ink: "#111111",
  slate: "#444444",
  border: "#111111",
};

const formatText = (value, fallback = "-") =>
  value === null || value === undefined || value === ""
    ? fallback
    : String(value);

const drawBarcode = async (doc, value, x, y, width, height) => {
  const text = String(value || "").trim();

  if (!text) return;

  const barcodeBuffer = await bwipjs.toBuffer({
    bcid: "code128",
    text,
    scale: 2,
    height: Math.max(8, Math.round(height * 0.8)),
    includetext: false,
    paddingwidth: 0,
    paddingheight: 0,
    backgroundcolor: "FFFFFF",
    barcolor: "111111",
  });

  doc.image(barcodeBuffer, x, y, {
    fit: [width, height],
    align: "center",
    valign: "center",
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

 await drawBarcode(
  doc,
  barcode,
  6,
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
