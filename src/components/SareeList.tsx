/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, MapPin, Tag, Calendar, User, ShieldCheck } from "lucide-react";

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

interface SareeListProps {
  sarees: Saree[];
  onSelectVerify: (id: string) => void;
}

export default function SareeList({ sarees, onSelectVerify }: SareeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVillage, setSelectedVillage] = useState("all");

  // Get list of unique villages
  const villages = ["all", ...Array.from(new Set(sarees.map(s => s.village)))];

  const filteredSarees = sarees.filter(s => {
    const matchesSearch = 
      s.weaverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patternType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVillage = selectedVillage === "all" || s.village === selectedVillage;

    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        
        {/* Search input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#1a1a1a]/50" />
          <input
            type="text"
            placeholder="Search by ID, artisan name, material weave..."
            className="w-full text-xs md:text-sm pl-10 pr-4 py-2.5 bg-white border border-[#1a1a1a]/20 rounded-none text-[#1a1a1a] focus:bg-white focus:outline-none focus:border-[#1a1a1a] transition-all font-serif"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Village Pills */}
        <div className="flex flex-wrap gap-2 items-center justify-end w-full md:w-auto">
          <span className="text-[9px] font-sans font-bold text-[#1a1a1a]/60 uppercase tracking-widest mr-1.5">Cluster Filter:</span>
          {villages.map(v => (
            <button
              key={v}
              type="button"
              className={`text-[10px] px-3 py-1.5 rounded-none border font-sans font-bold uppercase tracking-wider transition-all ${
                selectedVillage === v
                  ? "bg-[#1a1a1a] border-[#1a1a1a] text-white"
                  : "bg-white border-[#1a1a1a]/10 text-[#1a1a1a]/70 hover:bg-[#1a1a1a]/5"
              }`}
              onClick={() => setSelectedVillage(v)}
            >
              {v === "all" ? "All Clusters" : v}
            </button>
          ))}
        </div>

      </div>

      {/* Grid List */}
      {filteredSarees.length === 0 ? (
        <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-16 text-center text-[#1a1a1a]/60 font-serif text-lg">
          No registered sarees found matching your query.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSarees.map(s => (
            <div key={s.id} className="bg-white border border-[#1a1a1a]/15 rounded-none overflow-hidden transition-all flex flex-col justify-between group hover:border-[#1a1a1a]/40 shadow-xs">
              
              {/* Card top banner style */}
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: s.mainColor }}
              ></div>

              <div className="p-6 flex flex-col justify-between flex-1 gap-5">
                
                {/* Header info */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-mono text-[10px] font-bold text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 px-2.5 py-0.5 rounded-none uppercase tracking-wider">
                      {s.id}
                    </span>
                    <span className="text-[9px] text-[#1a1a1a]/40 font-sans uppercase tracking-widest font-bold">SECURED</span>
                  </div>

                  <h4 className="font-serif text-lg font-bold text-[#1a1a1a] group-hover:text-[#b45309] transition-colors leading-snug">
                    {s.patternType}
                  </h4>
                  
                  <div className="flex items-center gap-1.5 mt-2.5 text-[#1a1a1a]/70 text-xs font-serif">
                    <MapPin className="h-3.5 w-3.5 text-[#b45309]" />
                    <span className="italic">{s.village} Handloom Cooperative</span>
                  </div>
                </div>

                {/* Details list */}
                <div className="bg-[#f9f8f4] border border-[#1a1a1a]/10 p-4 rounded-none space-y-2.5 text-xs font-serif">
                  
                  <div className="flex items-center justify-between text-[#1a1a1a]/90 pb-2 border-b border-[#1a1a1a]/5">
                    <span className="flex items-center gap-1.5 font-sans text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-bold">
                      <User className="h-3 w-3 text-[#1a1a1a]/40" /> Weaver
                    </span>
                    <span className="font-bold">{s.weaverName}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#1a1a1a]/90 pb-2 border-b border-[#1a1a1a]/5">
                    <span className="flex items-center gap-1.5 font-sans text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-bold">
                      <Tag className="h-3 w-3 text-[#1a1a1a]/40" /> Material
                    </span>
                    <span className="font-medium max-w-[150px] truncate">{s.material}</span>
                  </div>

                  <div className="flex items-center justify-between text-[#1a1a1a]/90">
                    <span className="flex items-center gap-1.5 font-sans text-[9px] text-[#1a1a1a]/50 uppercase tracking-wider font-bold">
                      <Calendar className="h-3 w-3 text-[#1a1a1a]/40" /> Registered
                    </span>
                    <span>{s.registeredDate}</span>
                  </div>

                </div>

                {/* Footer and verification switch link */}
                <div className="border-t border-[#1a1a1a]/10 pt-4 flex items-center justify-between gap-4 mt-auto">
                  
                  <div>
                    <span className="block text-[8px] font-sans font-bold text-[#1a1a1a]/40 uppercase tracking-wider">Artisan Pricing</span>
                    <span className="font-mono font-bold text-[#1a1a1a] text-sm md:text-base">
                      ₹{s.price.toLocaleString("en-IN")}
                    </span>
                  </div>

                  <button
                    type="button"
                    className="bg-[#1a1a1a] hover:bg-[#b45309] text-white font-sans font-bold text-[10px] uppercase tracking-wider py-2 px-3.5 rounded-none border border-[#1a1a1a] transition-all flex items-center gap-1.5 shadow-xs"
                    onClick={() => onSelectVerify(s.id)}
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Test Verify
                  </button>

                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}

