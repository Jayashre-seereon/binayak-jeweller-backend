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
export const getPartyOpeningBalanceByIdService = async (id, storeId) => {
  const partyOpeningBalance = await repo.getPartyOpeningBalanceByIdRepo(id);

  if (!partyOpeningBalance) {
    throw new Error("Party opening balance not found");
  }

  if (partyOpeningBalance.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  return partyOpeningBalance;
};

// UPDATE
export const updatePartyOpeningBalanceService = async (id, data, storeId) => {
  const partyOpeningBalance = await repo.getPartyOpeningBalanceByIdRepo(id);

  if (!partyOpeningBalance) {
    throw new Error("Party opening balance not found");
  }
  if (partyOpeningBalance.storeId !== storeId) {
    throw new Error("Unauthorized");
  }
  return await repo.updatePartyOpeningBalanceRepo(id, data);
};

// DELETE
export const deletePartyOpeningBalanceService = async (id, storeId) => {
  const partyOpeningBalance = await repo.getPartyOpeningBalanceByIdRepo(id);

  if (!partyOpeningBalance) {
    throw new Error("Party opening balance not found");
  }

  if (partyOpeningBalance.storeId !== storeId) {
    throw new Error("Unauthorized");
  }

  try {
    return await repo.deletePartyOpeningBalanceRepo(id);
  } catch (error) {
    throw new Error(handleDeleteError(error, "party opening balance"));
  }
};