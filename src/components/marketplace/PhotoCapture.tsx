/**
 * PhotoCapture — photo-first capture for Module 1 onboarding.
 *
 * Camera-first (environment-facing) with an upload fallback, matching the
 * existing RegisterForm camera pattern but simplified to ONE tap. Calls
 * `onCapture(base64)` when a photo is taken or chosen.
 *
 * Mobile-first: the capture area is the largest element on screen, reinforcing
 * "photo first, type later".
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, X, RefreshCw } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";

export default function PhotoCapture({
  value, onCapture,
}: {
  value?: string;
  onCapture: (base64: string) => void;
}) {
  const { t } = useLanguage();
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  const startCamera = async () => {
    setError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 800 } },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch (err: any) {
      setError(
        err?.name === "NotAllowedError"
          ? "Camera blocked. Allow access or upload a photo."
          : "Camera unavailable. Upload a photo instead.",
      );
    }
  };

  // Attach stream once the <video> mounts.
  useEffect(() => {
    if (cameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  }, [cameraActive]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const capture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 640;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    onCapture(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
  };

  const onUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => onCapture(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Has a photo already? Show preview + retake. ──
  if (value && !cameraActive) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-xs aspect-square overflow-hidden rounded-none border-2 border-[#b45309]/40 shadow-md bg-[#1a1a1a]">
          <img src={value} alt="captured product" className="w-full h-full object-cover" />
          <span className="absolute top-2 left-2 bg-[#15803d] text-white text-[9px] uppercase px-2 py-1 font-sans font-bold tracking-wider">
            ✓ Ready
          </span>
        </div>
        <button
          onClick={startCamera}
          className="flex items-center gap-2 text-xs font-sans font-bold uppercase tracking-wider text-[#1a1a1a]/70 hover:text-[#b45309]"
        >
          <RefreshCw className="h-4 w-4" /> {t("onboard.step.photo.retake")}
        </button>
      </div>
    );
  }

  // ── Live camera view. ──
  if (cameraActive) {
    return (
      <div className="w-full max-w-xs mx-auto">
        <div className="relative aspect-square overflow-hidden rounded-none border border-white/20 bg-black shadow-md">
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 border-4 border-[#b45309]/70 m-4 pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 p-3 bg-black/70 backdrop-blur-sm flex gap-2">
            <button
              onClick={capture}
              className="flex-1 flex items-center justify-center gap-2 bg-[#b45309] hover:bg-[#92400e] text-white py-2.5 text-xs uppercase tracking-wider font-bold"
            >
              <Camera className="h-4 w-4" /> {t("onboard.step.photo.cta")}
            </button>
            <button
              onClick={stopCamera}
              className="bg-white/10 hover:bg-white/20 text-white p-2.5 border border-white/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        {error && <p className="text-[10px] text-red-500 mt-2 text-center">{error}</p>}
      </div>
    );
  }

  // ── Idle: pick camera or upload. ──
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        <button
          onClick={startCamera}
          className="flex flex-col items-center justify-center gap-2 aspect-square border-2 border-dashed border-[#1a1a1a]/25 bg-white hover:border-[#b45309] hover:bg-[#b45309]/5 transition-all"
        >
          <Camera className="h-9 w-9 text-[#1a1a1a]/60" />
          <span className="text-xs font-sans font-bold text-[#1a1a1a]/70 uppercase tracking-wider">
            Camera
          </span>
        </button>
        <label className="flex flex-col items-center justify-center gap-2 aspect-square border-2 border-dashed border-[#1a1a1a]/25 bg-white hover:border-[#b45309] hover:bg-[#b45309]/5 transition-all cursor-pointer">
          <Upload className="h-9 w-9 text-[#1a1a1a]/60" />
          <span className="text-xs font-sans font-bold text-[#1a1a1a]/70 uppercase tracking-wider">
            Upload
          </span>
          <input type="file" accept="image/*" className="hidden" onChange={onUpload} />
        </label>
      </div>
      {error && <p className="text-[10px] text-red-500 text-center">{error}</p>}
    </div>
  );
}
