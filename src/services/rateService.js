import * as service from "../repositories/rateRepository.js";

// CREATE
export const createRateService = async (data, storeId) => {
  if (!data.metalId) {
    throw new Error("Metal is required");
  }
  if (!data.purityId) {
    throw new Error("Purity is required");
  }
  if (!data.gradeId) {
    throw new Error("Grade is required");
  }
    

    return await service.createRateRepo({
        ...data,
        storeId,
    });
}

// GET
export const getRatesService = async (storeId) => {
    return await service.getRatesRepo(storeId);
};
// GET BY ID
export const getRateByIdService = async (id, storeId) => {
    const rate = await service.getRateByIdRepo(id);
    if (!rate) {
        throw new Error("Rate not found");
    }
    if (rate.storeId !== storeId) {
        throw new Error("Unauthorized");
    }
    return rate;
}
// UPDATE
export const updateRateService = async (id, data, storeId) => {
    const rate = await service.getRateByIdRepo(id);
    if (!rate) {
        throw new Error("Rate not found");
    }
    if (rate.storeId !== storeId) {
        throw new Error("Unauthorized");
    }
    if (!data.metalId) {
        throw new Error("Metal is required");
    }
    if (!data.purityId) {
        throw new Error("Purity is required");
    }
    if (!data.gradeId) {
        throw new Error("Grade is required");
    }
    return await service.updateRateRepo(id, data);
}

// DELETE
export const deleteRateService = async (id, storeId) => {
    const rate = await service.getRateByIdRepo(id);
    if (!rate) {
        throw new Error("Rate not found");
    }
    if (rate.storeId !== storeId) {
        throw new Error("Unauthorized");
    }
    try {
        return await service.deleteRateRepo(id);
    } catch (error) {
        throw new Error(handleDeleteError(error, "rate"));
    }
}
