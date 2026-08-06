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
  const product = await prisma.product.findUnique({
    where: {
      id: Number(data.productId),
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  const item = await prisma.item.findUnique({
    where: {
      id: Number(data.itemId),
    },
  });

  if (!item) {
    throw new Error("Item not found");
  }

  return await createStoneRepo({
    name: data.name,
    description: data.description,
    productId: Number(data.productId),
    itemId: Number(data.itemId),
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

  if (data.productId) {
    const product = await prisma.product.findUnique({
      where: {
        id: Number(data.productId),
      },
    });

    if (!product) throw new Error("Product not found");
  }

  if (data.itemId) {
    const item = await prisma.item.findUnique({
      where: {
        id: Number(data.itemId),
      },
    });

    if (!item) throw new Error("Item not found");
  }

  return await updateStoneRepo(Number(id), {
    ...(data.name && { name: data.name }),
    ...(data.description !== undefined && {
      description: data.description,
    }),
    ...(data.productId && {
      productId: Number(data.productId),
    }),
    ...(data.itemId && {
      itemId: Number(data.itemId),
    }),
  });
};

// Delete
export const deleteStone = async (id, storeId) => {
  const stone = await getStoneByIdRepo(Number(id));

  if (!stone) throw new Error("Stone not found");

  if (stone.storeId !== Number(storeId))
    throw new Error("Unauthorized");

  try {
    return await deleteStoneRepo(Number(id));
  } catch (error) {
    throw new Error(handleDeleteError(error, "stone"));
  }
};