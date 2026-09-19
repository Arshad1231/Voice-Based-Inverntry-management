import Inventory from "../models/Inventory.js";
import Transaction from "../models/Transaction.js";
import {
  addStock as addStockService,
  removeStock as removeStockService,
} from "../services/inventory/stockService.js";

/*
 * CREATE ITEM
 * POST /api/inventory
 */
export const createInventoryItem = async (req, res) => {
  try {
    const {
      name,
      quantity = 0,
      unit,
      lowStockThreshold = 5,
    } = req.body;

    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: "Name and unit are required",
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity cannot be negative",
      });
    }

    const normalizedName = name.trim();

    const existingItem = await Inventory.findOne({
      name: normalizedName,
    });

    if (existingItem) {
      return res.status(409).json({
        success: false,
        message: `${existingItem.name} already exists in inventory`,
        data: existingItem,
      });
    }

    const item = await Inventory.create({
      name: normalizedName,
      quantity,
      unit,
      lowStockThreshold,
    });

    res.status(201).json({
      success: true,
      message: "Inventory item created successfully",
      data: item,
    });
  } catch (error) {
    // Handle duplicate index error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "This inventory item already exists",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to create inventory item",
      error: error.message,
    });
  }
};
/*
 * GET ALL ITEMS
 * GET /api/inventory
 */
export const getInventory = async (req, res) => {
  try {
    const inventory = await Inventory.find().sort({
      name: 1,
    });

    res.status(200).json({
      success: true,
      count: inventory.length,
      data: inventory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory",
      error: error.message,
    });
  }
};

/*
 * GET SINGLE ITEM
 * GET /api/inventory/:id
 */
export const getInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch inventory item",
      error: error.message,
    });
  }
};

/*
 * UPDATE ITEM
 * PATCH /api/inventory/:id
 */
export const updateInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item updated successfully",
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update inventory item",
      error: error.message,
    });
  }
};

/*
 * DELETE ITEM
 * DELETE /api/inventory/:id
 */
export const deleteInventoryItem = async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Inventory item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete inventory item",
      error: error.message,
    });
  }
};
/*
 * ADD STOCK
 * POST /api/inventory/:id/add
 */
export const addStock = async (req, res) => {
  try {
    const {
      quantity,
      source = "MANUAL",
      note,
    } = req.body;

    const result = await addStockService({
      inventoryId: req.params.id,
      quantity,
      source,
      note,
    });

    res.status(200).json({
      success: true,
      message: `${quantity} ${result.item.unit} of ${result.item.name} added successfully`,
      data: result,
    });
  } catch (error) {
    const status =
      error.message === "Inventory item not found"
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};


/*
 * REMOVE STOCK
 * POST /api/inventory/:id/remove
 */
export const removeStock = async (req, res) => {
  try {
    const {
      quantity,
      source = "MANUAL",
      note,
    } = req.body;

    const result = await removeStockService({
      inventoryId: req.params.id,
      quantity,
      source,
      note,
    });

    res.status(200).json({
      success: true,
      message: `${quantity} ${result.item.unit} of ${result.item.name} removed successfully`,
      data: result,
    });
  } catch (error) {
    const status =
      error.message === "Inventory item not found"
        ? 404
        : 400;

    res.status(status).json({
      success: false,
      message: error.message,
    });
  }
};

/*
 * GET LOW STOCK ITEMS
 * GET /api/inventory/low-stock
 */
export const getLowStockItems = async (req, res) => {
  try {
    const items = await Inventory.find({
      $expr: {
        $lte: ["$quantity", "$lowStockThreshold"],
      },
    }).sort({
      quantity: 1,
    });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch low stock items",
      error: error.message,
    });
  }
};