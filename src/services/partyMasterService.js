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
export const getPartyMasterByIdService = async (id, storeId) => {
  const partyMaster = await repo.getPartyMasterByIdRepo(id);

  if (!partyMaster) {
    throw new Error("Party master not found");
  }

  if (partyMaster.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return partyMaster;
};

// UPDATE
export const updatePartyMasterService = async (id, data, storeId) => {
  const partyMaster = await repo.getPartyMasterByIdRepo(id);

  if (!partyMaster) {
    throw new Error("Party master not found");
  }

  if (partyMaster.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return await repo.updatePartyMasterRepo(id, data);
};

// DELETE
export const deletePartyMasterService = async (id, storeId) => {
  const partyMaster = await repo.getPartyMasterByIdRepo(id);

  if (!partyMaster) {
    throw new Error("Party master not found");
  }

  if (partyMaster.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  try {
    return await repo.deletePartyMasterRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "party master"));
  }
};