import prisma from "../config/db.js";
import {
  getProductsByStore,
  getProductsByMetalIdRepo,
  getProductByIdRepo,
  updateProductRepo,
  deleteProductRepo,
} from "../repositories/productRepository.js";

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


  const purityId = data.purityId && Number(data.purityId) > 0 ? Number(data.purityId) : null;
  let gradeId = data.gradeId && Number(data.gradeId) > 0 ? Number(data.gradeId) : null;

  if (purityId && !gradeId) {
    const defaultGrade = await prisma.grade.findFirst({
      where: { purityId },
      orderBy: { id: "asc" },
    });
    if (defaultGrade) gradeId = defaultGrade.id;
  }

  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      categoryId: Number(data.categoryId),
      metalId: Number(data.metalId),
      purityId,
      gradeId,
      storeId: Number(storeId),
      image: data.image
    },
    include: {
      category: true,
      metal: true,
      purity: true,
      grade: true,
    }
  });


  return product;
};

export const getProducts = async (storeId) => {
  return await getProductsByStore(storeId);
};

export const getProductsByMetalId = async (metalId, storeId) => {
  if (!metalId) {
    throw new Error("Metal ID is required");
  }

  return await getProductsByMetalIdRepo(Number(metalId), Number(storeId));
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

  const updateData = {
    ...data,
  };

  if (updateData.categoryId !== undefined) {
    updateData.categoryId = Number(updateData.categoryId);
  }

  if (updateData.metalId !== undefined) {
    updateData.metalId = Number(updateData.metalId);
  }

  if (updateData.purityId !== undefined) {
    updateData.purityId = updateData.purityId && Number(updateData.purityId) > 0
      ? Number(updateData.purityId)
      : null;
    if (!updateData.purityId) {
      updateData.gradeId = null;
    }
  }

  if (updateData.gradeId !== undefined) {
    updateData.gradeId = updateData.gradeId && Number(updateData.gradeId) > 0
      ? Number(updateData.gradeId)
      : null;
  } else if (updateData.purityId) {
    const defaultGrade = await prisma.grade.findFirst({
      where: { purityId: updateData.purityId },
      orderBy: { id: "asc" },
    });
    if (defaultGrade) updateData.gradeId = defaultGrade.id;
  }

  return await updateProductRepo(id, updateData);
};

export const deleteProduct = async (id, storeId) => {
  const product = await getProductByIdRepo(id);

  if (!product) throw new Error("Product not found");

  if (product.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  try {
    return await deleteProductRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "product"));
  }
};
