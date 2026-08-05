import {
  createPartyTypeRepo,
    getPartyTypesByStore,
    getPartyTypeByIdRepo,
    updatePartyTypeRepo,
    deletePartyTypeRepo
} from "../repositories/partytypeRepository.js";


// CREATE
export const createPartyType = async (data, storeId) => {

  return await createPartyTypeRepo({
    name: data.name,
    description: data.description,
    storeId: storeId
  });

};


// GET ALL
export const getPartyTypes = async (storeId) => {

  return await getPartyTypesByStore(storeId);

};


// GET BY ID
export const getPartyTypeById = async (id, storeId) => {

  const partytype = await getPartyTypeByIdRepo(id);

  if (!partytype) {
    throw new Error("Party type not found");
  }


  if (partytype.storeId !== storeId) {
    throw new Error("Party type does not belong to this store");
  }


  return partytype;

};


// UPDATE
export const updatePartyType = async (id, data, storeId) => {


  const partytype = await getPartyTypeByIdRepo(id);


  if (!partytype) {
    throw new Error("Party type not found");
  }


  if (partytype.storeId !== storeId) {
    throw new Error("Unauthorized");
  }


  return await updatePartyTypeRepo(id,{
    name:data.name,
    description:data.description
  });

};


// DELETE
export const deletePartyType = async (id, storeId) => {


  const partytype = await getPartyTypeByIdRepo(id);


  if (!partytype) {
    throw new Error("Party type not found");
  }


  if (partytype.storeId !== storeId) {
    throw new Error("Unauthorized");
  }


  return await deletePartyTypeRepo(id);

};