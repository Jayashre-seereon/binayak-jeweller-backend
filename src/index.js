import 'dotenv/config';
import express from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import categoryRoutes from "./routes/CategoryRoutes.js";
import metalRoutes from "./routes/metalRoutes.js";
import purityRoutes from "./routes/purityRoutes.js";
import gradeRoutes from "./routes/gradeRoutes.js";
import designRoutes from "./routes/designRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import itemRoutes from "./routes/itemRoutes.js";
import stoneRoutes from "./routes/stoneRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import partytypeRoutes from "./routes/partytypeRoutes.js";
import partyMasterRoutes from "./routes/partyMasterRoutes.js";
import partyOpeningBalanceRoutes from "./routes/PartyOpeningBalanceRoutes.js";
import RateRoutes from "./routes/rateRoutes.js";
import Purchases from "./routes/purchaseRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import inventoryTransferRoutes from "./routes/inventoryTransferRoutes.js"
import advanceReceiveRoutes from "./routes/advanceReceiveRoutes.js";
import salesRoutes from "./routes/salesRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/metals", metalRoutes);
app.use("/api/purities", purityRoutes);
app.use("/api/grades", gradeRoutes);
app.use("/api/designs", designRoutes);
app.use("/api/products", productRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/stones", stoneRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/partytypes", partytypeRoutes);
app.use("/api/partymasters", partyMasterRoutes);
app.use("/api/partyopeningbalances", partyOpeningBalanceRoutes);
app.use("/api/rates", RateRoutes);
app.use("/api/purchases", Purchases);
app.use("/api/inventories", inventoryRoutes);
app.use("/api/inventory-transfer", inventoryTransferRoutes);
app.use("/api/advance-receives", advanceReceiveRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/customers", customerRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});