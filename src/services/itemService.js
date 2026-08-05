import prisma from "../config/db.js";
import {
  createItemRepo,
  getItemsByStore,
  getItemByIdRepo,
  updateItemRepo,
  deleteItemRepo,
  countItems,
} from "../repositories/itemRepository.js";

import { generateItemCode } from "../utils/itemCode.js";

// Create Item
export const createItem = async (data, storeId) => {
  // Check Product
  const product = await prisma.product.findUnique({
    where: {
      id: Number(data.productId),
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  // Check Design
  const design = await prisma.design.findUnique({
    where: {
      id: Number(data.designId),
    },
  });

  if (!design) {
    throw new Error("Design not found");
  }

  // Count Items
  const count = await countItems();

  // Generate Item Code
 const itemCode = await generateItemCode(
  product.name,
  design.name,
  count
);

  // Create Item
  return await createItemRepo({
    itemCode,
    name: data.name,
    description: data.description,
    image: data.image,
    productId: Number(data.productId),
    designId: Number(data.designId),
    storeId: Number(storeId),
  });
};

// Get All Items
export const getItems = async (storeId) => {
  return await getItemsByStore(Number(storeId));
};

// Get Item By Id
export const getItemById = async (id, storeId) => {
  const item = await getItemByIdRepo(Number(id));

  if (!item) {
    throw new Error("Item not found");
  }

  if (item.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  return item;
};

// Update Item
export const updateItem = async (id, data, storeId) => {
  const item = await getItemByIdRepo(Number(id));

  if (!item) {
    throw new Error("Item not found");
  }

  if (item.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  // Validate Product if changed
  if (data.productId) {
    const product = await prisma.product.findUnique({
      where: {
        id: Number(data.productId),
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }
  }

  // Validate Design if changed
  if (data.designId) {
    const design = await prisma.design.findUnique({
      where: {
        id: Number(data.designId),
      },
    });

    if (!design) {
      throw new Error("Design not found");
    }
  }

  return await updateItemRepo(Number(id), {
    ...(data.name && { name: data.name }),
    ...(data.description !== undefined && {
      description: data.description,
    }),
    ...(data.image !== undefined && {
      image: data.image,
    }),
    ...(data.productId && {
      productId: Number(data.productId),
    }),
    ...(data.designId && {
      designId: Number(data.designId),
    }),
  });
};

// Delete Item
export const deleteItem = async (id, storeId) => {
  const item = await getItemByIdRepo(Number(id));

  if (!item) {
    throw new Error("Item not found");
  }

  if (item.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  return await deleteItemRepo(Number(id));
};