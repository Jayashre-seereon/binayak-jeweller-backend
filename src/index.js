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

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});