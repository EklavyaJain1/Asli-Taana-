/**
 * VoiceButton — voice-first input (Module 1).
 *
 * A large tappable mic that records speech via the Web Speech API and surfaces
 * the live transcript. The parent decides what to do with `transcript`
 * (e.g. fill multiple fields, save a story). Falls back to a typed input when
 * speech isn't supported.
 *
 * `lang` is BCP-47: we map the app's language toggle to a sensible recognition
 * locale so Hindi users get Hindi transcription.
 */
import React from "react";
import { Mic, MicOff, Square, Check } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useSpeechRecognition } from "../../hooks/useSpeechRecognition";
import { inputClass } from "./primitives";

export default function VoiceButton({
  onTranscript,
  lang,
  placeholder,
  seedValue = "",
}: {
  onTranscript: (text: string) => void;
  lang?: string;
  placeholder?: string;
  seedValue?: string;
}) {
  const { t, language } = useLanguage();
  const recognitionLang = lang || (language === "hi" ? "hi-IN" : "en-IN");
  const { supported, listening, transcript, interim, start, stop } =
    useSpeechRecognition({ lang: recognitionLang, continuous: true });

  // Whenever new final transcript arrives, push it up.
  React.useEffect(() => {
    if (transcript) onTranscript(transcript);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript]);

  if (!supported) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-2 text-[10px] text-[#1a1a1a]/50 mb-2 font-sans">
          <MicOff className="h-3.5 w-3.5" /> {t("onboard.step.voice.notSupported")}
        </div>
        <input
          className={inputClass}
          placeholder={placeholder}
          defaultValue={seedValue}
          onChange={(e) => onTranscript(e.target.value)}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <button
        onClick={listening ? stop : start}
        className={`relative flex items-center justify-center w-24 h-24 rounded-full border-4 transition-all shadow-md ${
          listening
            ? "border-[#dc143c] bg-[#dc143c]/10 animate-pulse"
            : "border-[#b45309] bg-[#b45309]/5 hover:bg-[#b45309]/15"
        }`}
        aria-label={listening ? t("onboard.step.voice.listening") : "Record voice"}
      >
        {listening ? (
          <Square className="h-9 w-9 text-[#dc143c] fill-[#dc143c]" />
        ) : (
          <Mic className="h-10 w-10 text-[#b45309]" />
        )}
        {listening && (
          <span className="absolute -bottom-7 text-[10px] font-sans font-bold uppercase tracking-wider text-[#dc143c] whitespace-nowrap">
            {t("onboard.step.voice.listening")}
          </span>
        )}
      </button>

      {(transcript || interim) && (
        <div className="w-full bg-[#f9f8f4] border border-[#1a1a1a]/15 p-3 rounded-none min-h-[56px]">
          <div className="flex items-start gap-2">
            <Check className="h-4 w-4 text-[#15803d] shrink-0 mt-0.5" />
            <p className="text-sm font-serif text-[#1a1a1a] leading-relaxed">
              {transcript}
              {interim && <span className="text-[#1a1a1a]/50 italic"> {interim}</span>}
            </p>
          </div>
        </div>
      )}

      {!transcript && !interim && !listening && (
        <p className="text-xs text-[#1a1a1a]/50 font-sans text-center max-w-xs">
          {t("onboard.step.voice.hint")}
        </p>
      )}
    </div>
  );
}
