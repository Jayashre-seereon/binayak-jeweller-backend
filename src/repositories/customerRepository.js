import prisma from "../config/db.js";

export const findCustomerByPhoneRepo = async (phone, storeId, tx = prisma) => {
  if (!phone) return null;
  const cleanPhone = String(phone).trim().replace(/\D/g, "");
  if (!cleanPhone) return null;

  return await tx.customer.findFirst({
    where: {
      phone: cleanPhone,
    },
    include: {
      store: true,
    },
  });
};

export const findCustomerByIdRepo = async (id, storeId, tx = prisma) => {
  return await tx.customer.findUnique({
    where: { id: Number(id) },
    include: {
      store: true,
    },
  });
};

export const createCustomerRepo = async (data, tx = prisma) => {
  const cleanPhone = String(data.phone).trim().replace(/\D/g, "");
  return await tx.customer.create({
    data: {
      name: data.name?.trim() || "Valued Customer",
      phone: cleanPhone,
      address: data.address?.trim() || null,
      city: data.city?.trim() || null,
      state: data.state?.trim() || "ODISHA",
      pan: data.pan?.trim()?.toUpperCase() || null,
      gst: data.gst?.trim()?.toUpperCase() || null,
      idType: data.idType || null,
      idNumber: data.idNumber || null,
      customerCode: data.customerCode || null,
      storeId: Number(data.storeId),
    },
  });
};

export const updateCustomerRepo = async (id, data, tx = prisma) => {
  const updatePayload = {};
  if (data.name) updatePayload.name = data.name.trim();
  if (data.address !== undefined) updatePayload.address = data.address?.trim() || null;
  if (data.city !== undefined) updatePayload.city = data.city?.trim() || null;
  if (data.state !== undefined) updatePayload.state = data.state?.trim() || "ODISHA";
  if (data.pan !== undefined) updatePayload.pan = data.pan?.trim()?.toUpperCase() || null;
  if (data.gst !== undefined) updatePayload.gst = data.gst?.trim()?.toUpperCase() || null;
  if (data.idType !== undefined) updatePayload.idType = data.idType || null;
  if (data.idNumber !== undefined) updatePayload.idNumber = data.idNumber || null;

  return await tx.customer.update({
    where: { id: Number(id) },
    data: updatePayload,
  });
};

export const getCustomerAdjustmentLogsRepo = async (customerId, storeId, tx = prisma) => {
  return await tx.customerAdjustmentLog.findMany({
    where: {
      customerId: Number(customerId),
    },
    orderBy: {
      adjustmentDate: "desc",
    },
    include: {
      sale: {
        select: {
          id: true,
          invoiceNo: true,
          saleDate: true,
          netPayable: true,
          paidAmount: true,
        },
      },
    },
  });
};

export const createCustomerAdjustmentLogRepo = async (data, tx = prisma) => {
  return await tx.customerAdjustmentLog.create({
    data: {
      customerId: Number(data.customerId),
      saleId: Number(data.saleId),
      storeId: Number(data.storeId),
      adjustmentType: data.adjustmentType, // "ADVANCE" | "OLD_JEWELLERY"
      referenceId: Number(data.referenceId),
      referenceDocNo: data.referenceDocNo || null,
      saleInvoiceNo: data.saleInvoiceNo,
      totalOriginal: Number(data.totalOriginal || 0),
      previousBalance: Number(data.previousBalance || 0),
      adjustedAmount: Number(data.adjustedAmount || 0),
      remainingBalance: Number(data.remainingBalance || 0),
      cashierName: data.cashierName || null,
      adjustmentDate: data.adjustmentDate ? new Date(data.adjustmentDate) : new Date(),
      notes: data.notes || null,
    },
  });
};
