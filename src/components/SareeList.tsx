/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Search, MapPin, Tag, Calendar, User, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useLanguage } from "../contexts/LanguageContext";

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
  detectedStyle?: string;
}

interface SareeListProps {
  sarees: Saree[];
  onSelectVerify: (id: string) => void;
}

export default function SareeList({ sarees, onSelectVerify }: SareeListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null);
  const { t } = useLanguage();

  // Get list of unique villages
  const clusters = Array.from(new Set(sarees.map(s => s.village)));

  const filteredSarees = sarees.filter(s => {
    const matchesSearch = 
      s.weaverName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.material.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.patternType.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesVillage = !selectedCluster || s.village === selectedCluster;

    return matchesSearch && matchesVillage;
  });

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        
        {/* Search input */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a1a1a]/40" />
          <input
            type="text"
            placeholder={t("registry.search")}
            className="w-full pl-9 pr-4 py-2 text-sm border border-[#1a1a1a]/20 rounded-none bg-white text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-colors"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#1a1a1a]/60 whitespace-nowrap">
            {t("registry.filter")}
          </span>
          <select
            className="border border-[#1a1a1a]/20 text-sm p-2 rounded-none bg-white text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a]"
            value={selectedCluster || ""}
            onChange={e => setSelectedCluster(e.target.value || null)}
          >
            <option value="">{t("registry.all")}</option>
            {clusters.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

      </div>

      {/* Grid List */}
      {filteredSarees.length === 0 ? (
        <div className="text-center py-16 text-[#1a1a1a]/50 font-serif italic text-lg border border-dashed border-[#1a1a1a]/20">
          {t("registry.empty")}
        </div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="show"
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: { staggerChildren: 0.1 }
            }
          }}
        >
          {filteredSarees.map(s => (
            <motion.div 
              key={s.id} 
              className="bg-white border border-[#1a1a1a]/15 rounded-none overflow-hidden transition-all flex flex-col justify-between group hover:border-[#1a1a1a]/40 shadow-xs hover:shadow-md hover:-translate-y-1"
              variants={{
                hidden: { opacity: 0, y: 20 },
                show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
              }}
            >
              
              {/* Card top banner style */}
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: s.mainColor }}
              ></div>

              <div className="p-6 flex flex-col justify-between flex-1">
                
                {/* Header info */}
                <div className="mb-6">
                  <div className="flex justify-between items-baseline mb-2">
                    <span className="font-mono text-[10px] font-bold text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 px-2.5 py-0.5 rounded-none uppercase tracking-wider">
                      {s.id}
                    </span>
                    <span className="text-[9px] text-[#1a1a1a]/40 font-sans uppercase tracking-widest font-bold">SECURED</span>
                  </div>

                  <h4 className="font-serif text-lg font-bold text-[#1a1a1a] leading-snug">
                    {t(s.patternType)}
                  </h4>
                </div>

                {/* Details list */}
                <div className="flex flex-col mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-3.5 w-3.5 text-[#1a1a1a]/40" />
                    <span className="text-xs text-[#1a1a1a]/70 font-sans"><strong className="text-[#1a1a1a]">{t("registry.weaver")}:</strong> {t(s.weaverName)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-3.5 w-3.5 text-[#1a1a1a]/40" />
                    <span className="text-xs text-[#1a1a1a]/70 font-sans"><strong className="text-[#1a1a1a]">{t("register.village")}:</strong> {t(s.village)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-3.5 w-3.5 text-[#1a1a1a]/40" />
                    <span className="text-xs text-[#1a1a1a]/70 font-sans"><strong className="text-[#1a1a1a]">{t("registry.material")}:</strong> {t(s.material)}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-4">
                    <Calendar className="h-3.5 w-3.5 text-[#1a1a1a]/40" />
                    <span className="text-xs text-[#1a1a1a]/70 font-sans"><strong className="text-[#1a1a1a]">{t("registry.date")}:</strong> {new Date(s.registeredDate).toLocaleDateString()}</span>
                  </div>
                  
                  {/* AI Style Match Alert Bubble */}
                  <div className={`mt-auto text-[10px] font-sans font-bold uppercase tracking-wider p-2 rounded-none border ${s.detectedStyle ? 'bg-amber-50 text-amber-900 border-amber-200' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>
                    {s.detectedStyle ? (
                      <span className="flex items-center justify-between">
                        <span>{t("registry.ai.detected")}</span>
                        <span className="italic">{s.detectedStyle}</span>
                      </span>
                    ) : (
                      <span className="opacity-70">{t("registry.ai.none")}</span>
                    )}
                  </div>
                </div>

                {/* Card footer style */}
                <div className="bg-[#1a1a1a] p-4 flex items-center justify-between mt-auto">
                  <div>
                    <span className="block text-[9px] font-sans text-white/50 uppercase tracking-widest">{t("registry.price")}</span>
                    <span className="font-mono text-white text-lg font-bold">{t("registry.card.rupee")}{s.price.toLocaleString()}</span>
                  </div>
                  
                  <button 
                    onClick={() => onSelectVerify(s.id)}
                    className="flex items-center gap-2 text-xs font-sans font-bold bg-[#b45309] hover:bg-[#92400e] text-white px-3 py-2 rounded-none uppercase tracking-wider transition-colors"
                  >
                    {t("registry.verify")} <ShieldCheck className="h-4 w-4" />
                  </button>

                </div>

              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

    </div>
  );
}

