import {
  createBrandRepo,
  getBrandsByStore,
  updateBrandRepo,
  deleteBrandRepo,
  getBrandByIdRepo,
} from "../repositories/brandRepository.js";


// CREATE
export const createBrand = async (data, storeId) => {

  return await createBrandRepo({
    name: data.name,
    description: data.description,
    storeId: storeId
  });

};


// GET ALL
export const getBrands = async (storeId) => {

  return await getBrandsByStore(storeId);

};


// GET BY ID
export const getBrandById = async (id, storeId) => {

  const brand = await getBrandByIdRepo(id);

  if (!brand) {
    throw new Error("Brand not found");
  }


  if (brand.storeId !== storeId) {
    throw new Error("Brand does not belong to this store");
  }


  return brand;

};


// UPDATE
export const updateBrand = async (id, data, storeId) => {


  const brand = await getBrandByIdRepo(id);


  if (!brand) {
    throw new Error("Brand not found");
  }


  if (brand.storeId !== storeId) {
    throw new Error("Unauthorized");
  }


  return await updateBrandRepo(id,{
    name:data.name,
    description:data.description
  });

};


// DELETE
export const deleteBrand = async (id, storeId) => {
  const brand = await getBrandByIdRepo(id);
  if (!brand) {
    throw new Error("Brand not found");
  }
  if (brand.storeId !== storeId) {
    throw new Error("Unauthorized");
  }
  try {
    return await deleteBrandRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "brand"));
  }
 

};