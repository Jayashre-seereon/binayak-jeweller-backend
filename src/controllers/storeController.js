import { createStore } from "../services/storeService.js";

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