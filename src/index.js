import express from "express";
import userRoutes from "./routes/userRoutes.js";
import storeRoutes from "./routes/storeRoutes.js";
import brandRoutes from "./routes/brandRoutes.js";
import categoryRoutes from "./routes/CategoryRoutes.js";
const app = express();

 app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/stores", storeRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/categories", categoryRoutes);

app.get("/", (req, res) => {
  res.send("API is running");
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});