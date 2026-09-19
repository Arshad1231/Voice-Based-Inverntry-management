import {
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";

import useVoice from "../../hooks/useVoice";

function VoiceInput() {
  const {
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
  } = useVoice();

  const handleVoiceClick = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center justify-center">

        {/* Microphone */}
        <button
          onClick={handleVoiceClick}
          className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all ${
            isListening
              ? "animate-pulse bg-red-500 hover:bg-red-600"
              : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          {isListening ? (
            <MicOff size={32} />
          ) : (
            <Mic size={32} />
          )}
        </button>

        {/* Status */}
        <h2 className="mt-4 text-lg font-bold text-slate-900">
          {isListening
            ? "Listening..."
            : "Tap to Speak"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {isListening
            ? "Speak your inventory command"
            : "Try: Add 5 bags of rice"}
        </p>

        {/* Transcript */}
        {transcript && (
          <div className="mt-6 w-full rounded-xl bg-slate-50 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-600">
              <Volume2 size={16} />
              You said
            </div>

            <p className="text-lg font-medium text-slate-900">
              "{transcript}"
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 w-full rounded-xl bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

export default VoiceInput;