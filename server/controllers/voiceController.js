import {
  addStock,
  removeStock,
} from "../services/inventory/stockService.js";

import {
  createInventoryItemService,
} from "../services/inventory/createItemService.js";

import {
  parseVoiceCommand,
} from "../services/voice/commandParser.js";

import {
  findBestInventoryMatch,
} from "../services/voice/itemMatcher.js";


// ============================================================
// PROCESS VOICE COMMAND
// ============================================================

export const processVoiceCommand = async (req, res) => {
  try {
    const {
      transcript,
      pendingCommand,
    } = req.body;

    // ==========================================================
    // VALIDATE TRANSCRIPT
    // ==========================================================

    if (!transcript || !transcript.trim()) {
      return res.status(400).json({
        success: false,
        message: "Transcript is required",
      });
    }


    // ==========================================================
    // HANDLE PENDING CONFIRMATION
    // ==========================================================

    if (pendingCommand) {
      const normalizedResponse =
        transcript
          .toLowerCase()
          .trim();

      const yesWords = [
        "yes",
        "yeah",
        "yep",
        "yup",
        "sure",
        "okay",
        "ok",
        "confirm",
        "do it",
        "add it",
      ];

      const noWords = [
        "no",
        "nope",
        "cancel",
        "don't",
        "do not",
        "not now",
      ];

      const isConfirmed =
        yesWords.some(
          (word) =>
            normalizedResponse === word ||
            normalizedResponse.includes(word)
        );

      const isRejected =
        noWords.some(
          (word) =>
            normalizedResponse === word ||
            normalizedResponse.includes(word)
        );


      // --------------------------------------------------------
      // USER CONFIRMED
      // --------------------------------------------------------

      if (isConfirmed) {
        try {
          const item =
            await createInventoryItemService({
              name: pendingCommand.item,
              quantity:
                pendingCommand.quantity,
              unit:
                pendingCommand.unit || "pieces",
            });

          return res.status(201).json({
            success: true,

            message:
              `${item.name} has been added to inventory with ${item.quantity} ${item.unit}.`,

            data: {
              action: "CREATE_ITEM",
              item,
              pendingCommand,
            },
          });

        } catch (error) {

          return res.status(400).json({
            success: false,
            message: error.message,
            data: {
              pendingCommand,
            },
          });

        }
      }


      // --------------------------------------------------------
      // USER REJECTED
      // --------------------------------------------------------

      if (isRejected) {
        return res.status(200).json({
          success: true,

          message:
            "Okay, I didn't add the item.",

          data: {
            action: "CANCEL_CREATE_ITEM",
            pendingCommand,
          },
        });
      }


      // --------------------------------------------------------
      // UNKNOWN CONFIRMATION RESPONSE
      // --------------------------------------------------------

      return res.status(400).json({
        success: false,

        message:
          "Please say yes or no.",

        data: {
          action: "WAITING_FOR_CONFIRMATION",
          pendingCommand,
        },
      });
    }


    // ==========================================================
    // PARSE NEW VOICE COMMAND
    // ==========================================================

    const command =
      parseVoiceCommand(transcript);

    console.log(
      "Voice command:",
      command
    );


    // ==========================================================
    // UNKNOWN COMMAND
    // ==========================================================

    if (command.intent === "UNKNOWN") {
      return res.status(400).json({
        success: false,
        message:
          "I couldn't understand that command.",
        data: command,
      });
    }


    // ==========================================================
    // ADD / REMOVE STOCK
    // ==========================================================

    if (
      command.intent === "ADD_STOCK" ||
      command.intent === "REMOVE_STOCK"
    ) {

      // --------------------------------------------------------
      // ITEM VALIDATION
      // --------------------------------------------------------

      if (!command.item) {
        return res.status(400).json({
          success: false,
          message:
            "Please specify the item.",
          data: command,
        });
      }


      // --------------------------------------------------------
      // QUANTITY VALIDATION
      // --------------------------------------------------------

      if (
        command.quantity === null ||
        command.quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please specify a valid quantity.",
          data: command,
        });
      }


      // --------------------------------------------------------
      // FIND INVENTORY ITEM
      // --------------------------------------------------------

      const match =
        await findBestInventoryMatch(
          command.item
        );


      // --------------------------------------------------------
      // ITEM NOT FOUND
      // --------------------------------------------------------

      if (
        match.status ===
        "NOT_FOUND"
      ) {

        // ------------------------------------------------------
        // IMPORTANT:
        // Only ADD commands can create new items.
        // REMOVE should never create an item.
        // ------------------------------------------------------

        if (
          command.intent ===
          "ADD_STOCK"
        ) {
          return res.status(404).json({
            success: false,

            message:
              `${command.item} isn't in your inventory. Would you like me to add it?`,

            data: {
              action:
                "CONFIRM_CREATE_ITEM",

              pendingCommand: {
                intent:
                  command.intent,

                item:
                  command.item,

                quantity:
                  command.quantity,

                unit:
                  command.unit,
              },
            },
          });
        }


        return res.status(404).json({
          success: false,

          message:
            `${command.item} was not found in inventory.`,

          data: {
            command,
            match,
          },
        });
      }


      // --------------------------------------------------------
      // MULTIPLE POSSIBLE ITEMS
      // --------------------------------------------------------

      if (
        match.status ===
        "AMBIGUOUS"
      ) {
        return res.status(409).json({
          success: false,

          message:
            `I found multiple possible matches for "${command.item}".`,

          data: {
            command,
            candidates:
              match.candidates,
          },
        });
      }


      // --------------------------------------------------------
      // MATCHED ITEM
      // --------------------------------------------------------

      const item =
        match.item;

      let result;


      // ========================================================
      // ADD STOCK
      // ========================================================

      if (
        command.intent ===
        "ADD_STOCK"
      ) {

        result =
          await addStock({
            inventoryId:
              item._id,

            quantity:
              command.quantity,

            source:
              "VOICE",

            note:
              transcript,
          });

      }


      // ========================================================
      // REMOVE STOCK
      // ========================================================

      else {

        result =
          await removeStock({
            inventoryId:
              item._id,

            quantity:
              command.quantity,

            source:
              "VOICE",

            note:
              transcript,
          });
      }


      // ========================================================
      // SUCCESS RESPONSE
      // ========================================================

      return res.status(200).json({
        success: true,

        message:
          command.intent ===
          "ADD_STOCK"

            ? `${command.quantity} ${item.unit} of ${item.name} added successfully`

            : `${command.quantity} ${item.unit} of ${item.name} removed successfully`,

        data: {
          command,

          item:
            result.item,

          transaction:
            result.transaction,

          match: {
            status:
              match.status,

            score:
              match.score,
          },
        },
      });
    }


    // ==========================================================
    // CHECK STOCK
    // ==========================================================

    if (
      command.intent ===
      "CHECK_STOCK"
    ) {

      // --------------------------------------------------------
      // ITEM VALIDATION
      // --------------------------------------------------------

      if (!command.item) {
        return res.status(400).json({
          success: false,

          message:
            "Please specify the item.",

          data: command,
        });
      }


      // --------------------------------------------------------
      // FIND ITEM
      // --------------------------------------------------------

      const match =
        await findBestInventoryMatch(
          command.item
        );


      // --------------------------------------------------------
      // NOT FOUND
      // --------------------------------------------------------

      if (
        match.status ===
        "NOT_FOUND"
      ) {
        return res.status(404).json({
          success: false,

          message:
            `${command.item} was not found in inventory.`,

          data: {
            command,
            match,
          },
        });
      }


      // --------------------------------------------------------
      // AMBIGUOUS
      // --------------------------------------------------------

      if (
        match.status ===
        "AMBIGUOUS"
      ) {
        return res.status(409).json({
          success: false,

          message:
            `I found multiple possible matches for "${command.item}".`,

          data: {
            command,

            candidates:
              match.candidates,
          },
        });
      }


      // --------------------------------------------------------
      // MATCHED ITEM
      // --------------------------------------------------------

      const item =
        match.item;


      // --------------------------------------------------------
      // SUCCESS
      // --------------------------------------------------------

      return res.status(200).json({
        success: true,

        message:
          `${item.name} has ${item.quantity} ${item.unit} in stock.`,

        data: {
          command,

          item,

          match: {
            status:
              match.status,

            score:
              match.score,
          },
        },
      });
    }


    // ==========================================================
    // UNSUPPORTED COMMAND
    // ==========================================================

    return res.status(400).json({
      success: false,

      message:
        "Unsupported voice command.",

      data: command,
    });

  } catch (error) {

    console.error(
      "Voice command error:",
      error
    );

    return res.status(500).json({
      success: false,

      message:
        "Failed to process voice command",

      error:
        error.message,
    });
  }
};