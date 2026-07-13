/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { generateFabricDataUrl } from "../utils/fabricGenerator";
import {
  Clipboard, Check, Printer, Layers, RefreshCw, FileCheck, QrCode, Download,
  Camera, X, Upload, Image as ImageIcon
} from "lucide-react";
import QRCode from "qrcode";

interface RegisterFormProps {
  onRegisterSuccess: (newSaree: any) => void;
}

export default function RegisterForm({ onRegisterSuccess }: RegisterFormProps) {
  // Form states
  const [weaverName, setWeaverName] = useState("Rajendra Prasad");
  const [weaverAge, setWeaverAge] = useState(45);
  const [weaverBio, setWeaverBio] = useState("A skilled cotton and silk weaver preserving traditional jacquard techniques passed down through 4 generations.");
  const [village, setVillage] = useState("Chanderi");
  const [cooperative, setCooperative] = useState("Chanderi Handloom Weavers Union");
  const [material, setMaterial] = useState("Fine Mulberry Silk & Organic Cotton Blend (Chanderi)");
  const [daysOfLabor, setDaysOfLabor] = useState(9);
  const [price, setPrice] = useState(11200);
  const [patternType, setPatternType] = useState("Chanderi Golden Booti Saree");
  const [patternStyle, setPatternStyle] = useState<"cotton" | "silk" | "kasavu" | "paithani">("cotton");
  const [mainColor, setMainColor] = useState("#d2b48c");
  const [accentColor, setAccentColor] = useState("#d4af37");

  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredSaree, setRegisteredSaree] = useState<any | null>(null);
  
  const [referenceFingerprint, setReferenceFingerprint] = useState<string>("");
  const [seed, setSeed] = useState<number>(101);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // --- Camera & Capture Mode States ---
  const [captureMode, setCaptureMode] = useState<"generated" | "camera">("generated");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync colors when style preset changes
  useEffect(() => {
    if (patternStyle === "cotton") {
      setMainColor("#e3dac9");
      setAccentColor("#d4af37");
    } else if (patternStyle === "silk") {
      setMainColor("#4a0e2e");
      setAccentColor("#d4af37");
    } else if (patternStyle === "kasavu") {
      setMainColor("#fffcf7");
      setAccentColor("#d4af37");
    } else if (patternStyle === "paithani") {
      setMainColor("#005a5b");
      setAccentColor("#e65100");
    }
    setSeed(Math.floor(1000 + Math.random() * 9000));
  }, [patternStyle]);

  // Generate fabric texture preview ONLY if mode is generated
  useEffect(() => {
    if (captureMode !== "generated") return;

    const dataUrl = generateFabricDataUrl({
      type: "handloom",
      mainColor,
      accentColor,
      patternStyle,
      seed,
      rotation: 0,
      lighting: "neutral",
      cameraNoise: false,
    });
    setReferenceFingerprint(dataUrl);
  }, [mainColor, accentColor, patternStyle, seed, captureMode]);

  // Generate real QR code after successful registration
  useEffect(() => {
    if (!registeredSaree?.id) return;
    const verifyUrl = `${window.location.origin}/?id=${registeredSaree.id}`;
    QRCode.toDataURL(verifyUrl, {
      width: 200,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).then(setQrCodeDataUrl).catch(console.error);
  }, [registeredSaree?.id]);

  // ── Camera Helpers ────────────────────────────────────────────────────────
  const startCamera = async () => {
    setCameraError("");
    setCaptureMode("camera");
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
    } catch (err: any) {
      setCameraError(err.name === "NotAllowedError"
        ? "Camera permission denied. Please allow camera access."
        : "Could not start camera. Please upload a photo instead.");
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
    setReferenceFingerprint(dataUrl);
    stopCamera();
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setReferenceFingerprint(reader.result as string);
      setCaptureMode("camera");
    };
    reader.readAsDataURL(file);
  };

  // ── Submit Registration ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captureMode === "camera" && (!referenceFingerprint || cameraActive)) {
      alert("Please capture a photo before registering.");
      return;
    }
    
    setIsRegistering(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weaverName, weaverAge, weaverBio, village, cooperative,
          material, daysOfLabor, price, patternType, patternStyle,
          mainColor, accentColor, seed, referencePhoto: referenceFingerprint
        }),
      });

      if (!response.ok) throw new Error("Registration failed.");

      const newSaree = await response.json();
      // Keep the captured or generated photo on the frontend
      const completedSaree = { ...newSaree, referencePhoto: referenceFingerprint };
      setRegisteredSaree(completedSaree);
      onRegisterSuccess(completedSaree);
    } catch (err) {
      console.error(err);
      alert("Error registering the saree. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePrint = () => window.print();

  const handleCopyId = () => {
    if (!registeredSaree?.id) return;
    navigator.clipboard.writeText(registeredSaree.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrCodeDataUrl) return;
    const a = document.createElement("a");
    a.href = qrCodeDataUrl;
    a.download = `AsliTaana-QR-${registeredSaree?.id ?? "saree"}.png`;
    a.click();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

      {/* Registration Form — Left */}
      <div className="lg:col-span-7 bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-6 md:p-8 shadow-xs flex flex-col h-full">
        <div className="flex items-center gap-3.5 border-b border-[#1a1a1a]/10 pb-5 mb-6">
          <div className="bg-[#1a1a1a] text-white p-2.5 rounded-none border border-[#1a1a1a] flex items-center justify-center">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Artisan Cooperative Registrar</h3>
            <p className="text-[11px] text-[#1a1a1a]/60 font-sans uppercase tracking-wider mt-0.5">
              Securely register handwoven garments and generate uncopiable thread fingerprints
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaver Name *</label>
              <input type="text" required
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={weaverName} onChange={(e) => setWeaverName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaver Age (years)</label>
              <input type="number"
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={weaverAge} onChange={(e) => setWeaverAge(Number(e.target.value))} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaving Village/Cluster *</label>
              <input type="text" required
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={village} onChange={(e) => setVillage(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Cooperative Society *</label>
              <input type="text" required
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={cooperative} onChange={(e) => setCooperative(e.target.value)} />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Garment / Pattern Name *</label>
            <input type="text" required
              className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
              value={patternType} onChange={(e) => setPatternType(e.target.value)} />
          </div>

          <div>
            <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaver Background / Heritage Note</label>
            <textarea rows={2}
              className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all resize-none font-serif"
              value={weaverBio} onChange={(e) => setWeaverBio(e.target.value)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1">
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Material Blend</label>
              <input type="text"
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={material} onChange={(e) => setMaterial(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Days of Labor</label>
              <input type="number"
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={daysOfLabor} onChange={(e) => setDaysOfLabor(Number(e.target.value))} />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Fair Trade Value (₹)</label>
              <input type="number"
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={price} onChange={(e) => setPrice(Number(e.target.value))} />
            </div>
          </div>

          {/* Textile Type / Visual Preset */}
          <div className="bg-white p-5 rounded-none border border-[#1a1a1a]/15 mt-5">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]">Fallback AI Generation Style</h4>
              <span className="text-[9px] text-[#1a1a1a]/50 font-serif italic">Only used if no real camera photo is taken</span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {(["kasavu", "silk", "paithani", "cotton"] as const).map((style) => (
                <button key={style} type="button"
                  className={`text-xs p-2.5 rounded-none border text-center font-sans font-bold tracking-wider uppercase transition-all ${
                    patternStyle === style && captureMode === "generated"
                      ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                      : "bg-[#f9f8f4] border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-stone-50"
                  }`}
                  onClick={() => { setPatternStyle(style); setCaptureMode("generated"); }}>
                  {style === "kasavu" ? "Cream Kasavu" : style === "silk" ? "Deep Silk" : style === "paithani" ? "Teal Paithani" : "Tan Cotton"}
                </button>
              ))}
            </div>

            <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-[#1a1a1a]/10">
              <div className="flex-1 flex items-center gap-2">
                <label className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]">Base Thread:</label>
                <input type="color" className="w-7 h-7 border-0 p-0 cursor-pointer bg-transparent"
                  value={mainColor} onChange={(e) => { setMainColor(e.target.value); setCaptureMode("generated"); }} />
                <span className="text-xs font-mono text-[#1a1a1a]/60">{mainColor}</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <label className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]">Accent Thread:</label>
                <input type="color" className="w-7 h-7 border-0 p-0 cursor-pointer bg-transparent"
                  value={accentColor} onChange={(e) => { setAccentColor(e.target.value); setCaptureMode("generated"); }} />
                <span className="text-xs font-mono text-[#1a1a1a]/60">{accentColor}</span>
              </div>
              <button type="button"
                className="text-[10px] bg-[#1a1a1a] hover:bg-[#b45309] text-white uppercase tracking-wider font-sans font-bold px-3 py-1.5 rounded-none flex items-center justify-center gap-1.5 transition-all border border-[#1a1a1a]"
                onClick={() => { setSeed(Math.floor(1000 + Math.random() * 9000)); setCaptureMode("generated"); }}>
                <RefreshCw className="h-3.5 w-3.5" /> Re-Spin
              </button>
            </div>
          </div>

          <button type="submit" disabled={isRegistering || (captureMode === "camera" && cameraActive)}
            className="w-full mt-auto bg-[#1a1a1a] hover:bg-[#b45309] text-white font-sans font-bold text-xs uppercase tracking-[0.2em] py-3.5 px-4 rounded-none border border-[#1a1a1a] transition-all disabled:opacity-50 shadow-xs">
            {isRegistering ? "Uploading structural fingerprint..." : "Register Saree & Generate Fingerprint"}
          </button>
        </form>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-5 flex flex-col gap-6">

        {/* Live Camera OR Generated Monitor */}
        <div className="bg-[#1a1a1a] text-white rounded-none p-6 border border-[#1a1a1a] flex flex-col items-center text-center">
          <span className="text-[10px] font-sans tracking-[0.2em] text-[#b45309] font-bold uppercase mb-4">
            MASTER FINGERPRINT CAPTURE
          </span>

          {cameraActive ? (
            /* LIVE CAMERA VIEW */
            <div className="w-full border border-white/20 shadow-2xl bg-black rounded-none overflow-hidden relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-square object-cover" />
              {/* Grid overlay for focusing */}
              <div className="absolute inset-0 pointer-events-none" style={{
                backgroundImage: "linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)",
                backgroundSize: "33.33% 33.33%",
              }} />
              <div className="absolute inset-0 border-2 border-[#b45309]/80 m-6 rounded-none pointer-events-none" />
              <span className="absolute top-2 left-2 text-[9px] bg-[#b45309] text-white px-2 py-1 font-sans font-bold uppercase tracking-wider">
                📷 LIVE — Align Fabric
              </span>
              <canvas ref={canvasRef} className="hidden" />
              
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/70 backdrop-blur-sm flex gap-2">
                <button onClick={capturePhoto} type="button"
                  className="flex-1 bg-[#b45309] hover:bg-[#d97706] text-white font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-none flex items-center justify-center gap-2 transition-colors border border-[#d97706]">
                  <Camera className="h-4 w-4" /> Capture
                </button>
                <button onClick={stopCamera} type="button"
                  className="bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-none flex items-center justify-center transition-colors border border-white/20">
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            /* PREVIEW / GENERATED VIEW */
            <>
              <div className="relative h-48 w-48 rounded-none overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center bg-black group">
                {referenceFingerprint ? (
                  <>
                    <img src={referenceFingerprint} alt="Thread Fingerprint Monitor" className="h-full w-full object-cover select-none" />
                    {captureMode === "camera" && (
                      <div className="absolute top-1 left-1 bg-green-700 text-white text-[8px] uppercase px-1.5 py-0.5 font-bold font-sans flex items-center gap-1">
                        <Check className="h-2.5 w-2.5" /> Real Capture
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-stone-500 text-xs font-mono">Generating weave...</div>
                )}
                {/* Scanner effect (only if generated) */}
                {captureMode === "generated" && (
                  <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#b45309] to-transparent opacity-80 shadow-[0_0_8px_#b45309] animate-[pulse_2s_infinite]"></div>
                )}

                {/* Hover overlay to retake */}
                {captureMode === "camera" && (
                   <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                     <button type="button" onClick={startCamera} className="bg-white text-black px-3 py-1.5 text-[9px] uppercase font-bold font-sans flex items-center gap-1">
                       <Camera className="h-3 w-3" /> Retake
                     </button>
                   </div>
                )}
              </div>

              <div className="flex gap-2 w-full mt-5">
                <button type="button" onClick={startCamera}
                  className="flex-1 bg-white/10 hover:bg-[#b45309] text-white font-sans font-bold text-[10px] uppercase tracking-wider py-2.5 px-3 border border-white/20 transition-colors flex items-center justify-center gap-1.5">
                  <Camera className="h-3.5 w-3.5" /> Use Camera
                </button>
                <label className="flex-1 bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-[10px] uppercase tracking-wider py-2.5 px-3 border border-white/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer">
                  <Upload className="h-3.5 w-3.5" /> Upload File
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>

              <div className="w-full text-center mt-3 text-[10px] font-mono text-white/50">
                {captureMode === "generated" ? (
                  <>
                    <span className="text-[#b45309] uppercase font-sans font-bold mr-1">Seed:</span> {seed}{" "}
                    <span className="mx-1 text-white/20">|</span>{" "}
                    <span className="text-[#b45309] uppercase font-sans font-bold mr-1">Status:</span> Procedural Model
                  </>
                ) : (
                  <>
                    <span className="text-green-500 uppercase font-sans font-bold mr-1">Status:</span> Authentic Camera Capture
                  </>
                )}
              </div>
            </>
          )}

          {cameraError && (
             <p className="text-[10px] text-red-400 bg-red-900/30 border border-red-500/50 px-3 py-2 rounded-none mt-4 font-sans w-full">
               {cameraError}
             </p>
          )}
        </div>

        {/* Certificate output */}
        {registeredSaree ? (
          <div id="print-certificate" className="bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-6 shadow-xs flex flex-col gap-5 print:border-none print:bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-sans tracking-widest bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/30 px-2.5 py-0.5 rounded-none uppercase font-bold">
                Artisan Registry Approved
              </span>
              <button onClick={handlePrint} type="button"
                className="text-[9px] text-[#1a1a1a] hover:text-white bg-transparent hover:bg-[#1a1a1a] px-2.5 py-1 rounded-none border border-[#1a1a1a] uppercase tracking-wider font-sans font-bold transition-colors flex items-center gap-1 shadow-xs">
                <Printer className="h-3 w-3" /> Print Tag
              </button>
            </div>

            <div className="border-t border-b border-[#1a1a1a]/10 py-4 text-center">
              <h4 className="font-serif text-2xl font-bold text-[#1a1a1a]">Certificate of Authenticity</h4>
              <p className="text-[9px] text-[#1a1a1a]/60 uppercase tracking-widest font-sans font-bold mt-1">Asli Taana Saree Identity Registry</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-serif text-[#1a1a1a]/90">
              <div>
                <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Saree ID Code</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="font-mono font-bold text-[#b45309]">{registeredSaree.id}</span>
                  <button onClick={handleCopyId} type="button" className="text-[#1a1a1a]/40 hover:text-[#b45309] transition-colors">
                    {copied ? <Check className="h-3 w-3 text-green-600" /> : <Clipboard className="h-3 w-3" />}
                  </button>
                </div>
              </div>
              <div>
                <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Registered Date</span>
                <span className="font-medium">{registeredSaree.registeredDate}</span>
              </div>
              <div>
                <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Weaver Artisan</span>
                <span className="font-bold text-[#1a1a1a]">{registeredSaree.weaverName}</span>
              </div>
              <div>
                <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Village / Cluster</span>
                <span className="font-medium text-[#1a1a1a]">{registeredSaree.village}</span>
              </div>
              <div className="col-span-2 border-t border-[#1a1a1a]/10 pt-2">
                <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Cooperative Union</span>
                <span className="font-medium text-[#1a1a1a]">{registeredSaree.cooperative}</span>
              </div>
            </div>

            {/* Real QR Code */}
            <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-3.5 flex items-center justify-between gap-4 mt-2">
              <div className="flex-1">
                <span className="block text-[8px] text-[#1a1a1a]/50 font-sans uppercase tracking-wider font-bold">Attached Saree Label</span>
                <p className="text-sm font-serif font-bold text-[#1a1a1a] mt-0.5">{registeredSaree.patternType}</p>
                <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-[#b45309] mt-2">Scan QR to Verify</p>
                <button onClick={handleDownloadQR} type="button"
                  className="mt-2 text-[9px] flex items-center gap-1 text-[#1a1a1a]/50 hover:text-[#b45309] transition-colors font-sans font-bold uppercase tracking-wider">
                  <Download className="h-3 w-3" /> Save QR
                </button>
              </div>

              {qrCodeDataUrl ? (
                <div className="bg-white p-1.5 rounded-none border border-[#1a1a1a]/15 shadow-xs">
                  <img src={qrCodeDataUrl} alt={`QR code for ${registeredSaree.id}`} className="h-16 w-16" />
                </div>
              ) : (
                <div className="bg-[#f9f8f4] p-3 rounded-none border border-[#1a1a1a]/15 shadow-xs flex items-center justify-center h-16 w-16">
                  <QrCode className="h-8 w-8 text-[#1a1a1a]/30 animate-pulse" />
                </div>
              )}
            </div>

            <div className="text-[10px] font-serif text-center text-[#1a1a1a]/55 italic border-t border-[#1a1a1a]/10 pt-2.5">
              &quot;By keeping this label intact, you preserve the real thread of Indian culture.&quot;
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-8 flex flex-col items-center justify-center text-center flex-1 min-h-[250px]">
            <FileCheck className="h-10 w-10 text-[#1a1a1a]/40 stroke-[1.5] mb-3" />
            <p className="font-serif text-[#1a1a1a] font-bold text-base">Awaiting Registration</p>
            <p className="text-xs text-[#1a1a1a]/60 mt-1 max-w-xs leading-relaxed font-serif">
              Fill out the artisan form and click &quot;Register Saree&quot; to compile your structural fingerprint and print certificates.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
