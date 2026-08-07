import * as service from "../services/purityService.js";

export const createPurity = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const result = await service.createPurity(req.body, storeId);

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getPurities = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const data = await service.getPurities(storeId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getPurityById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const storeId = Number(req.query.storeId);

    const data = await service.getPurityById(id, storeId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updatePurity = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const storeId = Number(req.query.storeId);

    const data = await service.updatePurity(id, req.body, storeId);

    res.json({ success: true, data });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deletePurity = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const storeId = Number(req.query.storeId);

    await service.deletePurity(id, storeId);

    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};
