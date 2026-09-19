import Inventory from "../models/Inventory.js";
import { addStock, removeStock } from "../services/inventory/stockService.js";
import { parseVoiceCommand } from "../services/voice/commandParser.js";

export const processVoiceCommand = async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: "Transcript is required",
      });
    }

    const command = parseVoiceCommand(transcript);

    console.log("Voice command:", command);

    if (command.intent === "UNKNOWN") {
      return res.status(400).json({
        success: false,
        message: "I couldn't understand that command.",
        data: command,
      });
    }

    if (
      command.intent === "ADD_STOCK" ||
      command.intent === "REMOVE_STOCK"
    ) {
      if (!command.item) {
        return res.status(400).json({
          success: false,
          message: "Please specify the item.",
          data: command,
        });
      }

      if (!command.quantity) {
        return res.status(400).json({
          success: false,
          message: "Please specify the quantity.",
          data: command,
        });
      }

      const item = await Inventory.findOne({
        name: new RegExp(
          `^${command.item}$`,
          "i"
        ),
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${command.item} was not found in inventory.`,
          data: command,
        });
      }

      let result;

      if (command.intent === "ADD_STOCK") {
        result = await addStock({
          inventoryId: item._id,
          quantity: command.quantity,
          source: "VOICE",
          note: transcript,
        });
      } else {
        result = await removeStock({
          inventoryId: item._id,
          quantity: command.quantity,
          source: "VOICE",
          note: transcript,
        });
      }

      return res.status(200).json({
        success: true,
        message:
          command.intent === "ADD_STOCK"
            ? `${command.quantity} ${item.unit} of ${item.name} added successfully`
            : `${command.quantity} ${item.unit} of ${item.name} removed successfully`,
        data: {
          command,
          item: result.item,
          transaction: result.transaction,
        },
      });
    }

    if (command.intent === "CHECK_STOCK") {
      if (!command.item) {
        return res.status(400).json({
          success: false,
          message: "Please specify the item.",
          data: command,
        });
      }

      const item = await Inventory.findOne({
        name: new RegExp(
          `^${command.item}$`,
          "i"
        ),
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${command.item} was not found in inventory.`,
          data: command,
        });
      }

      return res.status(200).json({
        success: true,
        message: `${item.name} has ${item.quantity} ${item.unit} in stock.`,
        data: {
          command,
          item,
        },
      });
    }

    return res.status(400).json({
      success: false,
      message: "Unsupported voice command.",
      data: command,
    });

  } catch (error) {
    console.error("Voice command error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to process voice command",
      error: error.message,
    });
  }
};