import { createPdfDoc, drawFooter, drawGoldHeader, PDF_PAGE, PDF_THEME } from "./pdfTemplate.js";

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const dateText = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const label = (value) => String(value || "-").replace(/_/g, " ");

const line = (doc, y) => {
  doc.moveTo(PDF_PAGE.margin, y).lineTo(PDF_PAGE.width - PDF_PAGE.margin, y)
    .lineWidth(0.5).strokeColor(PDF_THEME.border).stroke();
};

export const generateVoucherPdf = async (voucher, res) => {
  const doc = createPdfDoc();
  const store = voucher.store || {};
  const title = `${label(voucher.voucherType)} VOUCHER`;
  const contentTop = drawGoldHeader(doc, {
    title,
    copyLabel: "ACCOUNTING COPY",
    storeName: store.storeName,
    branchName: store.location || store.address,
    tagline: store.tagline || "Paria Branch, Bhubaneswar",
  });
  const left = PDF_PAGE.margin + 18;
  const right = PDF_PAGE.width - PDF_PAGE.margin - 18;
  let y = contentTop + 10;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_THEME.navy).text("Voucher Details", left, y);
  y += 18;
  const details = [
    ["Voucher No", voucher.voucherNo], ["Date", dateText(voucher.date)],
    ["Party", voucher.partyName], ["Party Phone", voucher.partyPhone],
    ["Reference", voucher.referenceDocNo || label(voucher.referenceType)],
    ["Payment Mode", label(voucher.paymentMode)], ["Amount", money(voucher.amount)],
    ["Status", label(voucher.status)],
  ];
  details.forEach(([key, value], index) => {
    const x = index % 2 === 0 ? left : left + 270;
    const rowY = y + Math.floor(index / 2) * 22;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_THEME.muted).text(`${key}:`, x, rowY, { width: 78 });
    doc.font("Helvetica").fontSize(8.5).fillColor(PDF_THEME.ink).text(String(value || "-"), x + 78, rowY, { width: 180 });
  });
  y += Math.ceil(details.length / 2) * 22 + 10;
  line(doc, y);
  y += 15;

  doc.font("Helvetica-Bold").fontSize(9).fillColor(PDF_THEME.navy).text("Journal Entries", left, y);
  y += 16;
  doc.rect(left, y, right - left, 20).fill(PDF_THEME.navy);
  doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_THEME.white)
    .text("Account", left + 8, y + 6, { width: 245 })
    .text("Debit", left + 275, y + 6, { width: 75, align: "right" })
    .text("Credit", left + 360, y + 6, { width: 75, align: "right" });
  y += 20;
  let debit = 0;
  let credit = 0;
  (voucher.entries || []).forEach((entry, index) => {
    const rowH = 25;
    if (index % 2 === 1) doc.rect(left, y, right - left, rowH).fill(PDF_THEME.soft);
    debit += Number(entry.debit || 0);
    credit += Number(entry.credit || 0);
    doc.font("Helvetica").fontSize(8).fillColor(PDF_THEME.ink)
      .text(entry.accountName || "-", left + 8, y + 6, { width: 245 })
      .text(money(entry.debit), left + 275, y + 6, { width: 75, align: "right" })
      .text(money(entry.credit), left + 360, y + 6, { width: 75, align: "right" });
    line(doc, y + rowH);
    y += rowH;
  });
  doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_THEME.navy)
    .text("TOTAL", left + 8, y + 7, { width: 245 })
    .text(money(debit), left + 275, y + 7, { width: 75, align: "right" })
    .text(money(credit), left + 360, y + 7, { width: 75, align: "right" });
  y += 30;

  if (voucher.narration) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_THEME.muted).text("Narration", left, y);
    doc.font("Helvetica").fontSize(8.5).fillColor(PDF_THEME.ink).text(voucher.narration, left, y + 12, { width: right - left });
  }
  drawFooter(doc, "Thank you for visiting Binayak Jewellers, Paria - Terms & conditions overleaf", PDF_PAGE.height - 42);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=\"${title.replace(/ /g, "-")}-${voucher.voucherNo}.pdf\"`);
  doc.pipe(res);
  doc.end();
};
