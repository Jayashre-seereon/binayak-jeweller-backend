import * as advanceReceiveRepo from "../repositories/advanceReceiveRepository.js";
import { getOrCreateCustomerService } from "./customerService.js";

const validateStoreId = (storeId) => {
  const id = Number(storeId);

  if (!id || id <= 0) {
    throw new Error("Valid storeId is required");
  }

  return id;
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
      paymentMode: data.paymentMode,
      specification:
        data.specification?.trim() || null,
      storeId: parsedStoreId,
    });

  return advance;
};

export const getAdvanceReceivesService = async (
  storeId
) => {
  const parsedStoreId = validateStoreId(storeId);

  return await advanceReceiveRepo.getAdvanceReceivesRepo(
    parsedStoreId
  );
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

  return await advanceReceiveRepo.getAdvanceReceivesByContactRepo(
    parsedStoreId,
    phone
  );
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

  return advance;
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

    updateData.amount = amount;
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

  return await advanceReceiveRepo.getAdvanceReceiveByIdRepo(
    parsedId,
    parsedStoreId
  );
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

  await advanceReceiveRepo.deleteAdvanceReceiveRepo(
    parsedId,
    parsedStoreId
  );

  return {
    message: "Advance receive deleted successfully",
  };
};
