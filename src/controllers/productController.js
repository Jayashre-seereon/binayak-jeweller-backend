import * as productService from "../services/productService.js";

export const createProduct = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);
    const image = req.file ? req.file.location : null;

    const product = await productService.createProduct(
      { ...req.body, image },
      storeId
    );

    res.status(201).json({ success: true, product });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getProducts = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);

    const products = await productService.getProducts(storeId);

    res.json({ success: true, products });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await productService.getProductById(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({ success: true, product });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const storeId = Number(req.query.storeId);
    const image = req.file ? req.file.location : undefined;

    const product = await productService.updateProduct(
      Number(req.params.id),
      { ...req.body, image },
      storeId
    );

    res.json({ success: true, product });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await productService.deleteProduct(
      Number(req.params.id),
      Number(req.query.storeId)
    );

    res.json({ success: true, message: "Deleted" });

  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};