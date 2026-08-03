import * as metalService from "../services/metalService.js";

// CREATE
export const createMetal = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const metal = await metalService.createMetal(
      req.body,
      storeId
    );

    res.status(201).json({
      success: true,
      metal,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// GET ALL
export const getMetals = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const metals = await metalService.getMetals(storeId);

    res.json({
      success: true,
      metals,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// GET BY ID
export const getMetalById = async (req, res) => {
  try {
    const metal = await metalService.getMetalById(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      metal,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// UPDATE
export const updateMetal = async (req, res) => {
  try {
    const metal = await metalService.updateMetal(
      Number(req.params.id),
      req.body,
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      metal,
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// DELETE
export const deleteMetal = async (req, res) => {
  try {
    await metalService.deleteMetal(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      message: "Deleted",
    });

  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};