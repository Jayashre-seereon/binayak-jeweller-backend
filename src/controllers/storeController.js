import { createStore,getAllStores,getStoreById,updateStore,deleteStore } from "../services/storeService.js";

export const createStoreController = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can create store",
      });
    }

    const store = await createStore(req.body);

    res.status(201).json({
      success: true,
      store,
    });
  } catch (err) {
    res.status(400).json({
      message: err.message,
    });
  }
};

// GET ALL
export const getAllStoresController = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can view stores",
      });
    }

    const stores = await getAllStores();
    res.json({ success: true, stores });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET BY ID
export const getStoreByIdController = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can view store",
      });
    }

    const id = Number(req.params.id);
    const store = await getStoreById(id);

    res.json({ success: true, store });

  } catch (err) {
    res.status(404).json({ message: err.message });
  }
};

// UPDATE
export const updateStoreController = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can update store",
      });
    }

    const id = Number(req.params.id);
    const updated = await updateStore(id, req.body);

    res.json({ success: true, updated });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE
export const deleteStoreController = async (req, res) => {
  try {
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({
        message: "Only admin can delete store",
      });
    }

    const id = Number(req.params.id);

    await deleteStore(id);

    res.json({ success: true, message: "Store deleted" });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};