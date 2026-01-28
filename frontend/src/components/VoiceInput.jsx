import { useState, useRef } from "react";
import { useReactMediaRecorder } from "react-media-recorder";
import { Mic, MicOff, Loader2, Volume2, Languages } from "lucide-react";

/**
 * VoiceInput Component
 * 
 * Drop-in voice input component for multilingual RAG queries.
 * Supports: English, Hindi, Kannada, Tamil
 * 
 * Props:
 * - onQueryReceived: (queryText, responseText, sources) => void
 * - apiBaseUrl: Backend URL (default: "http://127.0.0.1:8000")
 */
export default function VoiceInput({
  onQueryReceived,
  apiBaseUrl = "http://127.0.0.1:5000",
  language: externalLanguage,
  onLanguageChange
}) {
  // Use external language state if provided, otherwise fallback to local state
  const [localLanguage, setLocalLanguage] = useState("english");
  const language = externalLanguage ?? localLanguage;
  const setLanguage = onLanguageChange ?? setLocalLanguage;

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const audioRef = useRef(null);

  const languages = [
    { value: "english", label: "English", flag: "🇬🇧" },
    { value: "hindi", label: "हिन्दी", flag: "🇮🇳" },
    { value: "kannada", label: "ಕನ್ನಡ", flag: "🇮🇳" },
    { value: "tamil", label: "தமிழ்", flag: "🇮🇳" },
  ];

  // Handle recording stop - auto-submit to backend
  const handleStop = async (blobUrl, blob) => {
    if (!blob || blob.size === 0) {
      setError("No audio recorded. Please try again.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create FormData with audio file and language
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      formData.append("target_lang", language);

      // Send to backend
      const response = await fetch(`${apiBaseUrl}/process-audio`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to process audio");
      }

      const data = await response.json();

      // Auto-play the response audio
      if (data.audio_base64 && audioRef.current) {
        audioRef.current.src = `data:audio/mp3;base64,${data.audio_base64}`;
        audioRef.current.play().catch((e) => console.log("Audio autoplay blocked:", e));
      }

      // Callback with transcribed query and response
      if (onQueryReceived) {
        onQueryReceived(
          data.query_text_native,
          data.response_text_native,
          data.sources || []
        );
      }
    } catch (err) {
      console.error("Voice processing error:", err);
      setError(err.message || "Failed to process voice input");
    } finally {
      setIsProcessing(false);
    }
  };

  // React Media Recorder hook
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    audio: true,
    onStop: handleStop,
  });

  const isRecording = status === "recording";

  return (
    <div className="flex items-center gap-3">
      {/* Language Selector */}
      <div className="relative">
        <Languages size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={isRecording || isProcessing}
          className="pl-8 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-300 outline-none focus:ring-2 ring-indigo-500/20 transition-all appearance-none cursor-pointer disabled:opacity-50"
        >
          {languages.map((lang) => (
            <option key={lang.value} value={lang.value}>
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
      </div>

      {/* Microphone Button */}
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isProcessing}
        className={`
          p-3.5 rounded-xl transition-all shadow-lg 
          ${isRecording
            ? "bg-red-500 hover:bg-red-600 shadow-red-500/30 animate-pulse"
            : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/30"
          }
          text-white disabled:opacity-50 disabled:cursor-not-allowed
        `}
        title={isRecording ? "Stop recording" : "Start voice input"}
      >
        {isProcessing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isRecording ? (
          <MicOff size={20} />
        ) : (
          <Mic size={20} />
        )}
      </button>

      {/* Recording Status Indicator */}
      {isRecording && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Recording...</span>
        </div>
      )}

      {/* Processing Status */}
      {isProcessing && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20">
          <Loader2 size={12} className="animate-spin text-indigo-500" />
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Processing...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20">
          <span className="text-xs font-medium text-red-500">{error}</span>
        </div>
      )}

      {/* Hidden Audio Element for Playback */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
