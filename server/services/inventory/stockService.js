import Inventory from "../../models/Inventory.js";
import Transaction from "../../models/Transaction.js";

export const addStock = async ({
  inventoryId,
  quantity,
  source = "MANUAL",
  note,
}) => {
  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  const item = await Inventory.findById(inventoryId);

  if (!item) {
    throw new Error("Inventory item not found");
  }

  const previousQuantity = item.quantity;

  item.quantity += quantity;

  await item.save();

  const transaction = await Transaction.create({
    inventoryId: item._id,
    type: "ADD",
    quantity,
    unit: item.unit,
    previousQuantity,
    newQuantity: item.quantity,
    source,
    note,
  });

  return {
    item,
    transaction,
  };
};

export const removeStock = async ({
  inventoryId,
  quantity,
  source = "MANUAL",
  note,
}) => {
  if (!quantity || quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  const item = await Inventory.findById(inventoryId);

  if (!item) {
    throw new Error("Inventory item not found");
  }

  if (quantity > item.quantity) {
    throw new Error(
      `Insufficient stock. Available: ${item.quantity} ${item.unit}`
    );
  }

  const previousQuantity = item.quantity;

  item.quantity -= quantity;

  await item.save();

  const transaction = await Transaction.create({
    inventoryId: item._id,
    type: "REMOVE",
    quantity,
    unit: item.unit,
    previousQuantity,
    newQuantity: item.quantity,
    source,
    note,
  });

  return {
    item,
    transaction,
  };
};