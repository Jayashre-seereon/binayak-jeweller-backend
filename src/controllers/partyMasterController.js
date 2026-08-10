import * as service from "../services/partyMasterService.js";

// CREATE
export const createPartyMaster = async (req, res) => {
  try {
    const { storeId } = req.query;

    const data = await service.createPartyMasterService(
      req.body,
      Number(storeId)
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET
export const getPartyMasters = async (req, res) => {
  try {
    const { storeId } = req.query;

    const data = await service.getPartyMastersService(Number(storeId));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// GET BY ID
// GET BY ID
export const getPartyMasterById = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    const data = await service.getPartyMasterByIdService(Number(id), Number(storeId));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE
export const updatePartyMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    const data = await service.updatePartyMasterService(
      Number(id),
      req.body,
      Number(storeId)
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE
export const deletePartyMaster = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;

    await service.deletePartyMasterService(Number(id), Number(storeId));
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};