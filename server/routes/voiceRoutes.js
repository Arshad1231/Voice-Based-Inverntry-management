import express from "express";
import multer from "multer";

import {
  processVoiceCommand,
  transcribeVoiceAudio,
} from "../controllers/voiceController.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
});

router.post(
  "/command",
  processVoiceCommand
);

router.post(
  "/transcribe",
  upload.single("audio"),
  transcribeVoiceAudio
);

export default router;