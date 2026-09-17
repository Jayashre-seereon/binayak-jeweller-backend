import * as stoneService from "../services/stoneService.js";
import prisma from "../config/db.js";

export const createStone = async (req, res) => {
  try {
    const stone = await stoneService.createStone(
      req.body,
      Number(req.query.storeId)
    );

    res.status(201).json({
      success: true,
      stone,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getStones = async (req, res) => {
  try {
    const stones = await stoneService.getStones(
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      stones,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getStonesByProductIdAndItemId = async (req, res) => {
  try {
    const item = await prisma.item.findUnique({
      where: { id: Number(req.params.itemId) },
      include: {
        design: {
          include: {
            designStones: {
              include: { stone: true },
            },
          },
        },
      },
    });

    const stones = (item?.design?.designStones || []).map((ds) => ({
      id: ds.stoneId,
      designStoneId: ds.id,
      name: ds.stone?.name,
      pieces: ds.pieces,
      expectedWeight: ds.expectedWeight,
      unit: ds.unit,
      stone: ds.stone,
    }));

    res.json({
      success: true,
      stones,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const getStoneById = async (req, res) => {
  try {
    const stone = await stoneService.getStoneById(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      stone,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const updateStone = async (req, res) => {
  try {
    const stone = await stoneService.updateStone(
      Number(req.params.id),
      req.body,
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      stone,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

export const deleteStone = async (req, res) => {
  try {
    await stoneService.deleteStone(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({
      success: true,
      message: "Stone deleted successfully",
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};
