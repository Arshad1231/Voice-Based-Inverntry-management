import { useCallback, useEffect, useRef, useState } from "react";

function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState("");

  const utteranceRef = useRef(null);

  const speak = useCallback((text) => {
    if (!text || !text.trim()) {
      return;
    }

    if (!("speechSynthesis" in window)) {
      setError(
        "Text-to-speech is not supported in this browser."
      );
      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(text);

    utterance.lang = "en-IN";
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setError("");
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error(
        "Speech synthesis error:",
        event
      );

      setIsSpeaking(false);
      setError("Unable to speak the response.");
    };

    utteranceRef.current = utterance;

    window.speechSynthesis.speak(utterance);
  }, []);

  const stopSpeaking = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    setIsSpeaking(false);
  }, []);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    speak,
    stopSpeaking,
    isSpeaking,
    error,
  };
}

export default useSpeech;