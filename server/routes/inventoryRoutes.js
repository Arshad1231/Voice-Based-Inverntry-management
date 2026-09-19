import express from "express";

import {
  createInventoryItem,
  getInventory,
  getInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  addStock,
  removeStock,
  getLowStockItems,
} from "../controllers/inventoryController.js";

const router = express.Router();

router.post("/", createInventoryItem);

router.get("/", getInventory);

// IMPORTANT: keep this BEFORE /:id
router.get("/low-stock", getLowStockItems);

router.get("/:id", getInventoryItem);

router.post("/:id/add", addStock);

router.post("/:id/remove", removeStock);

router.patch("/:id", updateInventoryItem);

router.delete("/:id", deleteInventoryItem);

export default router;