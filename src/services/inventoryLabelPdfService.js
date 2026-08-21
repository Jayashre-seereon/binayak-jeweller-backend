import PDFDocument from "pdfkit";
import bwipjs from "bwip-js";
import prisma from "../config/db.js";
import * as inventoryRepo from "../repositories/inventoryRepository.js";

/* =========================================================
   LABEL SIZE
========================================================= */

const SINGLE_PAGE_WIDTH = 100;
const SINGLE_PAGE_HEIGHT = 70;

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

/* =========================================================
   BULK A4 LAYOUT
   EACH LABEL = 100 × 70
========================================================= */

const LABEL_WIDTH = 100;
const LABEL_HEIGHT = 70;

// Reduced gap between labels
const GAP_X = 4;
const GAP_Y = 1;

const COLS = 5;
const ROWS = 11;

const LABELS_PER_PAGE = COLS * ROWS;

const COLORS = {
  ink: "#111111",
};

/* =========================================================
   FORMAT TEXT
========================================================= */

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
   NO BORDER
========================================================= */

const renderSingleLabel = async (
  doc,
  inventory,
  boxX,
  boxY,
  boxWidth,
  boxHeight
) => {
  const barcode = formatText(
    inventory.barcodeNo || inventory.inventoryCode,
    ""
  );

  if (!barcode) return;

  /*
    Reduced empty space on all 4 sides.

    Left  = 2
    Right = 2
    Top   = 5
    Bottom has remaining space
  */

  const barcodeX = boxX + 2;
  const barcodeY = boxY + 5;

  const barcodeWidth = boxWidth - 4;
  const barcodeHeight = 32;

  /* =====================================================
     BARCODE
  ===================================================== */

  await drawBarcode(
    doc,
    barcode,
    barcodeX,
    barcodeY,
    barcodeWidth,
    barcodeHeight
  );

  /* =====================================================
     BARCODE NUMBER
  ===================================================== */

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text(
      barcode,
      boxX + 2,
      barcodeY + 34,
      {
        width: boxWidth - 4,
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

  /* =====================================================
     CREATE SINGLE LABEL PDF
  ===================================================== */

  const doc = new PDFDocument({
    size: [
      SINGLE_PAGE_WIDTH,
      SINGLE_PAGE_HEIGHT,
    ],

    margins: {
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    },
  });

  /* =====================================================
     RESPONSE HEADERS
  ===================================================== */

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

  /* =====================================================
     LABEL AREA

     FULL PAGE = 100 × 70
  ===================================================== */

  await renderSingleLabel(
    doc,
    inventory,
    0,
    0,
    SINGLE_PAGE_WIDTH,
    SINGLE_PAGE_HEIGHT
  );

  doc.end();
};

/* =========================================================
   NORMALIZE BULK REQUEST
========================================================= */

const normalizeLabelRequest = (payload = {}) => {
  const ids = [];
  const barcodeNos = [];

  /* =====================================================
     INVENTORY IDS
  ===================================================== */

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

  /* =====================================================
     BARCODE NUMBERS
  ===================================================== */

  for (const value of [
    payload.barcodeNos,
    payload.barcodes,
    payload.selectedBarcodes,
  ]) {
    if (Array.isArray(value)) {
      barcodeNos.push(...value);
    }
  }

  /* =====================================================
     SINGLE ID
  ===================================================== */

  if (
    payload.id !== undefined &&
    payload.id !== null
  ) {
    ids.push(payload.id);
  }

  /* =====================================================
     SINGLE BARCODE
  ===================================================== */

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
   NO BORDER
========================================================= */

const renderBulkLabel = async (
  doc,
  inventory,
  cellX,
  cellY,
  cellWidth,
  cellHeight
) => {
  const barcode = formatText(
    inventory.barcodeNo ||
      inventory.inventoryCode,
    ""
  );

  if (!barcode) return;

  /*
    Reduced empty space:

    Left  = 2
    Right = 2
    Top   = 5
  */

  const barcodeX = cellX + 2;
  const barcodeY = cellY + 5;

  const barcodeWidth = cellWidth - 4;
  const barcodeHeight = 32;

  /* =====================================================
     BARCODE
  ===================================================== */

  await drawBarcode(
    doc,
    barcode,
    barcodeX,
    barcodeY,
    barcodeWidth,
    barcodeHeight
  );

  /* =====================================================
     BARCODE NUMBER
  ===================================================== */

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor(COLORS.ink)
    .text(
      barcode,
      cellX + 2,
      barcodeY + 34,
      {
        width: cellWidth - 4,
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
  /* =====================================================
     NORMALIZE REQUEST
  ===================================================== */

  const {
    ids,
    barcodeNos,
  } = normalizeLabelRequest(payload);

  /* =====================================================
     VALIDATION
  ===================================================== */

  if (
    ids.length === 0 &&
    barcodeNos.length === 0
  ) {
    throw new Error(
      "At least one inventory id or barcodeNo is required"
    );
  }

  /* =====================================================
     GET INVENTORIES
  ===================================================== */

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
     CREATE A4 DOCUMENT
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

  /* =====================================================
     FILE NAME
  ===================================================== */

  const filename =
    `inventory-labels-${Date.now()}.pdf`;

  /* =====================================================
     RESPONSE HEADERS
  ===================================================== */

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
     TOTAL GRID SIZE
  ===================================================== */

  const totalWidth =
    COLS * LABEL_WIDTH +
    (COLS - 1) * GAP_X;

  const totalHeight =
    ROWS * LABEL_HEIGHT +
    (ROWS - 1) * GAP_Y;

  /* =====================================================
     CENTER GRID ON A4
  ===================================================== */

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

    /* ===================================================
       POSITION INSIDE CURRENT PAGE
    =================================================== */

    const position =
      index % LABELS_PER_PAGE;

    /* ===================================================
       NEW A4 PAGE AFTER 55 LABELS
    =================================================== */

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

    /* ===================================================
       ROW
    =================================================== */

    const row =
      Math.floor(position / COLS);

    /* ===================================================
       COLUMN
    =================================================== */

    const col =
      position % COLS;

    /* ===================================================
       X POSITION
    =================================================== */

    const cellX =
      startX +
      col * (
        LABEL_WIDTH + GAP_X
      );

    /* ===================================================
       Y POSITION
    =================================================== */

    const cellY =
      startY +
      row * (
        LABEL_HEIGHT + GAP_Y
      );

    /* ===================================================
       RENDER 100 × 70 LABEL
    =================================================== */

    await renderBulkLabel(
      doc,
      inventory,
      cellX,
      cellY,
      LABEL_WIDTH,
      LABEL_HEIGHT
    );
  }

  /* =====================================================
     FINISH PDF
  ===================================================== */

  doc.end();
};