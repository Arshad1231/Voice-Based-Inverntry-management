import { useRef, useState } from "react";

const API_URL = "http://localhost:3000/api";

function useVoice() {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] =
    useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startListening = async () => {
    if (isListening || isTranscribing) {
      return;
    }

    try {
      setError("");
      setTranscript("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setError(
          "Microphone recording is not supported in this browser."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const mediaRecorder =
        new MediaRecorder(stream);

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(
            event.data
          );
        }
      };

      mediaRecorder.onstop = async () => {
        try {
          setIsListening(false);
          setIsTranscribing(true);

          stream
            .getTracks()
            .forEach((track) => track.stop());

          const audioBlob = new Blob(
            audioChunksRef.current,
            {
              type: mediaRecorder.mimeType,
            }
          );

          console.log(
            "Audio recorded:",
            {
              type: audioBlob.type,
              size: audioBlob.size,
            }
          );

          await sendAudioForTranscription(
            audioBlob
          );
        } catch (error) {
          console.error(
            "Audio transcription error:",
            error
          );

          setError(
            error.message ||
              "Failed to transcribe audio."
          );
        } finally {
          setIsTranscribing(false);
        }
      };

      mediaRecorderRef.current =
        mediaRecorder;

      mediaRecorder.start();

      console.log(
        "Recording started"
      );

      setIsListening(true);
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      if (
        error.name === "NotAllowedError"
      ) {
        setError(
          "Microphone permission was denied."
        );
      } else if (
        error.name === "NotFoundError"
      ) {
        setError(
          "No microphone was found."
        );
      } else {
        setError(
          "Unable to access the microphone."
        );
      }

      setIsListening(false);
    }
  };

  const stopListening = () => {
    const recorder =
      mediaRecorderRef.current;

    if (
      recorder &&
      recorder.state !== "inactive"
    ) {
      console.log(
        "Recording stopped"
      );

      recorder.stop();
    }
  };

  const sendAudioForTranscription =
    async (audioBlob) => {
      const formData =
        new FormData();

      const extension =
        audioBlob.type.includes("webm")
          ? "webm"
          : "wav";

      formData.append(
        "audio",
        audioBlob,
        `voice-command.${extension}`
      );

      console.log(
        "Sending audio to Whisper:",
        {
          type: audioBlob.type,
          size: audioBlob.size,
        }
      );

      const response =
        await fetch(
          `${API_URL}/voice/transcribe`,
          {
            method: "POST",
            body: formData,
          }
        );

      const data =
        await response.json();

      console.log(
        "Whisper response:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Whisper transcription failed."
        );
      }

      const text =
        data.data?.transcript ||
        "";

      if (!text.trim()) {
        throw new Error(
          "No speech was detected."
        );
      }

      console.log(
        "Transcript received:",
        text
      );

      setTranscript(
        text.trim()
      );

      return text.trim();
    };

  return {
    isListening,
    isTranscribing,
    transcript,
    error,
    startListening,
    stopListening,
  };
}

export default useVoice;