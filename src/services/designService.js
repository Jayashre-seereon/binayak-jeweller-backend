import {
  createDesignRepo,
  getDesignsByStore,
  updateDesignRepo,
  deleteDesignRepo,
  getDesignByIdRepo
} from "../repositories/designRepository.js";


const parseStones = (stones) => {
  if (stones === undefined || stones === null) return undefined;
  if (typeof stones === "string") {
    try {
      return JSON.parse(stones);
    } catch {
      return [];
    }
  }
  return Array.isArray(stones) ? stones : [];
};

// CREATE
export const createDesign = async (data, storeId) => {
  const stones = parseStones(data.designStones ?? data.stones);

  return await createDesignRepo({
    name: data.name,
    description: data.description || null,
    image: data.image || null,
    productId: data.productId ? Number(data.productId) : null,
    storeId: Number(storeId),
    ...(stones !== undefined ? { designStones: stones } : {}),
  });
};


// GET ALL
export const getDesigns = async (storeId) => {
  return await getDesignsByStore(Number(storeId));
};


// GET BY ID
export const getDesignById = async (id, storeId) => {
  const design = await getDesignByIdRepo(Number(id));

  if (!design) {
    throw new Error("Design not found");
  }

  if (design.storeId !== Number(storeId)) {
    throw new Error("Design does not belong to this store");
  }

  return design;
};


// UPDATE
export const updateDesign = async (id, data, storeId) => {
  const design = await getDesignByIdRepo(Number(id));

  if (!design) {
    throw new Error("Design not found");
  }

  if (design.storeId !== Number(storeId)) {
    throw new Error("Unauthorized");
  }

  const updateData = {
    name: data.name,
    description: data.description,
  };

  if (data.productId !== undefined) {
    updateData.productId = data.productId ? Number(data.productId) : null;
  }

  if (data.image !== undefined) {
    updateData.image = data.image;
  }

  const stones = parseStones(data.designStones ?? data.stones);
  if (stones !== undefined) {
    updateData.designStones = stones;
  }

  return await updateDesignRepo(Number(id), updateData);
};


// DELETE
export const deleteDesign = async (id, storeId) => {


  const design = await getDesignByIdRepo(id);


  if (!design) {
    throw new Error("Design not found");
  }


  if (design.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

try {
    return await deleteDesignRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "design"));
  }

};