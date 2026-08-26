import * as advanceReceiveRepo from "../repositories/advanceReceiveRepository.js";
import { getOrCreateCustomerService } from "./customerService.js";

const validateStoreId = (storeId) => {
  const id = Number(storeId);

  if (!id || id <= 0) {
    throw new Error("Valid storeId is required");
  }

  return id;
};

const parseReceiveDate = (value) => {
  if (!value) return new Date();
  const raw = String(value).slice(0, 10);
  const [year, month, day] = raw.split("-").map(Number);
  if (!year || !month || !day) {
    const fallback = new Date(value);
    return Number.isNaN(fallback.getTime()) ? new Date() : fallback;
  }
  return new Date(year, month - 1, day, 12, 0, 0);
};

export const createAdvanceReceiveService = async (
  data,
  storeId
) => {
  const parsedStoreId = validateStoreId(storeId);

  if (!data.customerName?.trim()) {
    throw new Error("Customer name is required");
  }

  if (
    data.amount === undefined ||
    data.amount === null ||
    data.amount === ""
  ) {
    throw new Error("Amount is required");
  }

  const amount = Number(data.amount);

  if (isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be greater than 0");
  }

  if (!data.paymentMode) {
    throw new Error("Payment mode is required");
  }

  if (!["CASH", "ONLINE"].includes(data.paymentMode)) {
    throw new Error(
      "Payment mode must be CASH or ONLINE"
    );
  }

  let customerId = null;
  if (data.contactNumber?.trim()) {
    const customer = await getOrCreateCustomerService(
      {
        customerName: data.customerName.trim(),
        customerPhone: data.contactNumber.trim(),
        customerAddress: data.address?.trim() || null,
      },
      parsedStoreId
    );
    customerId = customer?.id || null;
  }

  const advance =
    await advanceReceiveRepo.createAdvanceReceiveRepo({
      customerId,
      customerName: data.customerName.trim(),
      contactNumber:
        data.contactNumber?.trim() || null,
      address: data.address?.trim() || null,
      amount,
      adjustedAmount: 0,
      balanceAmount: amount,
      status: "AVAILABLE",
      receiveDate: parseReceiveDate(data.date || data.receiveDate),
      paymentMode: data.paymentMode,
      specification:
        data.specification?.trim() || null,
      storeId: parsedStoreId,
    });

  return serializeAdvance(advance);
};

const resolveAdvanceStatus = (row) => {
  const amount = Number(row.amount || 0);
  const adjusted = Number(row.adjustedAmount || 0);
  const balance = Number(
    row.balanceAmount ?? Math.max(0, amount - adjusted)
  );
  if (balance <= 0.01 || adjusted >= amount - 0.01) return "FULLY_ADJUSTED";
  if (adjusted > 0) return "PARTIALLY_ADJUSTED";
  return "AVAILABLE";
};

const serializeAdvance = (row) => {
  const amount = Number(row.amount || 0);
  const adjustedAmount = Number(row.adjustedAmount || 0);
  const balanceAmount = Math.max(0, amount - adjustedAmount);
  const status = resolveAdvanceStatus({ ...row, amount, adjustedAmount, balanceAmount });
  return {
    ...row,
    amount,
    adjustedAmount,
    balanceAmount,
    status,
    date: row.receiveDate || row.createdAt,
  };
};

export const getAdvanceReceivesService = async (
  storeId
) => {
  const parsedStoreId = validateStoreId(storeId);

  const rows = await advanceReceiveRepo.getAdvanceReceivesRepo(
    parsedStoreId
  );

  return rows.map(serializeAdvance);
};

export const getAdvanceReceivesByContactService = async (
  storeId,
  contactNumber
) => {
  const parsedStoreId = validateStoreId(storeId);
  const phone = String(contactNumber || "").trim();

  if (!phone) {
    throw new Error("Contact number is required");
  }

  return (
    await advanceReceiveRepo.getAdvanceReceivesByContactRepo(
      parsedStoreId,
      phone
    )
  ).map(serializeAdvance);
};

export const getAdvanceReceiveByIdService = async (
  id,
  storeId
) => {
  const parsedStoreId = validateStoreId(storeId);
  const parsedId = Number(id);

  if (!parsedId) {
    throw new Error("Valid advance receive ID is required");
  }

  const advance =
    await advanceReceiveRepo.getAdvanceReceiveByIdRepo(
      parsedId,
      parsedStoreId
    );

  if (!advance) {
    throw new Error("Advance receive not found");
  }

  return serializeAdvance(advance);
};

export const updateAdvanceReceiveService = async (
  id,
  data,
  storeId
) => {
  const parsedStoreId = validateStoreId(storeId);
  const parsedId = Number(id);

  if (!parsedId) {
    throw new Error("Valid advance receive ID is required");
  }

  const existing =
    await advanceReceiveRepo.getAdvanceReceiveByIdRepo(
      parsedId,
      parsedStoreId
    );

  if (!existing) {
    throw new Error("Advance receive not found");
  }

  if (resolveAdvanceStatus(existing) === "FULLY_ADJUSTED") {
    throw new Error(
      "This advance receive is fully adjusted and cannot be edited."
    );
  }

  const updateData = {};

  if (data.customerName !== undefined) {
    if (!data.customerName.trim()) {
      throw new Error("Customer name is required");
    }

    updateData.customerName =
      data.customerName.trim();
  }

  if (data.contactNumber !== undefined) {
    updateData.contactNumber =
      data.contactNumber?.trim() || null;
  }

  if (data.address !== undefined) {
    updateData.address =
      data.address?.trim() || null;
  }

  if (data.amount !== undefined) {
    const amount = Number(data.amount);

    if (isNaN(amount) || amount <= 0) {
      throw new Error(
        "Amount must be greater than 0"
      );
    }

    const alreadyAdjusted = Number(existing.adjustedAmount || 0);
    if (amount + 0.01 < alreadyAdjusted) {
      throw new Error(
        "Amount cannot be less than already adjusted amount"
      );
    }

    updateData.amount = amount;
    updateData.balanceAmount = Math.max(0, amount - alreadyAdjusted);
    updateData.status =
      updateData.balanceAmount <= 0.01
        ? "FULLY_ADJUSTED"
        : alreadyAdjusted > 0
          ? "PARTIALLY_ADJUSTED"
          : "AVAILABLE";
  }

  if (data.date !== undefined || data.receiveDate !== undefined) {
    updateData.receiveDate = parseReceiveDate(
      data.date || data.receiveDate
    );
  }

  if (data.paymentMode !== undefined) {
    if (!["CASH", "ONLINE"].includes(data.paymentMode)) {
      throw new Error(
        "Payment mode must be CASH or ONLINE"
      );
    }

    updateData.paymentMode = data.paymentMode;
  }

  if (data.specification !== undefined) {
    updateData.specification =
      data.specification?.trim() || null;
  }

  await advanceReceiveRepo.updateAdvanceReceiveRepo(
    parsedId,
    parsedStoreId,
    updateData
  );

  const updated = await advanceReceiveRepo.getAdvanceReceiveByIdRepo(
    parsedId,
    parsedStoreId
  );

  return serializeAdvance(updated);
};

export const deleteAdvanceReceiveService = async (
  id,
  storeId
) => {
  const parsedStoreId = validateStoreId(storeId);
  const parsedId = Number(id);

  if (!parsedId) {
    throw new Error("Valid advance receive ID is required");
  }

  const existing =
    await advanceReceiveRepo.getAdvanceReceiveByIdRepo(
      parsedId,
      parsedStoreId
    );

  if (!existing) {
    throw new Error("Advance receive not found");
  }

  if (resolveAdvanceStatus(existing) === "FULLY_ADJUSTED") {
    throw new Error(
      "This advance receive is fully adjusted and cannot be deleted."
    );
  }

  await advanceReceiveRepo.deleteAdvanceReceiveRepo(
    parsedId,
    parsedStoreId
  );

  return {
    message: "Advance receive deleted successfully",
  };
};
