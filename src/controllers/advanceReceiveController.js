import * as advanceReceiveService from "../services/advanceReceiveService.js";

const getStoreId = (req) => {
  return Number(req.query.storeId);
};

export const createAdvanceReceive = async (
  req,
  res
) => {
  try {
    const storeId = getStoreId(req);

    const advance =
      await advanceReceiveService.createAdvanceReceiveService(
        req.body,
        storeId
      );

    return res.status(201).json({
      success: true,
      message:
        "Advance receive created successfully",
      data: advance,
    });
  } catch (error) {
    console.error(
      "Create advance receive error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdvanceReceives = async (
  req,
  res
) => {
  try {
    const storeId = getStoreId(req);

    const advances =
      await advanceReceiveService.getAdvanceReceivesService(
        storeId
      );

    return res.status(200).json({
      success: true,
      data: advances,
    });
  } catch (error) {
    console.error(
      "Get advance receives error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdvanceReceiveById = async (
  req,
  res
) => {
  try {
    const storeId = getStoreId(req);

    const advance =
      await advanceReceiveService.getAdvanceReceiveByIdService(
        req.params.id,
        storeId
      );

    return res.status(200).json({
      success: true,
      data: advance,
    });
  } catch (error) {
    console.error(
      "Get advance receive error:",
      error
    );

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAdvanceReceivesByContact = async (
  req,
  res
) => {
  try {
    const storeId = getStoreId(req);
    const contactNumber = String(
      req.query.contactNumber || ""
    ).trim();

    const advances =
      await advanceReceiveService.getAdvanceReceivesByContactService(
        storeId,
        contactNumber
      );

    return res.status(200).json({
      success: true,
      data: advances,
    });
  } catch (error) {
    console.error(
      "Get advance receives by contact error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateAdvanceReceive = async (
  req,
  res
) => {
  try {
    const storeId = getStoreId(req);

    const advance =
      await advanceReceiveService.updateAdvanceReceiveService(
        req.params.id,
        req.body,
        storeId
      );

    return res.status(200).json({
      success: true,
      message:
        "Advance receive updated successfully",
      data: advance,
    });
  } catch (error) {
    console.error(
      "Update advance receive error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteAdvanceReceive = async (
  req,
  res
) => {
  try {
    const storeId = getStoreId(req);

    const result =
      await advanceReceiveService.deleteAdvanceReceiveService(
        req.params.id,
        storeId
      );

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error(
      "Delete advance receive error:",
      error
    );

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};
