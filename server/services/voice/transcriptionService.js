const WHISPER_URL =
  "http://127.0.0.1:5000/transcribe";

export const transcribeAudio = async ({
  buffer,
  originalname,
  mimetype,
}) => {
  if (!buffer) {
    throw new Error("Audio file is required");
  }

  const formData = new FormData();

  const audioBlob = new Blob(
    [buffer],
    {
      type: mimetype || "audio/webm",
    }
  );

  formData.append(
    "audio",
    audioBlob,
    originalname || "voice-command.webm"
  );

  console.log(
    "Sending audio to local Whisper..."
  );

  const response = await fetch(
    WHISPER_URL,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Whisper transcription failed"
    );
  }

  const transcript =
    data.data?.transcript || "";

  if (!transcript.trim()) {
    throw new Error(
      "No speech was detected."
    );
  }

  console.log(
    "Whisper transcript:",
    transcript
  );

  return transcript.trim();
};