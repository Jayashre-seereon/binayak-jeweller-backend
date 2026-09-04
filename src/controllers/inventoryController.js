import * as inventoryService from "../services/inventoryService.js";
import * as inventoryLabelPdfService from "../services/inventoryLabelPdfService.js";

export const createInventory = async (req, res) => {
  try {
    const { purchaseItemId } = req.body;
    const { storeId } = req.query;

    if (!purchaseItemId) {
      return res.status(400).json({
        success: false,
        message: "Please select a purchase item.",
      });
    }

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    const inventory = await inventoryService.createInventoryService(
      purchaseItemId,
      Number(storeId)
    );

    return res.status(201).json({
      success: true,
      message: "Inventory created successfully.",
      inventory,
    });
  } catch (error) {
    console.error("Create inventory error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to create inventory. Please try again.",
    });
  }
};

export const getInventories = async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    const filters = {
      purchaseType: req.query.purchaseType,
      status: req.query.status,
      itemId: req.query.itemId,
      productId: req.query.productId,
      metalId: req.query.metalId,
      purityId: req.query.purityId,
      barcodeNo: req.query.barcodeNo,
      tagNo: req.query.tagNo,
      huidNo: req.query.huidNo,
      barSerialNo: req.query.barSerialNo,
    };

    const inventories = await inventoryService.getInventoriesService(
      Number(storeId),
      filters
    );

    return res.status(200).json({
      success: true,
      count: inventories.length,
      inventories,
    });
  } catch (error) {
    console.error("Get inventories error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load inventories right now.",
    });
  }
};

export const getInventoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    const inventory = await inventoryService.getInventoryByIdService(
      id,
      Number(storeId)
    );

    return res.status(200).json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error("Get inventory by ID error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Inventory record not found.",
    });
  }
};

export const getInventoryByBarcode = async (req, res) => {
  try {
    const { barcodeNo } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    if (!barcodeNo) {
      return res.status(400).json({
        success: false,
        message: "Please enter a barcode number.",
      });
    }

    const inventory = await inventoryService.getInventoryByBarcodeService(
      barcodeNo,
      Number(storeId)
    );

    return res.status(200).json({
      success: true,
      inventory,
    });
  } catch (error) {
    console.error("Get inventory by barcode error:", error);

    return res.status(404).json({
      success: false,
      message: error.message || "Inventory record not found.",
    });
  }
};

export const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    const inventory = await inventoryService.updateInventoryService(
      id,
      Number(storeId),
      req.body
    );

    return res.status(200).json({
      success: true,
      message: "Inventory updated successfully.",
      inventory,
    });
  } catch (error) {
    console.error("Update inventory error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update inventory. Please try again.",
    });
  }
};

export const updateInventoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Please select an inventory status.",
      });
    }

    const inventory = await inventoryService.updateInventoryStatusService(
      id,
      Number(storeId),
      status
    );

    return res.status(200).json({
      success: true,
      message: "Inventory status updated successfully.",
      inventory,
    });
  } catch (error) {
    console.error("Update inventory status error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to update inventory status. Please try again.",
    });
  }
};

export const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    await inventoryService.deleteInventoryService(id, Number(storeId));

    return res.status(200).json({
      success: true,
      message: "Inventory deleted successfully.",
    });
  } catch (error) {
    console.error("Delete inventory error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to delete inventory. Please try again.",
    });
  }
};

export const printInventoryLabel = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    await inventoryLabelPdfService.generateInventoryLabelPdf(
      id,
      Number(storeId),
      res
    );
  } catch (error) {
    console.error("Print inventory label error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to print the inventory label.",
    });
  }
};

export const printBulkInventoryLabels = async (req, res) => {
  try {
    const { storeId } = req.query;

    if (!storeId) {
      return res.status(400).json({
        success: false,
        message: "Please select a store.",
      });
    }

    await inventoryLabelPdfService.generateBulkInventoryLabelsPdf(
      req.body,
      Number(storeId),
      res
    );
  } catch (error) {
    console.error("Print bulk inventory labels error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to print inventory labels.",
    });
  }
};
