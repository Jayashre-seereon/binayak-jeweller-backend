import * as service from "../services/partyOpeningBalanceService.js";

// CREATE
export const createPartyOpeningBalance = async (req, res) => {
  try {
    const { storeId } = req.query;

    const data = await service.createPartyOpeningBalanceService(
      req.body,
      Number(storeId)
    );

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET
export const getPartyOpeningBalances = async (req, res) => {
  try {
    const { storeId } = req.query;

    const data = await service.getPartyOpeningBalancesService(Number(storeId));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// GET BY ID
export const getPartyOpeningBalanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;
    const data = await service.getPartyOpeningBalanceByIdService(Number(id), Number(storeId));
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// UPDATE
export const updatePartyOpeningBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;
    const data = await service.updatePartyOpeningBalanceService(
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
export const deletePartyOpeningBalance = async (req, res) => {
  try {
    const { id } = req.params;
    const { storeId } = req.query;
    await service.deletePartyOpeningBalanceService(Number(id), Number(storeId));
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};