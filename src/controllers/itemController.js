import * as itemService from "../services/itemService.js";

// Create Item
export const createItem = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);
    const image = req.file ? req.file.location : null;

    const item = await itemService.createItem(
      {
        ...req.body,
        image,
      },
      storeId
    );

    res.status(201).json({
      success: true,
      item,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Get All Items
export const getItems = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const items = await itemService.getItems(storeId);

    res.status(200).json({
      success: true,
      items,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Items By Product Id
export const getItemsByProductId = async (req, res) => {
  try {
    const items = await itemService.getItemsByProductId(
      Number(req.params.productId),
      Number(req.query.storeId)
    );

    res.status(200).json({
      success: true,
      items,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Get Item By Id
export const getItemById = async (req, res) => {
  try {
    const item = await itemService.getItemById(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.status(200).json({
      success: true,
      item,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Update Item
export const updateItem = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);
    const image = req.file ? req.file.location : undefined;

    const item = await itemService.updateItem(
      Number(req.params.id),
      {
        ...req.body,
        image,
      },
      storeId
    );

    res.status(200).json({
      success: true,
      item,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// Delete Item
export const deleteItem = async (req, res) => {
  try {
    await itemService.deleteItem(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
