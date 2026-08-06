import * as repo from "../repositories/partyOpeningBalanceRepository.js";

// CREATE
export const createPartyOpeningBalanceService = async (data, storeId) => {
 

  if (!data.partymasterId) {
    throw new Error("Party master is required");
  }

  if (!data.metalId ) {
    throw new Error("Metal is required");
  }

  return await repo.createPartyOpeningBalanceRepo({
    ...data,
    storeId,
  });
};

// GET
export const getPartyOpeningBalancesService = async (storeId) => {
  return await repo.getPartyOpeningBalancesRepo(storeId);
};
// GET BY ID
export const getPartyOpeningBalanceByIdService = async (id) => {
  return await repo.getPartyOpeningBalanceByIdRepo(id);
};

// UPDATE
export const updatePartyOpeningBalanceService = async (id, data) => {
  return await repo.updatePartyOpeningBalanceRepo(id, data);
};

// DELETE
export const deletePartyOpeningBalanceService = async (id) => {
  return await repo.deletePartyOpeningBalanceRepo(id);
};