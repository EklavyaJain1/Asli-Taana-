/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Clipboard, Check, Printer, Layers, FileCheck, QrCode, Download,
  Camera, X, Upload, Image as ImageIcon, User, Plus
} from "lucide-react";
import QRCode from "qrcode";
import html2canvas from "html2canvas";

interface RegisterFormProps {
  onRegisterSuccess: (newSaree: any) => void;
}

const PRESET_THEMES = [
  { name: "Kanjeevaram", colors: ["#cc0000", "#ffcc00"] },
  { name: "Banarasi", colors: ["#ff007f", "#c0c0c0", "#ffd700"] },
  { name: "Chanderi", colors: ["#f5f5dc", "#d4af37", "#8da399"] },
  { name: "Paithani", colors: ["#005a5b", "#ff00ff", "#ff8c00"] },
  { name: "Patola", colors: ["#800000", "#000080", "#ffffff"] },
];

const COLOR_SHADES: Record<string, string[]> = {
  red: ["#ffcccc", "#ff6666", "#cc0000", "#990000", "#660000"],
  blue: ["#cce5ff", "#66b2ff", "#0066cc", "#004080", "#00264d"],
  green: ["#d4edda", "#77dd77", "#28a745", "#155d27", "#0f3e1a"],
  yellow: ["#fff3cd", "#ffeb3b", "#ffc107", "#ff9800", "#e65100"],
  pink: ["#f8d7da", "#ffb6c1", "#ff69b4", "#d81b60", "#880e4f"],
  purple: ["#e2d9f3", "#b39ddb", "#673ab7", "#4527a0", "#311b92"],
  orange: ["#ffe5b4", "#ffb347", "#ff8c00", "#e65100", "#bf360c"],
  gold: ["#fff8e1", "#ffe082", "#ffd700", "#d4af37", "#b8860b"],
  silver: ["#f8f9fa", "#e9ecef", "#ced4da", "#adb5bd", "#6c757d"],
  black: ["#4a4a4a", "#333333", "#1a1a1a", "#000000", "#0a0a0a"],
  white: ["#ffffff", "#f5f5f5", "#ebebeb", "#e0e0e0", "#d6d6d6"],
};

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
  
  // Advanced Colors
  const [colors, setColors] = useState<string[]>(["#d2b48c", "#d4af37"]);
  const [colorInput, setColorInput] = useState("");
  const [suggestedShades, setSuggestedShades] = useState<string[]>([]);
  
  // Headshot & Master Fingerprint
  const [weaverPhoto, setWeaverPhoto] = useState<string>("");
  const [referenceFingerprint, setReferenceFingerprint] = useState<string>("");

  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredSaree, setRegisteredSaree] = useState<any | null>(null);
  
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const certRef = useRef<HTMLDivElement>(null);

  // --- Camera States ---
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Generate real QR code with JSON data after successful registration
  useEffect(() => {
    if (!registeredSaree?.id) return;
    
    const qrData = JSON.stringify({
      id: registeredSaree.id,
      weaver: registeredSaree.weaverName,
      type: registeredSaree.patternType,
      date: registeredSaree.registeredDate,
      price: registeredSaree.price,
      url: `${window.location.origin}/?id=${registeredSaree.id}`
    });

    QRCode.toDataURL(qrData, {
      width: 200,
      margin: 1,
      color: { dark: "#1a1a1a", light: "#ffffff" },
      errorCorrectionLevel: "L", // Keep dense but small
    }).then(setQrCodeDataUrl).catch(console.error);
  }, [registeredSaree]);

  // ── Color Input Handler ───────────────────────────────────────────────────
  const handleColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setColorInput(val);
    const lowerVal = val.toLowerCase().trim();
    
    if (COLOR_SHADES[lowerVal]) {
      setSuggestedShades(COLOR_SHADES[lowerVal]);
    } else if (/^#[0-9A-Fa-f]{6}$/i.test(lowerVal)) {
      setColors([...colors, lowerVal]);
      setColorInput("");
      setSuggestedShades([]);
    } else {
      setSuggestedShades([]);
    }
  };

  const addShade = (shade: string) => {
    setColors([...colors, shade]);
    setColorInput("");
    setSuggestedShades([]);
  };

  const removeColor = (index: number) => {
    setColors(colors.filter((_, i) => i !== index));
  };

  // ── File Uploads ──────────────────────────────────────────────────────────
  const handleWeaverPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setWeaverPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFingerprintUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setReferenceFingerprint(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Camera Helpers ────────────────────────────────────────────────────────
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

  // ── Submit Registration ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceFingerprint || cameraActive) {
      alert("Please capture or upload the Master Fingerprint Photo (Macro shot) before registering.");
      return;
    }
    
    setIsRegistering(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weaverName, weaverAge, weaverBio, village, cooperative,
          material, daysOfLabor, price, patternType,
          colors, weaverPhoto, referencePhoto: referenceFingerprint
        }),
      });

      if (!response.ok) throw new Error("Registration failed.");

      const newSaree = await response.json();
      const completedSaree = { ...newSaree, referencePhoto: referenceFingerprint, weaverPhoto };
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

  const handleDownloadCertificate = async () => {
    if (!certRef.current || !registeredSaree) return;
    try {
      const canvas = await html2canvas(certRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = imgData;
      a.download = `AsliTaana-Certificate-${registeredSaree.id}.png`;
      a.click();
    } catch (err) {
      console.error("Failed to generate certificate image", err);
      alert("Failed to download certificate.");
    }
  };

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
          <div>
            <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">Artisan Cooperative Registrar</h3>
            <p className="text-[11px] text-[#1a1a1a]/60 font-sans uppercase tracking-wider mt-0.5">
              Securely register handwoven garments and generate uncopiable thread fingerprints
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaver Name *</label>
              <input type="text" required
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={weaverName} onChange={(e) => setWeaverName(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Headshot Photo</label>
              <label className="w-full h-[42px] flex items-center justify-center bg-white border border-[#1a1a1a]/20 cursor-pointer hover:bg-stone-50 transition-colors">
                {weaverPhoto ? <Check className="h-4 w-4 text-green-600" /> : <User className="h-4 w-4 text-[#1a1a1a]/50" />}
                <span className="ml-2 text-xs font-serif text-[#1a1a1a]/70">{weaverPhoto ? "Uploaded" : "Upload"}</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleWeaverPhotoUpload} />
              </label>
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

          {/* Advanced Color Picker */}
          <div className="bg-white p-5 rounded-none border border-[#1a1a1a]/15 mt-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]">Garment Color Palette</h4>
            </div>
            
            {/* Active Colors */}
            <div className="flex flex-wrap gap-2 mb-4">
              {colors.map((c, idx) => (
                <div key={idx} className="flex items-center gap-1.5 bg-[#f9f8f4] border border-[#1a1a1a]/15 pl-1.5 pr-1 py-1 rounded-none">
                  <div className="w-4 h-4 border border-[#1a1a1a]/20" style={{ backgroundColor: c }}></div>
                  <span className="text-[10px] font-mono text-[#1a1a1a]/80 uppercase">{c}</span>
                  <button type="button" onClick={() => removeColor(idx)} className="text-[#1a1a1a]/40 hover:text-red-500 ml-1"><X className="h-3 w-3" /></button>
                </div>
              ))}
            </div>

            {/* Input for Manual Entry */}
            <div className="flex gap-2 relative">
              <input type="text" placeholder="Enter color name (e.g. red) or #hexcode"
                className="flex-1 text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] font-mono"
                value={colorInput} onChange={handleColorInputChange} />
            </div>

            {/* Suggested Shades */}
            {suggestedShades.length > 0 && (
              <div className="mt-3 p-3 bg-stone-50 border border-stone-200">
                <span className="block text-[9px] font-sans uppercase tracking-wider text-[#1a1a1a]/50 mb-2">Select a shade:</span>
                <div className="flex gap-2">
                  {suggestedShades.map((shade, idx) => (
                    <button key={idx} type="button" onClick={() => addShade(shade)}
                      className="w-8 h-8 rounded-none border border-black/10 hover:border-black hover:scale-110 transition-all cursor-pointer shadow-sm"
                      style={{ backgroundColor: shade }} title={shade}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Default Presets */}
            <div className="mt-5 pt-4 border-t border-[#1a1a1a]/10">
              <span className="block text-[9px] font-sans uppercase tracking-wider text-[#1a1a1a]/50 mb-2">Or choose a traditional theme:</span>
              <div className="flex flex-wrap gap-2">
                {PRESET_THEMES.map((theme) => (
                  <button key={theme.name} type="button"
                    onClick={() => setColors(theme.colors)}
                    className="flex items-center gap-1.5 px-2 py-1.5 border border-[#1a1a1a]/20 hover:border-[#1a1a1a] bg-white transition-colors">
                    <div className="flex">
                      {theme.colors.slice(0,3).map((c, i) => (
                        <div key={i} className="w-2.5 h-2.5 rounded-full -ml-1 border border-white" style={{ backgroundColor: c, zIndex: 3-i }}></div>
                      ))}
                    </div>
                    <span className="text-[10px] font-sans font-bold text-[#1a1a1a]">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button type="submit" disabled={isRegistering || cameraActive || !referenceFingerprint}
            className="w-full mt-auto bg-[#1a1a1a] hover:bg-[#b45309] text-white font-sans font-bold text-xs uppercase tracking-[0.2em] py-3.5 px-4 rounded-none border border-[#1a1a1a] transition-all disabled:opacity-50 shadow-xs">
            {isRegistering ? "Uploading structural fingerprint..." : "Register Saree & Generate Certificate"}
          </button>
        </form>
      </div>

      {/* Right Panel */}
      <div className="lg:col-span-5 flex flex-col gap-6">

        {/* Live Camera OR Upload Monitor */}
        <div className="bg-[#1a1a1a] text-white rounded-none p-6 border border-[#1a1a1a] flex flex-col items-center text-center">
          <span className="text-[10px] font-sans tracking-[0.2em] text-[#b45309] font-bold uppercase mb-4">
            MASTER FINGERPRINT CAPTURE (MANDATORY)
          </span>

          {cameraActive ? (
            /* LIVE CAMERA VIEW */
            <div className="w-full border border-white/20 shadow-2xl bg-black rounded-none overflow-hidden relative">
              <video ref={videoRef} autoPlay playsInline muted className="w-full aspect-square object-cover" />
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
                  <Camera className="h-4 w-4" /> Capture Macro
                </button>
                <button onClick={stopCamera} type="button"
                  className="bg-white/10 hover:bg-white/20 text-white font-sans font-bold text-xs uppercase tracking-wider py-2.5 px-3 rounded-none flex items-center justify-center transition-colors border border-white/20">
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            /* PREVIEW VIEW */
            <>
              <div className="relative h-48 w-48 rounded-none overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center bg-black group">
                {referenceFingerprint ? (
                  <>
                    <img src={referenceFingerprint} alt="Thread Fingerprint Monitor" className="h-full w-full object-cover select-none" />
                    <div className="absolute top-1 left-1 bg-green-700 text-white text-[8px] uppercase px-1.5 py-0.5 font-bold font-sans flex items-center gap-1">
                      <Check className="h-2.5 w-2.5" /> Fingerprint Ready
                    </div>
                  </>
                ) : (
                  <div className="text-stone-500 text-xs font-mono text-center px-4">Camera capture or macro photo upload required</div>
                )}

                {/* Hover overlay to retake */}
                {referenceFingerprint && (
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
                  <Upload className="h-3.5 w-3.5" /> Upload Photo
                  <input type="file" accept="image/*" className="hidden" onChange={handleFingerprintUpload} />
                </label>
              </div>

              {!referenceFingerprint && (
                <div className="w-full text-center mt-3 text-[10px] text-red-400 font-sans uppercase tracking-widest font-bold animate-pulse">
                  Missing Master Fingerprint
                </div>
              )}
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
          <div className="flex flex-col gap-3">
            <div className="flex justify-end gap-2">
              <button onClick={handleDownloadCertificate} type="button"
                className="text-[10px] bg-[#1a1a1a] text-white hover:bg-[#b45309] px-3 py-2 rounded-none border border-[#1a1a1a] uppercase tracking-wider font-sans font-bold transition-colors flex items-center gap-1 shadow-xs">
                <Download className="h-3.5 w-3.5" /> Download Certificate Image
              </button>
              <button onClick={handlePrint} type="button"
                className="text-[10px] bg-white text-[#1a1a1a] border border-[#1a1a1a]/20 hover:bg-stone-100 px-3 py-2 rounded-none uppercase tracking-wider font-sans font-bold transition-colors flex items-center gap-1 shadow-xs">
                <Printer className="h-3.5 w-3.5" /> Print
              </button>
            </div>

            {/* The Certificate Element (to be downloaded via html2canvas) */}
            <div ref={certRef} className="bg-[#f9f8f4] border-2 border-[#1a1a1a]/30 rounded-none p-6 shadow-sm flex flex-col gap-4 relative overflow-hidden">
              {/* Background watermark */}
              <div className="absolute inset-0 opacity-[0.03] pointer-events-none flex items-center justify-center">
                <Layers className="w-64 h-64 text-black" />
              </div>
              
              <div className="relative z-10 flex items-center justify-between">
                <span className="text-[9px] font-sans tracking-widest bg-[#b45309] text-white border border-[#b45309] px-2.5 py-1 rounded-none uppercase font-bold shadow-sm">
                  Artisan Registry Approved
                </span>
                <span className="text-[9px] font-mono text-[#1a1a1a]/50">ID: {registeredSaree.id}</span>
              </div>

              <div className="relative z-10 border-t-2 border-b-2 border-[#1a1a1a]/10 py-5 text-center mt-2">
                <h4 className="font-serif text-2xl font-bold text-[#1a1a1a]">Certificate of Authenticity</h4>
                <p className="text-[9px] text-[#1a1a1a]/60 uppercase tracking-widest font-sans font-bold mt-1.5">Asli Taana Saree Identity Registry</p>
              </div>

              <div className="relative z-10 flex gap-4 mt-2">
                {/* Artisan Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    {registeredSaree.weaverPhoto ? (
                      <img src={registeredSaree.weaverPhoto} alt="Artisan" className="w-12 h-12 object-cover border border-[#1a1a1a]/20 shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 bg-stone-200 border border-[#1a1a1a]/10 flex items-center justify-center">
                        <User className="h-5 w-5 text-stone-400" />
                      </div>
                    )}
                    <div>
                      <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Weaver Artisan</span>
                      <span className="font-bold text-[#1a1a1a] font-serif text-sm">{registeredSaree.weaverName}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs font-serif text-[#1a1a1a]/90">
                    <div>
                      <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Village / Cluster</span>
                      <span className="font-medium text-[#1a1a1a]">{registeredSaree.village}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Registered Date</span>
                      <span className="font-medium">{registeredSaree.registeredDate}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="block text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-sans font-bold">Cooperative Union</span>
                      <span className="font-medium text-[#1a1a1a]">{registeredSaree.cooperative}</span>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="w-[120px] shrink-0 border-l border-[#1a1a1a]/10 pl-4 flex flex-col items-center justify-center">
                  {qrCodeDataUrl ? (
                    <img src={qrCodeDataUrl} alt="QR Code" className="w-24 h-24 border border-[#1a1a1a]/10" />
                  ) : (
                    <div className="w-24 h-24 bg-stone-100 border border-[#1a1a1a]/10 flex items-center justify-center">
                      <QrCode className="h-6 w-6 text-stone-300" />
                    </div>
                  )}
                  <span className="text-[7px] text-[#1a1a1a]/60 uppercase tracking-widest font-bold mt-2 text-center w-full">Scan for Verified JSON Data</span>
                </div>
              </div>

              <div className="relative z-10 bg-white border border-[#1a1a1a]/15 p-3 flex flex-col gap-2 mt-2">
                <span className="block text-[8px] text-[#1a1a1a]/50 font-sans uppercase tracking-wider font-bold">Attached Garment Info</span>
                <p className="text-sm font-serif font-bold text-[#1a1a1a]">{registeredSaree.patternType}</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {registeredSaree.colors?.map((c: string, idx: number) => (
                    <div key={idx} className="w-3 h-3 border border-[#1a1a1a]/20" style={{ backgroundColor: c }} title={c}></div>
                  ))}
                </div>
              </div>

              <div className="relative z-10 text-[10px] font-serif text-center text-[#1a1a1a]/55 italic border-t border-[#1a1a1a]/10 pt-3 mt-1">
                &quot;By keeping this label intact, you preserve the real thread of Indian culture.&quot;
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-8 flex flex-col items-center justify-center text-center flex-1 min-h-[250px]">
            <FileCheck className="h-10 w-10 text-[#1a1a1a]/40 stroke-[1.5] mb-3" />
            <p className="font-serif text-[#1a1a1a] font-bold text-base">Awaiting Registration</p>
            <p className="text-xs text-[#1a1a1a]/60 mt-1 max-w-xs leading-relaxed font-serif">
              Fill out the artisan form, capture the master fingerprint, and click &quot;Register Saree&quot; to compile your structural fingerprint and print certificates.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
