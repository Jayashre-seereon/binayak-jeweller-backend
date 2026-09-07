import {
  createDesignRepo,
  getDesignsByStore,
  updateDesignRepo,
  deleteDesignRepo,
  getDesignByIdRepo
} from "../repositories/designRepository.js";


// CREATE
export const createDesign = async (data, storeId) => {
  return await createDesignRepo({
    name: data.name,
    description: data.description,
    image: data.image,
    storeId: storeId
  });
};


// GET ALL
export const getDesigns = async (storeId) => {

  return await getDesignsByStore(storeId);

};


// GET BY ID
export const getDesignById = async (id, storeId) => {

  const design = await getDesignByIdRepo(id);

  if (!design) {
    throw new Error("Design not found");
  }


  if (design.storeId !== storeId) {
    throw new Error("Design does not belong to this store");
  }


  return design;

};


// UPDATE
export const updateDesign = async (id, data, storeId) => {


  const design = await getDesignByIdRepo(id);


  if (!design) {
    throw new Error("Design not found");
  }


  if (design.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  const updateData = {
    name: data.name,
    description: data.description,
  };

  if (data.image !== undefined) {
    updateData.image = data.image;
  }

  return await updateDesignRepo(id, updateData);
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