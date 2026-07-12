/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { generateFabricDataUrl, GeneratorOptions } from "../utils/fabricGenerator";
import { ShieldAlert, ShieldCheck, HelpCircle, ArrowRight, Loader2, RefreshCw, Upload, Eye, EyeOff } from "lucide-react";

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
}

interface VerifySectionProps {
  sarees: Saree[];
  currentSareeId?: string;
}

export default function VerifySection({ sarees, currentSareeId }: VerifySectionProps) {
  const [selectedSareeId, setSelectedSareeId] = useState("");
  const [selectedSaree, setSelectedSaree] = useState<Saree | null>(null);
  
  // Photo states (base64 strings)
  const [referencePhoto, setReferencePhoto] = useState<string>("");
  const [shopperPhoto, setShopperPhoto] = useState<string>("");
  const [scanPresetType, setScanPresetType] = useState<"matching" | "powerloom" | "different" | "custom">("matching");

  // AI execution states
  const [isVerifying, setIsVerifying] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [verificationResult, setVerificationResult] = useState<any | null>(null);
  const [revealFingerprints, setRevealFingerprints] = useState(true);

  // Load registered sarees list
  useEffect(() => {
    if (sarees.length > 0) {
      const initialId = currentSareeId || sarees[0].id;
      setSelectedSareeId(initialId);
    }
  }, [sarees, currentSareeId]);

  // Sync active Saree selection details
  useEffect(() => {
    const found = sarees.find(s => s.id === selectedSareeId);
    if (found) {
      setSelectedSaree(found);
      setVerificationResult(null); // Reset when selection changes
    }
  }, [selectedSareeId, sarees]);

  // Automatically generate reference and shopper scan base64 photos when saree or scanPresetType changes
  useEffect(() => {
    if (!selectedSaree) return;

    // 1. Generate Reference Fingerprint (Exactly as registered)
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

    // 2. Generate simulated shop scan photo based on selection
    let shopUrl = "";
    if (scanPresetType === "matching") {
      // Same spot, handloom weave, but rotated slightly, warm overhead lighting, camera grain
      shopUrl = generateFabricDataUrl({
        type: "handloom",
        mainColor: selectedSaree.mainColor,
        accentColor: selectedSaree.accentColor,
        patternStyle: selectedSaree.patternStyle,
        seed: selectedSaree.seed,
        rotation: 4, // 4 degrees tilt
        lighting: "shop_warm",
        cameraNoise: true,
      });
    } else if (scanPresetType === "powerloom") {
      // Same colors, same pattern style, but powerloom machine weave structure (completely uniform, perfect grid)
      shopUrl = generateFabricDataUrl({
        type: "powerloom",
        mainColor: selectedSaree.mainColor,
        accentColor: selectedSaree.accentColor,
        patternStyle: selectedSaree.patternStyle,
        seed: selectedSaree.seed, // same seed parameters, but machine-grid overrides it
        rotation: 0,
        lighting: "shop_warm",
        cameraNoise: true,
      });
    } else if (scanPresetType === "different") {
      // Completely unrelated saree structure
      shopUrl = generateFabricDataUrl({
        type: "handloom",
        mainColor: "#228b22", // Forest green
        accentColor: "#ffd700", // Gold zari
        patternStyle: "cotton",
        seed: 9912, // different seed
        rotation: -3,
        lighting: "shop_warm",
        cameraNoise: true,
      });
    }

    if (scanPresetType !== "custom") {
      setShopperPhoto(shopUrl);
    }
  }, [selectedSaree, scanPresetType]);

  // Loading steps animation
  useEffect(() => {
    if (!isVerifying) return;
    
    const interval = setInterval(() => {
      setLoadingStep(prev => {
        if (prev >= 3) {
          clearInterval(interval);
          return 3;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isVerifying]);

  // Handle image upload
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

  // Run AI visual inspection comparison
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

      if (!response.ok) {
        throw new Error("Verification failed");
      }

      const result = await response.json();
      setVerificationResult(result);
    } catch (err) {
      console.error(err);
      alert("Verification failed. Please ensure the server is fully running.");
    } finally {
      setIsVerifying(false);
    }
  };

  const loadingMessages = [
    "Locating registered weave fingerprint on Secure Database...",
    "Scanning shopper photo and evaluating thread slubs...",
    "Cross-referencing warp & weft tension variances via Gemini Multimodal model...",
    "Finalizing structural textile match analysis reports..."
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Saree Claims Panel (Left Side, Col-span-5) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Step 1: Select Registered Item */}
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
              onChange={(e) => setSelectedSareeId(e.target.value)}
            >
              {sarees.map(s => (
                <option key={s.id} value={s.id}>
                  {s.id} — {s.weaverName} ({s.village})
                </option>
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
                <p className="text-[#1a1a1a]/70 italic text-xs mt-1 leading-relaxed">
                  &quot;{selectedSaree.weaverBio}&quot;
                </p>
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

        {/* Registered Reference Image preview */}
        {selectedSaree && revealFingerprints && (
          <div className="bg-[#1a1a1a] text-white rounded-none p-6 border border-[#1a1a1a] flex flex-col items-center">
            <span className="text-[9px] font-sans font-bold text-[#b45309] uppercase tracking-widest mb-3.5">
              Registered Reference Fingerprint
            </span>
            <div className="relative h-44 w-44 rounded-none overflow-hidden border border-white/10 bg-black/40 p-1">
              <img src={referencePhoto} alt="Registered Pattern" className="h-full w-full object-cover" />
            </div>
            <p className="text-[10px] text-white/60 mt-3 font-mono text-center leading-relaxed">
              Micro-lens weave coordinate tag.<br/>
              Coordinate Seed: <span className="text-[#b45309] font-bold">{selectedSaree.seed}</span> (Handloom)
            </p>
          </div>
        )}

      </div>

      {/* Shopper Scan & AI Results Panel (Right Side, Col-span-7) */}
      <div className="lg:col-span-7 bg-white border border-[#1a1a1a]/15 rounded-none p-6 shadow-xs flex flex-col gap-6">
        
        {/* Step 2: Fresh Scan Presets */}
        <div>
          <span className="text-[9px] font-sans font-bold tracking-widest text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 px-3 py-1.5 rounded-none uppercase">
            Step 2: Simulate Retail Store Scan
          </span>
          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] mt-5 mb-4">Fresh Shop Scan Selection</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
            
            <button
              type="button"
              className={`p-3.5 rounded-none border flex flex-col items-start gap-1.5 transition-all text-left ${
                scanPresetType === "matching"
                  ? "bg-[#eefcf3] border-2 border-[#137333] text-[#137333] shadow-xs"
                  : "bg-[#f9f8f4] border border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5"
              }`}
              onClick={() => setScanPresetType("matching")}
            >
              <span className="text-xs font-bold font-serif flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-none bg-[#137333] animate-pulse"></span>
                Genuine
              </span>
              <span className="text-[10px] text-[#1a1a1a]/60 leading-relaxed font-serif">
                Scan authentic registered handwoven saree. Organic weave tension.
              </span>
            </button>

            <button
              type="button"
              className={`p-3.5 rounded-none border flex flex-col items-start gap-1.5 transition-all text-left ${
                scanPresetType === "powerloom"
                  ? "bg-[#fff0f1] border-2 border-[#c5221f] text-[#c5221f] shadow-xs"
                  : "bg-[#f9f8f4] border border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5"
              }`}
              onClick={() => setScanPresetType("powerloom")}
            >
              <span className="text-xs font-bold font-serif flex items-center gap-1.5 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 rounded-none bg-[#c5221f]"></span>
                Powerloom Clone
              </span>
              <span className="text-[10px] text-[#1a1a1a]/60 leading-relaxed font-serif">
                Counterfeit barcode. Chemically precise machine grid lines.
              </span>
            </button>

            <button
              type="button"
              className={`p-3.5 rounded-none border flex flex-col items-start gap-1.5 transition-all text-left ${
                scanPresetType === "different"
                  ? "bg-[#fff8e1] border-2 border-[#b45309] text-[#b45309] shadow-xs"
                  : "bg-[#f9f8f4] border border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5"
              }`}
              onClick={() => setScanPresetType("different")}
            >
              <span className="text-xs font-bold font-serif uppercase tracking-wide">Different Saree</span>
              <span className="text-[10px] text-[#1a1a1a]/60 leading-relaxed font-serif">
                Scan of a completely different authentic weaver.
              </span>
            </button>

          </div>

          {/* Micro Visual side-by-side comparison pre-verification */}
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
                
                {/* Upload override overlay */}
                <label className="absolute bottom-1 right-1 bg-[#1a1a1a]/90 hover:bg-[#b45309] text-white p-1.5 rounded-none cursor-pointer transition-colors border border-[#1a1a1a] flex items-center justify-center">
                  <Upload className="h-3.5 w-3.5" />
                  <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
                </label>
              </div>
            </div>

          </div>

          <div className="flex justify-between items-center mt-3.5">
            <span className="text-[10px] text-[#1a1a1a]/60 font-serif italic">
              {scanPresetType === "custom" ? "Custom fabric upload active." : "Simulation modes compile distinct mathematical geometries."}
            </span>
            <button
              type="button"
              className="text-[10px] text-[#b45309] hover:text-[#1a1a1a] font-sans font-bold uppercase tracking-wider flex items-center gap-1.5"
              onClick={() => setRevealFingerprints(!revealFingerprints)}
            >
              {revealFingerprints ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {revealFingerprints ? "Hide Master" : "Show Master"}
            </button>
          </div>

          {/* Trigger action button */}
          <button
            type="button"
            disabled={isVerifying || !selectedSaree}
            className="w-full bg-[#1a1a1a] hover:bg-[#b45309] text-white font-sans font-bold text-xs uppercase tracking-widest py-3.5 px-4 rounded-none border border-[#1a1a1a] transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-5 shadow-xs"
            onClick={runVerification}
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                Comparing Weave Signatures...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-white" />
                Run AI Authenticity Engine (Gemini)
              </>
            )}
          </button>
        </div>

        {/* Verification Loading Screen */}
        {isVerifying && (
          <div className="border border-[#1a1a1a]/15 bg-[#f9f8f4] p-6 rounded-none flex flex-col items-center text-center gap-4 animate-pulse">
            <Loader2 className="h-8 w-8 text-[#b45309] animate-spin" />
            <div>
              <h4 className="font-serif font-bold text-sm text-[#1a1a1a]">Asli Taana AI Matching Engine is processing...</h4>
              <p className="text-xs text-[#1a1a1a]/70 mt-1.5 font-mono">{loadingMessages[loadingStep]}</p>
            </div>
            
            {/* ProgressBar */}
            <div className="w-full max-w-xs bg-[#1a1a1a]/10 h-1 rounded-none overflow-hidden">
              <div 
                className="bg-[#b45309] h-full transition-all duration-1000 ease-out" 
                style={{ width: `${(loadingStep + 1) * 25}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Verification Result Output */}
        {verificationResult && !isVerifying && (
          <div className={`border-2 rounded-none p-6 shadow-xs flex flex-col gap-5 ${
            verificationResult.isMatch 
              ? "bg-[#f4fbf7] border-[#137333]/30" 
              : "bg-[#fdf3f4] border-[#c5221f]/30"
          }`}>
            
            {/* Headline matching badge */}
            <div className="flex items-start justify-between gap-4 border-b pb-4 border-[#1a1a1a]/10">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-none ${
                  verificationResult.isMatch ? "bg-[#eefcf3] text-[#137333] border border-[#137333]/20" : "bg-[#fff0f1] text-[#c5221f] border border-[#c5221f]/20"
                }`}>
                  {verificationResult.isMatch ? <ShieldCheck className="h-6 w-6 stroke-[2]" /> : <ShieldAlert className="h-6 w-6 stroke-[2]" />}
                </div>
                <div>
                  <h4 className={`font-serif text-lg font-bold ${
                    verificationResult.isMatch ? "text-[#137333]" : "text-[#c5221f]"
                  }`}>
                    {verificationResult.isMatch ? "Authentic Saree Verified" : "Authentication Alert / Mismatch"}
                  </h4>
                  <p className="text-xs text-[#1a1a1a]/60 font-mono mt-1">
                    Match Confidence Score: <span className="font-bold text-[#1a1a1a]">{verificationResult.matchScore}%</span>
                  </p>
                </div>
              </div>

              {/* Progress Circle/Score representer */}
              <div className="relative flex items-center justify-center">
                <svg className="w-12 h-12" viewBox="0 0 36 36">
                  <path
                    className="text-[#1a1a1a]/10"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={`${verificationResult.isMatch ? "text-[#137333]" : "text-[#c5221f]"}`}
                    strokeDasharray={`${verificationResult.matchScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <span className="absolute text-xs font-bold font-mono text-[#1a1a1a]">{verificationResult.matchScore}%</span>
              </div>
            </div>

            {/* AI Reasoning Text */}
            <div className="bg-white p-4 rounded-none border border-[#1a1a1a]/10">
              <span className="text-[9px] font-sans font-bold text-[#1a1a1a]/55 uppercase tracking-widest">AI Visual Reasoning Report</span>
              <p className="text-xs md:text-sm text-[#1a1a1a] leading-relaxed font-serif mt-1.5">
                {verificationResult.reasoning}
              </p>
              {verificationResult.isDemoFallback && (
                <div className="mt-3 text-[9px] font-mono text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 p-2.5 rounded-none leading-normal">
                  ⚠️ AI API Key is currently unconfigured or running on local simulation bounds. 
                  Provide your actual <strong>GEMINI_API_KEY</strong> under Secrets to run real visual evaluation model.
                </div>
              )}
            </div>

            {/* Detailed analysis tabs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              
              <div className="bg-white border border-[#1a1a1a]/10 p-3.5 rounded-none text-xs">
                <span className="block font-bold text-[#1a1a1a] font-serif mb-1">1. Weave Structure</span>
                <p className="text-[#1a1a1a]/70 leading-relaxed font-serif">{verificationResult.detailedAnalysis.weaveStructure}</p>
              </div>

              <div className="bg-white border border-[#1a1a1a]/10 p-3.5 rounded-none text-xs">
                <span className="block font-bold text-[#1a1a1a] font-serif mb-1">2. Thread Tension</span>
                <p className="text-[#1a1a1a]/70 leading-relaxed font-serif">{verificationResult.detailedAnalysis.threadTension}</p>
              </div>

              <div className="bg-white border border-[#1a1a1a]/10 p-3.5 rounded-none text-xs">
                <span className="block font-bold text-[#1a1a1a] font-serif mb-1">3. Alignment Correction</span>
                <p className="text-[#1a1a1a]/70 leading-relaxed font-serif">{verificationResult.detailedAnalysis.patternAlignment}</p>
              </div>

            </div>

            {/* Recommendation block */}
            <div className={`p-4 rounded-none border flex items-center justify-between text-xs font-serif font-bold ${
              verificationResult.isMatch 
                ? "bg-[#eefcf3] text-[#137333] border-[#137333]/20" 
                : "bg-[#fff0f1] text-[#c5221f] border-[#c5221f]/20"
            }`}>
              <span>{verificationResult.recommendation}</span>
              {verificationResult.isMatch && (
                <span className="text-[9px] bg-[#137333] text-white font-sans font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-none">
                  APPROVED
                </span>
              )}
            </div>

          </div>
        )}

      </div>

    </div>
  );
}

