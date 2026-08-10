import * as service from "../services/rateService.js";

// CREATE
export const createRate = async (req, res) => {
  try {
    const { storeId } = req.query;
    const rate = await service.createRateService(req.body, Number(storeId));
    res.status(201).json(rate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET
export const getRates = async (req, res) => {
  try {
    const { storeId } = req.query;
    const rates = await service.getRatesService(Number(storeId));
    res.json(rates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } 
};

// GET BY ID
export const getRateById = async (req, res) => {
  try {
    const id = Number(req.params.id);  
    const storeId = Number(req.query.storeId);

    const rate = await service.getRateByIdService(id, storeId);

    res.json(rate);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

// UPDATE
export const updateRate = async (req, res) => {
  try {
    const id = Number(req.params.id);   
    const { storeId } = req.query;
    const rate = await service.updateRateService(id, req.body, Number(storeId));
    res.json(rate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// DELETE
export const deleteRate = async (req, res) => {
    try {
       const id = Number(req.params.id);   
        const { storeId } = req.query;
        await service.deleteRateService(id, Number(storeId));
        res.json({ message: "Rate deleted successfully" });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}   