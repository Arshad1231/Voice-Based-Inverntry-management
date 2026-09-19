import Inventory from "../../models/Inventory.js";

export const createInventoryItemService = async ({
  name,
  quantity = 0,
  unit,
  lowStockThreshold = 5,
}) => {
  if (!name || !name.trim()) {
    throw new Error("Item name is required");
  }

  if (!unit || !unit.trim()) {
    throw new Error("Unit is required");
  }

  if (quantity < 0) {
    throw new Error("Quantity cannot be negative");
  }

  const normalizedName = name.trim();

  const existingItem = await Inventory.findOne({
    name: normalizedName,
  });

  if (existingItem) {
    throw new Error(
      `${existingItem.name} already exists in inventory`
    );
  }

  const item = await Inventory.create({
    name: normalizedName,
    quantity,
    unit,
    lowStockThreshold,
  });

  return item;
};