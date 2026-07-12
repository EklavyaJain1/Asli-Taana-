/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { generateFabricDataUrl } from "../utils/fabricGenerator";
import { Clipboard, Check, Printer, Layers, RefreshCw, FileCheck } from "lucide-react";

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
  
  // Style selection for generating the procedural weave
  const [patternStyle, setPatternStyle] = useState<"cotton" | "silk" | "kasavu" | "paithani">("cotton");
  const [mainColor, setMainColor] = useState("#d2b48c"); // Tan cotton base
  const [accentColor, setAccentColor] = useState("#d4af37"); // Gold zari booti
  
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredSaree, setRegisteredSaree] = useState<any | null>(null);
  const [referenceFingerprint, setReferenceFingerprint] = useState<string>("");
  const [seed, setSeed] = useState<number>(101);

  // Sync colors when style preset changes
  useEffect(() => {
    if (patternStyle === "cotton") {
      setMainColor("#e3dac9"); // Bone color
      setAccentColor("#d4af37"); // Gold
    } else if (patternStyle === "silk") {
      setMainColor("#4a0e2e"); // Maroon/Burgundy
      setAccentColor("#d4af37"); // Gold
    } else if (patternStyle === "kasavu") {
      setMainColor("#fffcf7"); // Pure cream
      setAccentColor("#d4af37"); // Rich Kerala gold
    } else if (patternStyle === "paithani") {
      setMainColor("#005a5b"); // Deep Teal
      setAccentColor("#e65100"); // Peacock orange-gold
    }
    setSeed(Math.floor(1000 + Math.random() * 9000));
  }, [patternStyle]);

  // Generate fabric texture preview
  useEffect(() => {
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
  }, [mainColor, accentColor, patternStyle, seed]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRegistering(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weaverName,
          weaverAge,
          weaverBio,
          village,
          cooperative,
          material,
          daysOfLabor,
          price,
          patternType,
          patternStyle,
          mainColor,
          accentColor,
          seed,
        }),
      });

      if (!response.ok) {
        throw new Error("Registration failed.");
      }

      const newSaree = await response.json();
      
      // Inject the generated reference photo (drawn on canvas) in the returned data for client display
      const completedSaree = {
        ...newSaree,
        referencePhoto: referenceFingerprint
      };
      
      setRegisteredSaree(completedSaree);
      onRegisterSuccess(completedSaree);
    } catch (err) {
      console.error(err);
      alert("Error registering the saree. Please try again.");
    } finally {
      setIsRegistering(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Registration Form Left Side */}
      <div className="lg:col-span-7 bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-6 md:p-8 shadow-xs">
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Weaver Name */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaver Name *</label>
              <input
                type="text"
                required
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={weaverName}
                onChange={(e) => setWeaverName(e.target.value)}
              />
            </div>

            {/* Weaver Age */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaver Age (years)</label>
              <input
                type="number"
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={weaverAge}
                onChange={(e) => setWeaverAge(Number(e.target.value))}
              />
            </div>

          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Village Cluster */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaving Village/Cluster *</label>
              <input
                type="text"
                required
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
              />
            </div>

            {/* Cooperative */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Cooperative Society *</label>
              <input
                type="text"
                required
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={cooperative}
                onChange={(e) => setCooperative(e.target.value)}
              />
            </div>

          </div>

          {/* Saree Name / Pattern */}
          <div>
            <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Garment / Pattern Name *</label>
            <input
              type="text"
              required
              className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
              value={patternType}
              onChange={(e) => setPatternType(e.target.value)}
            />
          </div>

          {/* Saree Bio */}
          <div>
            <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Weaver Background / Heritage Note</label>
            <textarea
              rows={2}
              className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all resize-none font-serif"
              value={weaverBio}
              onChange={(e) => setWeaverBio(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Material */}
            <div className="md:col-span-1">
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Material Blend</label>
              <input
                type="text"
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              />
            </div>

            {/* Days of Labor */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Days of Labor</label>
              <input
                type="number"
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={daysOfLabor}
                onChange={(e) => setDaysOfLabor(Number(e.target.value))}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">Fair Trade Value (₹)</label>
              <input
                type="number"
                className="w-full text-sm border border-[#1a1a1a]/20 rounded-none p-2.5 bg-white text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>

          </div>

          {/* Textile Type / Visual Preset selector */}
          <div className="bg-white p-5 rounded-none border border-[#1a1a1a]/15 mt-5">
            <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-3">Thread Fingerprint Preset Style</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              
              <button
                type="button"
                className={`text-xs p-2.5 rounded-none border text-center font-sans font-bold tracking-wider uppercase transition-all ${
                  patternStyle === "kasavu"
                    ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                    : "bg-[#f9f8f4] border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-stone-50"
                }`}
                onClick={() => setPatternStyle("kasavu")}
              >
                Cream Kasavu
              </button>

              <button
                type="button"
                className={`text-xs p-2.5 rounded-none border text-center font-sans font-bold tracking-wider uppercase transition-all ${
                  patternStyle === "silk"
                    ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                    : "bg-[#f9f8f4] border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-stone-50"
                }`}
                onClick={() => setPatternStyle("silk")}
              >
                Deep Silk
              </button>

              <button
                type="button"
                className={`text-xs p-2.5 rounded-none border text-center font-sans font-bold tracking-wider uppercase transition-all ${
                  patternStyle === "paithani"
                    ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                    : "bg-[#f9f8f4] border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-stone-50"
                }`}
                onClick={() => setPatternStyle("paithani")}
              >
                Teal Paithani
              </button>

              <button
                type="button"
                className={`text-xs p-2.5 rounded-none border text-center font-sans font-bold tracking-wider uppercase transition-all ${
                  patternStyle === "cotton"
                    ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                    : "bg-[#f9f8f4] border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-stone-50"
                }`}
                onClick={() => setPatternStyle("cotton")}
              >
                Tan Cotton
              </button>

            </div>

            {/* Customizer overrides */}
            <div className="flex flex-col md:flex-row gap-4 mt-4 pt-4 border-t border-[#1a1a1a]/10">
              <div className="flex-1 flex items-center gap-2">
                <label className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]">Base Thread:</label>
                <input
                  type="color"
                  className="w-7 h-7 border-0 p-0 cursor-pointer bg-transparent"
                  value={mainColor}
                  onChange={(e) => setMainColor(e.target.value)}
                />
                <span className="text-xs font-mono text-[#1a1a1a]/60">{mainColor}</span>
              </div>
              <div className="flex-1 flex items-center gap-2">
                <label className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]">Accent Thread:</label>
                <input
                  type="color"
                  className="w-7 h-7 border-0 p-0 cursor-pointer bg-transparent"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                />
                <span className="text-xs font-mono text-[#1a1a1a]/60">{accentColor}</span>
              </div>
              <button
                type="button"
                className="text-[10px] bg-[#1a1a1a] hover:bg-[#b45309] text-white uppercase tracking-wider font-sans font-bold px-3 py-1.5 rounded-none flex items-center justify-center gap-1.5 transition-all border border-[#1a1a1a]"
                onClick={() => setSeed(Math.floor(1000 + Math.random() * 9000))}
              >
                <RefreshCw className="h-3.5 w-3.5" /> Re-Spin Seed
              </button>
            </div>

          </div>

          <button
            type="submit"
            disabled={isRegistering}
            className="w-full bg-[#1a1a1a] hover:bg-[#b45309] text-white font-sans font-bold text-xs uppercase tracking-[0.2em] py-3.5 px-4 rounded-none border border-[#1a1a1a] transition-all disabled:opacity-50 mt-6 shadow-xs"
          >
            {isRegistering ? "Uploading structural fingerprint..." : "Register Saree & Generate Fingerprint"}
          </button>

        </form>
      </div>

      {/* Registration Certificate / Digital tag Output Right Side */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        {/* Living Fingerprint Monitor Preview */}
        <div className="bg-[#1a1a1a] text-white rounded-none p-6 border border-[#1a1a1a] flex flex-col items-center">
          <span className="text-[10px] font-sans tracking-[0.2em] text-[#b45309] font-bold uppercase mb-4">
            HOLOGRAPHIC THREAD SCAN MONITOR
          </span>
          
          <div className="relative h-48 w-48 rounded-none overflow-hidden border border-white/20 shadow-2xl flex items-center justify-center bg-black">
            {referenceFingerprint ? (
              <img
                src={referenceFingerprint}
                alt="Thread Fingerprint Monitor"
                className="h-full w-full object-cover select-none"
              />
            ) : (
              <div className="text-stone-500 text-xs font-mono">Generating weave...</div>
            )}
            
            {/* Holographic scanner laser line effect in Editorial style */}
            <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[#b45309] to-transparent opacity-80 shadow-[0_0_8px_#b45309] animate-[pulse_2s_infinite]"></div>
          </div>

          <div className="w-full text-center mt-4 text-[10px] font-mono text-white/50">
            <span className="text-[#b45309] uppercase font-sans font-bold mr-1">Seed:</span> {seed} <span className="mx-1 text-white/20">|</span> <span className="text-[#b45309] uppercase font-sans font-bold mr-1">Variance:</span> Organic (Handloom)
          </div>
        </div>

        {/* Certificate output when successfully registered */}
        {registeredSaree ? (
          <div id="print-certificate" className="bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-6 shadow-xs flex flex-col gap-5 print:border-none print:bg-white">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-sans tracking-widest bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/30 px-2.5 py-0.5 rounded-none uppercase font-bold">
                Artisan Registry Approved
              </span>
              <button
                onClick={handlePrint}
                className="text-[9px] text-[#1a1a1a] hover:text-white bg-transparent hover:bg-[#1a1a1a] px-2.5 py-1 rounded-none border border-[#1a1a1a] uppercase tracking-wider font-sans font-bold transition-colors flex items-center gap-1 shadow-xs"
              >
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
                <span className="font-mono font-bold text-[#b45309]">{registeredSaree.id}</span>
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

            {/* Simulated Label Tags with QR */}
            <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-3.5 flex items-center justify-between gap-4 mt-2">
              <div className="flex-1">
                <span className="block text-[8px] text-[#1a1a1a]/50 font-sans uppercase tracking-wider font-bold">Attached Saree Label</span>
                <p className="text-sm font-serif font-bold text-[#1a1a1a] mt-0.5">{registeredSaree.patternType}</p>
                <p className="text-[10px] font-sans uppercase tracking-widest font-bold text-[#b45309] mt-2">Scan QR to Verify</p>
              </div>
              
              {/* Fake QR code SVG */}
              <div className="bg-[#f9f8f4] p-1.5 rounded-none border border-[#1a1a1a]/15 shadow-xs">
                <svg className="h-14 w-14 text-[#1a1a1a]" viewBox="0 0 100 100">
                  <rect x="0" y="0" width="25" height="25" fill="currentColor" />
                  <rect x="5" y="5" width="15" height="15" fill="white" />
                  <rect x="10" y="10" width="5" height="5" fill="currentColor" />
                  
                  <rect x="75" y="0" width="25" height="25" fill="currentColor" />
                  <rect x="80" y="5" width="15" height="15" fill="white" />
                  <rect x="85" y="10" width="5" height="5" fill="currentColor" />
                  
                  <rect x="0" y="75" width="25" height="25" fill="currentColor" />
                  <rect x="5" y="80" width="15" height="15" fill="white" />
                  <rect x="10" y="85" width="5" height="5" fill="currentColor" />
                  
                  {/* Micro dots representation */}
                  <rect x="40" y="10" width="10" height="5" fill="currentColor" />
                  <rect x="35" y="25" width="15" height="10" fill="currentColor" />
                  <rect x="60" y="40" width="8" height="15" fill="currentColor" />
                  <rect x="80" y="60" width="12" height="12" fill="currentColor" />
                  <rect x="40" y="70" width="10" height="20" fill="currentColor" />
                  <rect x="15" y="45" width="15" height="5" fill="currentColor" />
                </svg>
              </div>
            </div>

            <div className="text-[10px] font-serif text-center text-[#1a1a1a]/55 italic border-t border-[#1a1a1a]/10 pt-2.5">
              &quot;By keeping this label intact, you preserve the real thread of Indian culture.&quot;
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-8 flex flex-col items-center justify-center text-center h-full min-h-[250px]">
            <FileCheck className="h-10 w-10 text-[#1a1a1a]/40 stroke-[1.5] mb-3" />
            <p className="font-serif text-[#1a1a1a] font-bold text-base">Awaiting Registration Approval</p>
            <p className="text-xs text-[#1a1a1a]/60 mt-1 max-w-xs leading-relaxed font-serif">
              Fill out the artisan form and click &quot;Register Saree&quot; to compile your structural fingerprint and print certificates.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}

