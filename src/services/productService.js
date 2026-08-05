import prisma from "../config/db.js";
import {
  createProductRepo,
  getProductsByStore,
  getProductByIdRepo,
  updateProductRepo,
  deleteProductRepo,
  countProducts
} from "../repositories/productRepository.js";

import { generateProductCode } from "../utils/productCode.js";

export const createProduct = async (data, storeId) => {

  const category = await prisma.category.findUnique({
    where: {
      id: Number(data.categoryId)
    }
  });

  const metal = await prisma.metal.findUnique({
    where: {
      id: Number(data.metalId)
    }
  });


  if (!category) {
    throw new Error("Category not found");
  }

  if (!metal) {
    throw new Error("Metal not found");
  }


  const count = await prisma.product.count();


  const productCode = await generateProductCode(
    data.name,
    category.name,
    metal.name,
    count
  );


  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      categoryId: Number(data.categoryId),
      metalId: Number(data.metalId),
      storeId: Number(storeId),
      image: data.image,
      productCode
    }
  });


  return product;
};

export const getProducts = async (storeId) => {
  return await getProductsByStore(storeId);
};

export const getProductById = async (id, storeId) => {
  const product = await getProductByIdRepo(id);

  if (!product) throw new Error("Product not found");

  if (product.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return product;
};

export const updateProduct = async (id, data, storeId) => {
  const product = await getProductByIdRepo(id);

  if (!product) throw new Error("Product not found");

  if (product.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return await updateProductRepo(id, data);
};

export const deleteProduct = async (id, storeId) => {
  const product = await getProductByIdRepo(id);

  if (!product) throw new Error("Product not found");

  if (product.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return await deleteProductRepo(id);
};