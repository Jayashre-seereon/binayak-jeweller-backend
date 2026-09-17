import prisma from "../config/db.js";

import {
  createStoneRepo,
  getStonesByStore,
  getStoneByIdRepo,
  updateStoneRepo,
  deleteStoneRepo,
} from "../repositories/stoneRepository.js";

// Create
export const createStone = async (data, storeId) => {
  if (!data.name || !data.name.trim()) {
    throw new Error("Stone Name is required");
  }

  return await createStoneRepo({
    name: data.name.trim(),
    stoneType: data.stoneType?.trim() || null,
    shape: data.shape?.trim() || null,
    color: data.color?.trim() || null,
    clarity: data.clarity?.trim() || null,
    size: data.size?.trim() || null,
    unit: data.unit?.trim() || "PCS",
    description: data.description?.trim() || null,
    status: data.status || "ACTIVE",
    storeId: Number(storeId),
  });
};

// Get All
export const getStones = async (storeId) => {
  return await getStonesByStore(Number(storeId));
};

// Get By Id
export const getStoneById = async (id, storeId) => {
  const stone = await getStoneByIdRepo(Number(id));

  if (!stone) throw new Error("Stone not found");

  if (stone.storeId !== Number(storeId))
    throw new Error("Unauthorized");

  return stone;
};

// Update
export const updateStone = async (id, data, storeId) => {
  const stone = await getStoneByIdRepo(Number(id));

  if (!stone) throw new Error("Stone not found");

  if (stone.storeId !== Number(storeId))
    throw new Error("Unauthorized");

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name.trim();
  if (data.stoneType !== undefined) updateData.stoneType = data.stoneType?.trim() || null;
  if (data.shape !== undefined) updateData.shape = data.shape?.trim() || null;
  if (data.color !== undefined) updateData.color = data.color?.trim() || null;
  if (data.clarity !== undefined) updateData.clarity = data.clarity?.trim() || null;
  if (data.size !== undefined) updateData.size = data.size?.trim() || null;
  if (data.unit !== undefined) updateData.unit = data.unit?.trim() || "PCS";
  if (data.description !== undefined) updateData.description = data.description?.trim() || null;
  if (data.status !== undefined) updateData.status = data.status || "ACTIVE";

  return await updateStoneRepo(Number(id), updateData);
};

// Delete
export const deleteStone = async (id, storeId) => {
  const stone = await getStoneByIdRepo(Number(id));

  if (!stone) throw new Error("Stone not found");

  if (stone.storeId !== Number(storeId))
    throw new Error("Unauthorized");

  return await deleteStoneRepo(Number(id));
};

