/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Loader2, Search, Info, MapPin } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import IndiaMap from "./IndiaMap";

interface FabricIdentityCardProps {
  shopperPhoto: string;
  selectedSaree?: any;
}

interface IdentityResult {
  fiber_type: string;
  weave_pattern: string;
  confidence: number;
  visible_indicators: string[];
  originData?: {
    description: string;
    grown_in: string[];
    woven_in: string[];
  };
}

export default function FabricIdentityCard({ shopperPhoto, selectedSaree }: FabricIdentityCardProps) {
  const { t } = useLanguage();
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [identityResult, setIdentityResult] = useState<IdentityResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runIdentification = async () => {
    if (!shopperPhoto) return;
    setIsIdentifying(true);
    setIdentityResult(null);
    setError(null);

    try {
      const response = await fetch("/api/identify-fabric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: shopperPhoto }),
      });

      if (!response.ok) {
        throw new Error("Fabric identification failed");
      }

      const result = await response.json();
      if (result.error) throw new Error(result.error);
      setIdentityResult(result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while analyzing the material.");
    } finally {
      setIsIdentifying(false);
    }
  };

  if (!shopperPhoto) {
    return null; // Don't show anything if there's no photo to analyze
  }

  return (
    <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-6 shadow-xs mt-6 flex flex-col gap-5">
      <div className="flex items-center justify-between border-b pb-4 border-[#1a1a1a]/10">
        <div>
          <span className="text-[9px] font-sans font-bold tracking-widest text-[#026c7d] bg-[#026c7d]/5 border border-[#026c7d]/20 px-3 py-1.5 rounded-none uppercase">
            Independent Scan
          </span>
          <h3 className="font-serif text-xl font-bold text-[#1a1a1a] mt-3">About This Fabric</h3>
          <p className="text-xs text-[#1a1a1a]/60 font-serif mt-1">Discover material composition and regional origins.</p>
        </div>
        {!isIdentifying && !identityResult && (
          <button
            onClick={runIdentification}
            disabled={!shopperPhoto}
            className="bg-[#026c7d] hover:bg-[#01515e] text-white font-sans font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded-none border border-[#026c7d] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Search className="h-4 w-4" /> Analyze Material
          </button>
        )}
      </div>

      {isIdentifying && (
        <div className="bg-[#f9f8f4] border border-[#1a1a1a]/10 p-6 rounded-none flex flex-col items-center text-center gap-4 animate-pulse">
          <Loader2 className="h-8 w-8 text-[#026c7d] animate-spin" />
          <div>
            <h4 className="font-serif font-bold text-sm text-[#1a1a1a]">Identifying Fabric Properties...</h4>
            <p className="text-xs text-[#1a1a1a]/70 mt-1.5 font-mono">Running visual analysis on fibers and weave patterns.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-[#fdf3f4] border border-[#c5221f]/30 p-4 rounded-none text-[#c5221f] text-sm font-serif">
          {error}
        </div>
      )}

      {identityResult && !isIdentifying && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#f9f8f4] border border-[#1a1a1a]/10 p-4 rounded-none">
              <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/50 mb-1">
                Detected Fiber Type
              </span>
              <p className="font-serif text-lg font-bold text-[#1a1a1a] capitalize">
                {identityResult.fiber_type.replace(/_/g, " ")}
              </p>
              <div className="mt-2 text-[10px] font-mono bg-white px-2 py-0.5 border border-[#1a1a1a]/10 inline-block text-[#1a1a1a]/70">
                Confidence: <span className="font-bold text-[#026c7d]">{identityResult.confidence}%</span>
              </div>
            </div>
            <div className="bg-[#f9f8f4] border border-[#1a1a1a]/10 p-4 rounded-none">
              <span className="block text-[9px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/50 mb-1">
                Weave Pattern
              </span>
              <p className="font-serif text-lg font-bold text-[#1a1a1a] capitalize">
                {identityResult.weave_pattern.replace(/_/g, " ")}
              </p>
              {identityResult.visible_indicators?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {identityResult.visible_indicators.map((indicator, idx) => (
                    <span key={idx} className="text-[9px] bg-white border border-[#1a1a1a]/10 px-1.5 py-0.5 font-sans text-[#1a1a1a]/70 uppercase">
                      {indicator}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {identityResult.originData && (
            <div className="bg-white border border-[#1a1a1a]/10 p-5 rounded-none flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                 <Info className="w-24 h-24" />
              </div>
              <div>
                 <span className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#026c7d] mb-1.5 flex items-center gap-1.5">
                   <Info className="w-3.5 h-3.5" /> Fiber Description
                 </span>
                 <p className="text-sm text-[#1a1a1a]/80 font-serif leading-relaxed">
                   {identityResult.originData.description}
                 </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2 border-t border-[#1a1a1a]/10 pt-4">
                <div className="flex flex-col gap-4">
                  <div>
                    <span className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/50 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#b45309]" /> Typically Grown In
                    </span>
                    <ul className="list-disc list-inside text-xs font-serif text-[#1a1a1a]/80 space-y-1">
                      {identityResult.originData.grown_in.map((loc, idx) => (
                        <li key={idx}>{loc}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="block text-[10px] font-sans uppercase tracking-widest font-bold text-[#1a1a1a]/50 mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#026c7d]" /> Typically Woven In
                    </span>
                    <ul className="list-disc list-inside text-xs font-serif text-[#1a1a1a]/80 space-y-1">
                      {identityResult.originData.woven_in.map((loc, idx) => (
                        <li key={idx}>{loc}</li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div>
                  <IndiaMap 
                    grownInStates={identityResult.originData.grown_in} 
                    wovenInLocation={selectedSaree?.village || ""} 
                  />
                </div>
              </div>
            </div>
          )}

          <div className="text-right">
             <button
               onClick={runIdentification}
               className="text-[10px] font-sans uppercase tracking-widest text-[#026c7d] hover:text-[#01515e] font-bold underline underline-offset-4"
             >
               Analyze Again
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
