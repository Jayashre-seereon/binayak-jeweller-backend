import * as transferService from "../services/inventoryTransferService.js";

const getUserStoreId = (req) => {
  if (!req.user) {
    throw new Error("Authentication required");
  }

  if (req.user.role === "STORE") {
    const { storeId } = req.query;

    if (!storeId) {
      throw new Error("storeId is required");
    }

    return Number(storeId);
  }

  return null;
};

export const createInventoryTransfer = async (req, res) => {
  try {
    const {
      toStoreId,
      inventoryIds,
      narration,
    } = req.body;

    let fromStoreId;

    if (req.user.role === "STORE") {
      fromStoreId = getUserStoreId(req);
    } else if (req.user.role === "ADMIN") {
      fromStoreId = Number(req.body.fromStoreId);
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!fromStoreId) {
      return res.status(400).json({
        success: false,
        message: "storeId is required",
      });
    }

    if (!toStoreId) {
      return res.status(400).json({
        success: false,
        message: "toStoreId is required",
      });
    }

    if (Number(fromStoreId) === Number(toStoreId)) {
      return res.status(400).json({
        success: false,
        message: "Source and destination store cannot be same",
      });
    }

    if (!Array.isArray(inventoryIds) || inventoryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "inventoryIds are required",
      });
    }

    const transfer =
      await transferService.createTransferService({
        fromStoreId,
        toStoreId: Number(toStoreId),
        inventoryIds,
        narration,
      });

    return res.status(201).json({
      success: true,
      message: "Inventory transfer created successfully",
      transfer,
    });

  } catch (error) {
    console.error("Create inventory transfer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventoryTransfers = async (
  req,
  res
) => {
  try {
    const status = req.query.status;

    let storeId = null;

    if (req.user.role === "STORE") {
      storeId = getUserStoreId(req);
    }

    const transfers =
      await transferService.getTransfersService({
        storeId,
        status,
      });

    return res.status(200).json({
      success: true,
      count: transfers.length,
      transfers,
    });
  } catch (error) {
    console.error(
      "Get inventory transfers error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const getInventoryTransferById = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const transfer =
      await transferService.getTransferByIdService(
        id
      );

    if (req.user.role === "STORE") {
      const storeId = getUserStoreId(req);

      if (
        Number(transfer.fromStoreId) !== storeId &&
        Number(transfer.toStoreId) !== storeId
      ) {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to view this transfer",
        });
      }
    }

    return res.status(200).json({
      success: true,
      transfer,
    });
  } catch (error) {
    console.error(
      "Get inventory transfer error:",
      error
    );

    return res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateInventoryTransfer = async (req, res) => {
  try {
    const { id } = req.params;
    const storeId = Number(req.query.storeId);

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "storeId is required",
      });
    }

    const {
      toStoreId,
      inventoryIds,
      narration,
    } = req.body;

    const transfer =
      await transferService.updateTransferService({
        transferId: Number(id),
        fromStoreId: storeId,
        toStoreId,
        inventoryIds,
        narration,
      });

    return res.status(200).json({
      success: true,
      message: "Inventory transfer updated successfully",
      transfer,
    });

  } catch (error) {
    console.error("Update inventory transfer error:", error);

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const receiveInventoryTransfer = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    let toStoreId;

    if (req.user.role === "STORE") {
      toStoreId = getUserStoreId(req);
    } else if (req.user.role === "ADMIN") {
      toStoreId = Number(req.body.toStoreId);
    } else {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const transfer =
      await transferService.receiveTransferService({
        transferId: Number(id),
        toStoreId,
      });

    return res.status(200).json({
      success: true,
      message: "Inventory transfer received successfully",
      transfer,
    });
  } catch (error) {
    console.error(
      "Receive inventory transfer error:",
      error
    );

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};



