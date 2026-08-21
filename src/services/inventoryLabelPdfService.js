import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import prisma from "../config/db.js";
import * as inventoryRepo from "../repositories/inventoryRepository.js";

const SINGLE_PAGE_WIDTH = 100;
const SINGLE_PAGE_HEIGHT = 70;

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

// A4 bulk layout
const LABEL_WIDTH = 100;
const LABEL_HEIGHT = 70;

const GAP_X = 8;
const GAP_Y = 2;

const COLS = 5;
const ROWS = 11;

const LABELS_PER_PAGE = COLS * ROWS;

const COLORS = {
  ink: "#111111",
  border: "#111111",
};

const formatText = (value, fallback = "-") =>
  value === null || value === undefined || value === ""
    ? fallback
    : String(value);

/* =========================================================
   BARCODE GENERATION
========================================================= */

const createBarcodeBuffer = async (value, options = {}) => {
  const text = String(value || "").trim();

  if (!text) return null;

  return bwipjs.toBuffer({
    bcid: "code128",
    text,

    scale: options.scale ?? 2,
    height: options.height ?? 14,

    includetext: false,

    paddingwidth: 0,
    paddingheight: 0,

    backgroundcolor: "FFFFFF",
    barcolor: "111111",
  });
};

/* =========================================================
   DRAW BARCODE
========================================================= */

const drawBarcode = async (
  doc,
  value,
  x,
  y,
  width,
  height
) => {
  const barcodeBuffer = await createBarcodeBuffer(value, {
    height: Math.max(8, Math.round(height * 0.8)),
  });

  if (!barcodeBuffer) return;

  doc.image(barcodeBuffer, x, y, {
    fit: [width, height],
    align: "center",
    valign: "center",
  });
};

/* =========================================================
   SINGLE LABEL
   SIZE = 100 × 70
========================================================= */

const renderSingleLabel = async (
  doc,
  inventory,
  boxX,
  boxY,
  boxWidth,
  boxHeight
) => {
  // Border
  doc
    .lineWidth(1)
    .rect(boxX, boxY, boxWidth, boxHeight)
    .stroke(COLORS.border);

  const barcode = formatText(
    inventory.barcodeNo || inventory.inventoryCode,
    ""
  );

  // Barcode
  const barcodeY = boxY + 13;
  const barcodeWidth = boxWidth - 12;
  const barcodeHeight = 22;

  await drawBarcode(
    doc,
    barcode,
    boxX + 6,
    barcodeY,
    barcodeWidth,
    barcodeHeight
  );

  // Barcode number
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text(
      barcode,
      boxX + 4,
      barcodeY + 24,
      {
        width: boxWidth - 8,
        align: "center",
        lineBreak: false,
      }
    );
};

/* =========================================================
   SINGLE INVENTORY LABEL PDF
   PAGE SIZE = 100 × 70
========================================================= */

export const generateInventoryLabelPdf = async (
  id,
  storeId,
  res
) => {
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
    size: [
      SINGLE_PAGE_WIDTH,
      SINGLE_PAGE_HEIGHT,
    ],

    margins: {
      top: 2,
      bottom: 2,
      left: 4,
      right: 4,
    },
  });

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="inventory-label-${
      inventory.tagNo ||
      inventory.inventoryCode ||
      inventory.id
    }.pdf"`
  );

  doc.pipe(res);

  const labelWidth =
    SINGLE_PAGE_WIDTH - 8;

  const labelHeight =
    SINGLE_PAGE_HEIGHT - 8;

  await renderSingleLabel(
    doc,
    inventory,
    4,
    4,
    labelWidth,
    labelHeight
  );

  doc.end();
};

/* =========================================================
   NORMALIZE BULK REQUEST
========================================================= */

const normalizeLabelRequest = (payload = {}) => {
  const ids = [];
  const barcodeNos = [];

  // Inventory IDs
  for (const value of [
    payload.ids,
    payload.inventoryIds,
    payload.idList,
    payload.selectedIds,
  ]) {
    if (Array.isArray(value)) {
      ids.push(...value);
    }
  }

  // Barcode numbers
  for (const value of [
    payload.barcodeNos,
    payload.barcodes,
    payload.selectedBarcodes,
  ]) {
    if (Array.isArray(value)) {
      barcodeNos.push(...value);
    }
  }

  // Single ID
  if (
    payload.id !== undefined &&
    payload.id !== null
  ) {
    ids.push(payload.id);
  }

  // Single barcode
  if (
    payload.barcodeNo !== undefined &&
    payload.barcodeNo !== null
  ) {
    barcodeNos.push(payload.barcodeNo);
  }

  return {
    ids: [
      ...new Set(
        ids
          .map((value) => String(value).trim())
          .filter(Boolean)
      ),
    ],

    barcodeNos: [
      ...new Set(
        barcodeNos
          .map((value) => String(value).trim())
          .filter(Boolean)
      ),
    ],
  };
};

/* =========================================================
   BULK LABEL
   SAME SIZE = 100 × 70
========================================================= */

const renderBulkLabel = async (
  doc,
  inventory,
  cellX,
  cellY,
  cellWidth,
  cellHeight
) => {
  // Border
  doc
    .lineWidth(0.8)
    .rect(
      cellX,
      cellY,
      cellWidth,
      cellHeight
    )
    .stroke(COLORS.border);

  const barcode = formatText(
    inventory.barcodeNo ||
      inventory.inventoryCode,
    ""
  );

  // Same barcode dimensions as single label
  const barcodeWidth =
    cellWidth - 12;

  const barcodeHeight = 22;

  // Barcode
  await drawBarcode(
    doc,
    barcode,
    cellX + 6,
    cellY + 13,
    barcodeWidth,
    barcodeHeight
  );

  // Barcode number
  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text(
      barcode,
      cellX + 4,
      cellY + 38,
      {
        width: cellWidth - 8,
        align: "center",
        lineBreak: false,
      }
    );
};

/* =========================================================
   BULK INVENTORY LABEL PDF
   A4
   5 × 11 = 55 LABELS PER PAGE
========================================================= */

export const generateBulkInventoryLabelsPdf = async (
  payload,
  storeId,
  res
) => {
  const {
    ids,
    barcodeNos,
  } = normalizeLabelRequest(payload);

  // Validation
  if (
    ids.length === 0 &&
    barcodeNos.length === 0
  ) {
    throw new Error(
      "At least one inventory id or barcodeNo is required"
    );
  }

  // Get inventories
  const inventories =
    await inventoryRepo.getInventoriesForLabelsRepo(
      storeId,
      {
        ids,
        barcodeNos,
      }
    );

  if (inventories.length === 0) {
    throw new Error(
      "No inventories found for the provided ids or barcode numbers"
    );
  }

  /* =====================================================
     A4 DOCUMENT
  ===================================================== */

  const doc = new PDFDocument({
    size: "A4",

    margins: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  });

  const filename =
    `inventory-labels-${Date.now()}.pdf`;

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${filename}"`
  );

  doc.pipe(res);

  /* =====================================================
     CALCULATE A4 CENTER POSITION
  ===================================================== */

 const totalWidth =
  COLS * LABEL_WIDTH +
  (COLS - 1) * GAP_X;

const totalHeight =
  ROWS * LABEL_HEIGHT +
  (ROWS - 1) * GAP_Y;

const startX =
  (A4_WIDTH - totalWidth) / 2;

const startY =
  (A4_HEIGHT - totalHeight) / 2;

  /* =====================================================
     RENDER LABELS
  ===================================================== */

  for (
    let index = 0;
    index < inventories.length;
    index += 1
  ) {
    const inventory =
      inventories[index];

    /*
      Example:

      0  1  2  3  4
      5  6  7  8  9
      10 11 12 13 14
      ...
      50 51 52 53 54
    */

    const position =
      index % LABELS_PER_PAGE;

    // New A4 page after 55 labels
    if (
      index > 0 &&
      position === 0
    ) {
      doc.addPage({
        size: "A4",
        margins: {
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
        },
      });
    }

    // Row
    const row =
      Math.floor(position / COLS);

    // Column
    const col =
      position % COLS;

    // X position
    const cellX =
      startX +
      col * (LABEL_WIDTH + GAP_X);

    // Y position
    const cellY =
      startY +
      row * (LABEL_HEIGHT + GAP_Y);

    // Render 100 × 70 label
    await renderBulkLabel(
      doc,
      inventory,
      cellX,
      cellY,
      LABEL_WIDTH,
      LABEL_HEIGHT
    );
  }

  doc.end();
};