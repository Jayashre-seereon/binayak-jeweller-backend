import { createPdfDoc, drawFooter, drawGoldHeader, PDF_PAGE, PDF_THEME } from "./pdfTemplate.js";

const money = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;
const dateText = (value) => value ? new Date(value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-";
const text = (value) => String(value ?? "-");

const drawReportPage = (doc, title, branchName) => drawGoldHeader(doc, {
  title,
  copyLabel: "REPORT COPY",
  branchName,
  tagline: "Paria Branch, Bhubaneswar",
});

const drawTableHeader = (doc, y, columns) => {
  let x = PDF_PAGE.margin + 18;
  doc.rect(x, y, columns.reduce((sum, c) => sum + c.width, 0), 22).fill(PDF_THEME.navy);
  columns.forEach((column) => {
    doc.font("Helvetica-Bold").fontSize(7).fillColor(PDF_THEME.white).text(column.label, x + 4, y + 7, { width: column.width - 8, align: column.align || "left" });
    x += column.width;
  });
};

const streamReport = (res, filename, title, rows, columns, summaryText, filter) => {
  const doc = createPdfDoc();
  const branch = filter?.fromDate || filter?.toDate ? `${filter.fromDate || "Start"} to ${filter.toDate || "End"}` : labelPeriod(filter?.period);
  let y = drawReportPage(doc, title, branch) + 10;
  const left = PDF_PAGE.margin + 18;
  const pageBottom = PDF_PAGE.height - 62;
  drawTableHeader(doc, y, columns);
  y += 22;
  rows.forEach((row, index) => {
    if (y > pageBottom) {
      drawFooter(doc, "Binayak Jewellers - Report", PDF_PAGE.height - 42);
      doc.addPage();
      y = drawReportPage(doc, title, branch) + 10;
      drawTableHeader(doc, y, columns);
      y += 22;
    }
    const height = 21;
    if (index % 2 === 1) doc.rect(left, y, columns.reduce((sum, c) => sum + c.width, 0), height).fill(PDF_THEME.soft);
    let x = left;
    columns.forEach((column) => {
      doc.font("Helvetica").fontSize(6.8).fillColor(PDF_THEME.ink).text(text(column.value(row)), x + 4, y + 7, { width: column.width - 8, align: column.align || "left", ellipsis: true });
      x += column.width;
    });
    doc.moveTo(left, y + height).lineTo(left + columns.reduce((sum, c) => sum + c.width, 0), y + height).lineWidth(0.35).strokeColor(PDF_THEME.border).stroke();
    y += height;
  });
  if (summaryText) {
    y += 12;
    doc.rect(left, y, PDF_PAGE.width - PDF_PAGE.margin * 2 - 36, 28).fill(PDF_THEME.navy);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(PDF_THEME.white).text(summaryText, left + 8, y + 10, { width: PDF_PAGE.width - PDF_PAGE.margin * 2 - 52 });
  }
  drawFooter(doc, "Thank you for visiting Binayak Jewellers, Paria - Terms & conditions overleaf", PDF_PAGE.height - 42);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename=\"${filename}.pdf\"`);
  doc.pipe(res);
  doc.end();
};

const labelPeriod = (period) => String(period || "REPORT").replace(/_/g, " ");

export const generateSalesReportPdf = async (reportData, res) => {
  const { filter, summary, sales = [] } = reportData;
  const rows = sales.map((s, i) => ({
    no: i + 1, date: dateText(s.saleDate || s.createdAt), invoice: s.invoiceNo || "-",
    customer: s.customerName || s.party?.name || s.customer?.name || "-", items: s.items?.length || 0,
    net: Number(s.netPayable || s.payableAmount || s.totalAmount || 0), paid: Number(s.paidAmount || 0), due: Number(s.dueAmount || 0),
  }));
  const columns = [
    { label: "Sl", width: 25, value: r => r.no, align: "center" }, { label: "Date", width: 66, value: r => r.date },
    { label: "Invoice", width: 76, value: r => r.invoice }, { label: "Customer / Party", width: 155, value: r => r.customer },
    { label: "Items", width: 38, value: r => r.items, align: "center" }, { label: "Net Payable", width: 72, value: r => money(r.net), align: "right" },
    { label: "Paid", width: 62, value: r => money(r.paid), align: "right" }, { label: "Due", width: 62, value: r => money(r.due), align: "right" },
  ];
  const summaryText = `TOTAL SALES: ${money(summary?.totalSales || summary?.netSales)}    PAID: ${money(summary?.totalPaid || summary?.paidAmount)}    DUE: ${money(summary?.totalDue || summary?.dueAmount)}`;
  streamReport(res, `Sales-Report-${filter?.period || "Report"}`, "SALES REPORT", rows, columns, summaryText, filter);
};

export const generatePurchaseReportPdf = async (reportData, res) => {
  const { filter, summary, purchases = [] } = reportData;
  const rows = purchases.map((p, i) => ({
    no: i + 1, date: dateText(p.date || p.purchaseDate || p.createdAt), invoice: p.invoiceNo || "-",
    party: p.party?.name || p.customerName || p.customer?.name || "-", items: p.items?.length || 0,
    net: Number(p.netPayable || p.totalAmount || p.grossAmount || 0), paid: Number(p.paidAmount || 0), due: Number(p.dueAmount || 0),
  }));
  const columns = [
    { label: "Sl", width: 25, value: r => r.no, align: "center" }, { label: "Date", width: 66, value: r => r.date },
    { label: "Invoice", width: 76, value: r => r.invoice }, { label: "Party / Supplier", width: 155, value: r => r.party },
    { label: "Items", width: 38, value: r => r.items, align: "center" }, { label: "Net Amount", width: 72, value: r => money(r.net), align: "right" },
    { label: "Paid", width: 62, value: r => money(r.paid), align: "right" }, { label: "Due", width: 62, value: r => money(r.due), align: "right" },
  ];
  const summaryText = `TOTAL PURCHASE: ${money(summary?.totalPurchase || summary?.netPurchase)}    PAID: ${money(summary?.paidAmount)}    DUE: ${money(summary?.balanceAmount || summary?.dueAmount)}`;
  streamReport(res, `Purchase-Report-${filter?.period || "Report"}`, "PURCHASE REPORT", rows, columns, summaryText, filter);
};
