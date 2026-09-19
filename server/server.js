import dotenv from "dotenv";

dotenv.config();

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import voiceRoutes from "./routes/voiceRoutes.js";

const app = express();

connectDB();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Voice Inventory API is running 🚀",
  });
});

app.use(
  "/api/inventory",
  inventoryRoutes
);

app.use(
  "/api/transactions",
  transactionRoutes
);

app.use(
  "/api/voice",
  voiceRoutes
);

const PORT =
  process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`
  );
});