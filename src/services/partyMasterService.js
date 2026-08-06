import * as repo from "../repositories/partyMasterRepository.js";

// CREATE
export const createPartyMasterService = async (data, storeId) => {
  if (!data.name) {
    throw new Error("Party name is required");
  }

  if (!data.partytypeId) {
    throw new Error("Party type is required");
  }


  return await repo.createPartyMasterRepo({
    ...data,
    storeId,
  });
};

// GET
export const getPartyMastersService = async (storeId) => {
  return await repo.getPartyMastersRepo(storeId);
};
// GET BY ID
export const getPartyMasterByIdService = async (id) => {
  return await repo.getPartyMasterByIdRepo(id);
};

// UPDATE
export const updatePartyMasterService = async (id, data) => {
  
  return await repo.updatePartyMasterRepo(id, data);
};

// DELETE
export const deletePartyMasterService = async (id) => {
  return await repo.deletePartyMasterRepo(id);
};