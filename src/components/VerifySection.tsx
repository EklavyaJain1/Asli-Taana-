/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { generateFabricDataUrl } from "../utils/fabricGenerator";
import {
  ShieldAlert, ShieldCheck, Loader2, Upload, Eye, EyeOff,
  Camera, CameraOff, RefreshCw, X
} from "lucide-react";

interface Saree {
  id: string;
  weaverName: string;
  weaverAge: number;
  weaverBio: string;
  village: string;
  cooperative: string;
  material: string;
  daysOfLabor: number;
  price: number;
  patternType: string;
  registeredDate: string;
  patternStyle: "cotton" | "silk" | "kasavu" | "paithani";
  mainColor: string;
  accentColor: string;
  seed: number;
  referencePhoto?: string;
}

interface VerifySectionProps {
  sarees: Saree[];
  currentSareeId?: string;
}

export default function VerifySection({ sarees, currentSareeId }: VerifySectionProps) {
  const [selectedSareeId, setSelectedSareeId] = useState("");
  const [selectedSaree, setSelectedSaree] = useState<Saree | null>(null);
  const [referencePhoto, setReferencePhoto] = useState<string>("");
  const [shopperPhoto, setShopperPhoto] = useState<string>("");
  const [scanPresetType, setScanPresetType] = useState<"matching" | "powerloom" | "different" | "custom">("matching");

  // AI state
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [revealFingerprints, setRevealFingerprints] = useState(true);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Set initial selection from prop or first saree
  useEffect(() => {
    if (sarees.length > 0) {
      const initialId = currentSareeId || sarees[0].id;
      setSelectedSareeId(initialId);
    }
  }, [sarees, currentSareeId]);

  // Sync active saree details
  useEffect(() => {
    const found = sarees.find((s) => s.id === selectedSareeId);
    if (found) {
      setSelectedSaree(found);
      setVerificationResult(null);
    }
  }, [selectedSareeId, sarees]);

  // Generate fabric images when saree or scan type changes
  useEffect(() => {
    if (!selectedSaree) return;

    if (selectedSaree.referencePhoto && selectedSaree.referencePhoto.startsWith("data:image")) {
      // Use real camera capture from registration
      setReferencePhoto(selectedSaree.referencePhoto);
    } else {
      // Fallback to procedural generation for seed data
      const refUrl = generateFabricDataUrl({
        type: "handloom",
        mainColor: selectedSaree.mainColor,
        accentColor: selectedSaree.accentColor,
        patternStyle: selectedSaree.patternStyle,
        seed: selectedSaree.seed,
        rotation: 0,
        lighting: "neutral",
        cameraNoise: false,
      });
      setReferencePhoto(refUrl);
    }

    if (scanPresetType === "matching") {
      setShopperPhoto(generateFabricDataUrl({
        type: "handloom",
        mainColor: selectedSaree.mainColor,
        accentColor: selectedSaree.accentColor,
        patternStyle: selectedSaree.patternStyle,
        seed: selectedSaree.seed,
        rotation: 4,
        lighting: "shop_warm",
        cameraNoise: true,
      }));
    } else if (scanPresetType === "powerloom") {
      setShopperPhoto(generateFabricDataUrl({
        type: "powerloom",
        mainColor: selectedSaree.mainColor,
        accentColor: selectedSaree.accentColor,
        patternStyle: selectedSaree.patternStyle,
        seed: selectedSaree.seed,
        rotation: 0,
        lighting: "shop_warm",
        cameraNoise: true,
      }));
    } else if (scanPresetType === "different") {
      setShopperPhoto(generateFabricDataUrl({
        type: "handloom",
        mainColor: "#228b22",
        accentColor: "#ffd700",
        patternStyle: "cotton",
        seed: 9912,
        rotation: -3,
        lighting: "shop_warm",
        cameraNoise: true,
      }));
    }
    // "custom" — don't overwrite, user supplied it
  }, [selectedSaree, scanPresetType]);

  // Loading step ticker
  useEffect(() => {
    if (!isVerifying) return;
    const interval = setInterval(() => {
      setLoadingStep((prev) => (prev >= 3 ? 3 : prev + 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [isVerifying]);

  // ── Camera helpers ──────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 640 }, height: { ideal: 640 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
      setScanPresetType("custom");
    } catch (err: any) {
      setCameraError(err.name === "NotAllowedError"
        ? "Camera permission denied. Please allow camera access in your browser."
        : "Could not start camera. Please use the file upload option instead.");
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  // Stop camera on unmount
  useEffect(() => () => stopCamera(), [stopCamera]);

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d")?.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setShopperPhoto(dataUrl);
    stopCamera();
  };

  // File upload
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setShopperPhoto(reader.result as string);
      setScanPresetType("custom");
    };
    reader.readAsDataURL(file);
  };

  // Run verification
  const runVerification = async () => {
    if (!selectedSaree) return;
    setIsVerifying(true);
    setLoadingStep(0);
    setVerificationResult(null);

    try {
      const response = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sareeId: selectedSaree.id,
          referencePhoto,
          shopperPhoto,
          scanType: scanPresetType,
          weaverName: selectedSaree.weaverName,
        }),
      });

      if (!response.ok) throw new Error("Verification failed");
      const result = await response.json();
      setVerificationResult(result);
    } catch (err) {
      console.error(err);
      alert("Verification failed. Please ensure the server is running.");
    } finally {
      setIsVerifying(false);
    }
  };

  const loadingMessages = [
    "Locating registered weave fingerprint on Secure Database...",
    "Scanning shopper photo and evaluating thread slubs...",
    "Cross-referencing warp & weft tension variances via Gemini Multimodal...",
    "Finalizing structural textile match analysis reports...",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* ── Left: Saree identity panel ──────────────────────────────────── */}
      <div className="lg:col-span-5 flex flex-col gap-6">

        {/* Step 1 */}
        <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-6 shadow-xs">
          <span className="text-[9px] font-sans font-bold tracking-widest text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 px-3 py-1.5 rounded-none uppercase">
            Step 1: Scan Label or Select ID
          </span>
          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] mt-5 mb-4">Claimed Saree Identity</h3>

          <div className="mb-4">
            <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]/60 mb-1.5">Active Saree ID (QR Target)</label>
            <select
              className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-3 bg-[#f9f8f4] text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
              value={selectedSareeId}
              onChange={(e) => setSelectedSareeId(e.target.value)}>
              {sarees.map((s) => (
                <option key={s.id} value={s.id}>{s.id} — {s.weaverName} ({s.village})</option>
              ))}
            </select>
          </div>

          {selectedSaree && (
            <div className="space-y-4 border-t border-[#1a1a1a]/10 pt-4 font-serif text-[#1a1a1a]/95 text-xs md:text-sm">
              <div className="flex justify-between items-start gap-4">
                <div>
                  <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/45">Claimed Pattern Type</span>
                  <p className="font-serif font-bold text-base text-[#1a1a1a] mt-1">{selectedSaree.patternType}</p>
                </div>
                <div className="text-right">
                  <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/45">Fair Trade Value</span>
                  <p className="font-mono font-bold text-[#b45309] text-base mt-1">₹{selectedSaree.price.toLocaleString("en-IN")}</p>
                </div>
              </div>

              <div className="pb-2">
                <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/45">Registered Master Artisan</span>
                <p className="font-bold text-[#1a1a1a] mt-1">{selectedSaree.weaverName}, {selectedSaree.weaverAge} yrs</p>
                <p className="text-[#1a1a1a]/70 italic text-xs mt-1 leading-relaxed">&quot;{selectedSaree.weaverBio}&quot;</p>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#1a1a1a]/10 pt-4">
                <div>
                  <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/45">Village Cluster</span>
                  <p className="font-bold text-[#1a1a1a] mt-0.5">{selectedSaree.village}</p>
                </div>
                <div>
                  <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/45">Artisan Labor</span>
                  <p className="font-bold text-[#1a1a1a] mt-0.5">{selectedSaree.daysOfLabor} days</p>
                </div>
                <div className="col-span-2 border-t border-[#1a1a1a]/5 pt-2.5">
                  <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/45">Registered Cooperative Union</span>
                  <p className="font-bold text-[#1a1a1a] mt-0.5">{selectedSaree.cooperative}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Reference fingerprint preview */}
        {selectedSaree && revealFingerprints && (
          <div className="bg-[#1a1a1a] text-white rounded-none p-6 border border-[#1a1a1a] flex flex-col items-center">
            <span className="text-[9px] font-sans font-bold text-[#b45309] uppercase tracking-widest mb-3.5">
              Registered Reference Fingerprint
            </span>
            <div className="relative h-44 w-44 rounded-none overflow-hidden border border-white/10 bg-black/40 p-1">
              <img src={referencePhoto} alt="Registered Pattern" className="h-full w-full object-cover" />
            </div>
            <p className="text-[10px] text-white/60 mt-3 font-mono text-center leading-relaxed">
              Micro-lens weave coordinate tag.<br />
              Coordinate Seed: <span className="text-[#b45309] font-bold">{selectedSaree.seed}</span> (Handloom)
            </p>
          </div>
        )}
      </div>

      {/* ── Right: Scan + AI results ─────────────────────────────────────── */}
      <div className="lg:col-span-7 bg-white border border-[#1a1a1a]/15 rounded-none p-6 shadow-xs flex flex-col gap-6">

        {/* Step 2 */}
        <div>
          <span className="text-[9px] font-sans font-bold tracking-widest text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 px-3 py-1.5 rounded-none uppercase">
            Step 2: Simulate or Capture Retail Store Scan
          </span>
          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] mt-5 mb-4">Fresh Shop Scan</h3>

          {/* Scan preset buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            {[
              { key: "matching", label: "Genuine", desc: "Authentic registered handwoven saree.", dot: "#137333" },
              { key: "powerloom", label: "Powerloom Clone", desc: "Counterfeit: machine grid lines.", dot: "#c5221f" },
              { key: "different", label: "Different Saree", desc: "Scan of a completely different weaver.", dot: "#b45309" },
            ].map(({ key, label, desc, dot }) => (
              <button key={key} type="button"
                className={`p-3.5 rounded-none border flex flex-col items-start gap-1.5 transition-all text-left ${
                  scanPresetType === key
                    ? key === "matching" ? "bg-[#eefcf3] border-2 border-[#137333] text-[#137333]"
                    : key === "powerloom" ? "bg-[#fff0f1] border-2 border-[#c5221f] text-[#c5221f]"
                    : "bg-[#fff8e1] border-2 border-[#b45309] text-[#b45309]"
                    : "bg-[#f9f8f4] border border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5"
                }`}
                onClick={() => setScanPresetType(key as any)}>
                <span className="text-xs font-bold font-serif flex items-center gap-1.5 uppercase tracking-wide">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: dot }}></span>
                  {label}
                </span>
                <span className="text-[10px] text-[#1a1a1a]/60 leading-relaxed font-serif">{desc}</span>
              </button>
            ))}
          </div>

          {/* Side-by-side comparison */}
          <div className="grid grid-cols-2 gap-4 bg-[#f9f8f4] border border-[#1a1a1a]/10 p-5 rounded-none">
            <div className="flex flex-col items-center">
              <span className="text-[9px] font-sans font-bold text-[#1a1a1a]/50 uppercase tracking-widest mb-2.5">Registered Original</span>
              <div className="h-32 w-32 rounded-none overflow-hidden border border-[#1a1a1a]/15 bg-white p-0.5">
                <img src={referencePhoto} alt="Original Weave" className="h-full w-full object-cover" />
              </div>
            </div>

            <div className="flex flex-col items-center relative">
              <span className="text-[9px] font-sans font-bold text-[#1a1a1a]/50 uppercase tracking-widest mb-2.5">Retail Shop Photo</span>
              <div className="h-32 w-32 rounded-none overflow-hidden border border-[#1a1a1a]/15 relative bg-white p-0.5">
                {shopperPhoto ? (
                  <img src={shopperPhoto} alt="Shop Weave" className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full flex items-center justify-center text-xs text-[#1a1a1a]/40 font-serif">No Image</div>
                )}
                <label className="absolute bottom-1 right-1 bg-[#1a1a1a]/90 hover:bg-[#b45309] text-white p-1.5 rounded-none cursor-pointer transition-colors border border-[#1a1a1a] flex items-center justify-center" title="Upload image">
                  <Upload className="h-3.5 w-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* Camera capture section */}
          <div className="mt-4">
            {!cameraActive ? (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#1a1a1a]/60 font-serif italic">
                  {scanPresetType === "custom" ? "Custom input active — ready to verify." : "Simulation modes compile distinct mathematical geometries."}
                </span>
                <div className="flex items-center gap-3">
                  <button type="button"
                    className="text-[10px] text-[#b45309] hover:text-[#1a1a1a] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                    onClick={() => setRevealFingerprints(!revealFingerprints)}>
                    {revealFingerprints ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {revealFingerprints ? "Hide Master" : "Show Master"}
                  </button>
                  <button type="button"
                    className="text-[10px] bg-[#1a1a1a] hover:bg-[#b45309] text-white font-sans font-bold uppercase tracking-wider flex items-center gap-1.5 px-3 py-1.5 transition-colors rounded-none"
                    onClick={startCamera}>
                    <Camera className="h-3.5 w-3.5" /> Use Camera
                  </button>
                </div>
              </div>
            ) : (
              /* Live Camera UI */
              <div className="border border-[#1a1a1a]/20 rounded-none overflow-hidden bg-black">
                <div className="relative">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full max-h-64 object-cover" />
                  {/* Grid overlay for focusing */}
                  <div className="absolute inset-0 pointer-events-none" style={{
                    backgroundImage: "linear-gradient(rgba(180,83,9,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(180,83,9,0.2) 1px, transparent 1px)",
                    backgroundSize: "33.33% 33.33%",
                  }} />
                  <div className="absolute inset-0 border-2 border-[#b45309]/50 m-8 rounded-none pointer-events-none" />
                  <span className="absolute top-2 left-2 text-[9px] bg-[#b45309] text-white px-2 py-1 font-sans font-bold uppercase tracking-wider">
                    📷 LIVE — Point at fabric
                  </span>
                </div>
                <canvas ref={canvasRef} className="hidden" />
                <div className="flex gap-2 p-3 bg-[#1a1a1a]">
                  <button onClick={capturePhoto}
                    className="flex-1 bg-[#b45309] hover:bg-[#d97706] text-white font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-none flex items-center justify-center gap-2 transition-colors">
                    <Camera className="h-4 w-4" /> Capture Photo
                  </button>
                  <button onClick={stopCamera}
                    className="bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-4 rounded-none flex items-center justify-center gap-2 transition-colors">
                    <X className="h-4 w-4" /> Cancel
                  </button>
                </div>
              </div>
            )}
            {cameraError && (
              <p className="text-[10px] text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-none mt-2 font-sans">{cameraError}</p>
            )}
          </div>

          {/* Verify button */}
          <button type="button"
            disabled={isVerifying || !selectedSaree || cameraActive}
            className="w-full bg-[#1a1a1a] hover:bg-[#b45309] text-white font-sans font-bold text-xs uppercase tracking-widest py-3.5 px-4 rounded-none border border-[#1a1a1a] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-5 shadow-xs"
            onClick={runVerification}>
            {isVerifying ? (
              <><Loader2 className="h-4 w-4 animate-spin text-white" /> Comparing Weave Signatures...</>
            ) : (
              <><ShieldCheck className="h-4 w-4 text-white" /> Run AI Authenticity Engine (Gemini)</>
            )}
          </button>
        </div>

        {/* Verification Loading */}
        {isVerifying && (
          <div className="border border-[#1a1a1a]/15 bg-[#f9f8f4] p-6 rounded-none flex flex-col items-center text-center gap-4 animate-pulse">
            <Loader2 className="h-8 w-8 text-[#b45309] animate-spin" />
            <div>
              <h4 className="font-serif font-bold text-sm text-[#1a1a1a]">Asli Taana AI Matching Engine is processing...</h4>
              <p className="text-xs text-[#1a1a1a]/70 mt-1.5 font-mono">{loadingMessages[loadingStep]}</p>
            </div>
            <div className="w-full max-w-xs bg-[#1a1a1a]/10 h-1 rounded-none overflow-hidden">
              <div className="bg-[#b45309] h-full transition-all duration-1000 ease-out" style={{ width: `${(loadingStep + 1) * 25}%` }} />
            </div>
          </div>
        )}

        {/* Verification Result */}
        {verificationResult && !isVerifying && (
          <div className={`border-2 rounded-none p-6 shadow-xs flex flex-col gap-5 ${
            verificationResult.isMatch ? "bg-[#f4fbf7] border-[#137333]/30" : "bg-[#fdf3f4] border-[#c5221f]/30"
          }`}>

            <div className="flex items-start justify-between gap-4 border-b pb-4 border-[#1a1a1a]/10">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-none ${
                  verificationResult.isMatch
                    ? "bg-[#eefcf3] text-[#137333] border border-[#137333]/20"
                    : "bg-[#fff0f1] text-[#c5221f] border border-[#c5221f]/20"
                }`}>
                  {verificationResult.isMatch ? <ShieldCheck className="h-6 w-6 stroke-[2]" /> : <ShieldAlert className="h-6 w-6 stroke-[2]" />}
                </div>
                <div>
                  <h4 className={`font-serif text-lg font-bold ${verificationResult.isMatch ? "text-[#137333]" : "text-[#c5221f]"}`}>
                    {verificationResult.isMatch ? "Authentic Saree Verified" : "Authentication Alert / Mismatch"}
                  </h4>
                  <p className="text-xs text-[#1a1a1a]/60 font-mono mt-1">
                    Match Confidence Score: <span className="font-bold text-[#1a1a1a]">{verificationResult.matchScore}%</span>
                  </p>
                </div>
              </div>

              {/* Score circle */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg className="w-12 h-12" viewBox="0 0 36 36">
                  <path className="text-[#1a1a1a]/10" strokeWidth="3.5" stroke="currentColor" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                  <path className={verificationResult.isMatch ? "text-[#137333]" : "text-[#c5221f]"}
                    strokeDasharray={`${verificationResult.matchScore}, 100`}
                    strokeWidth="3.5" strokeLinecap="round" stroke="currentColor" fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                </svg>
                <span className="absolute text-xs font-bold font-mono text-[#1a1a1a]">{verificationResult.matchScore}%</span>
              </div>
            </div>

            {/* AI Reasoning */}
            <div className="bg-white p-4 rounded-none border border-[#1a1a1a]/10">
              <span className="text-[9px] font-sans font-bold text-[#1a1a1a]/55 uppercase tracking-widest">AI Visual Reasoning Report</span>
              <p className="text-xs md:text-sm text-[#1a1a1a] leading-relaxed font-serif mt-1.5">{verificationResult.reasoning}</p>
              {verificationResult.isDemoFallback && (
                <div className="mt-3 text-[9px] font-mono text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 p-2.5 rounded-none leading-normal">
                  ⚠️ Running in local simulation mode. Set a valid GEMINI_API_KEY to activate real visual AI analysis.
                </div>
              )}
            </div>

            {/* Detailed analysis */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { label: "1. Weave Structure", key: "weaveStructure" },
                { label: "2. Thread Tension", key: "threadTension" },
                { label: "3. Alignment Correction", key: "patternAlignment" },
              ].map(({ label, key }) => (
                <div key={key} className="bg-white border border-[#1a1a1a]/10 p-3.5 rounded-none text-xs">
                  <span className="block font-bold text-[#1a1a1a] font-serif mb-1">{label}</span>
                  <p className="text-[#1a1a1a]/70 leading-relaxed font-serif">{verificationResult.detailedAnalysis[key]}</p>
                </div>
              ))}
            </div>

            {/* Recommendation */}
            <div className={`p-4 rounded-none border flex items-center justify-between text-xs font-serif font-bold ${
              verificationResult.isMatch
                ? "bg-[#eefcf3] text-[#137333] border-[#137333]/20"
                : "bg-[#fff0f1] text-[#c5221f] border-[#c5221f]/20"
            }`}>
              <span>{verificationResult.recommendation}</span>
              {verificationResult.isMatch && (
                <span className="text-[9px] bg-[#137333] text-white font-sans font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-none">APPROVED</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
