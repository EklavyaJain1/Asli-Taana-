/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Award, Layers, ShieldCheck } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-[#f9f8f4] text-[#1a1a1a] border-b border-[#1a1a1a]/15 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-3.5">
            <div className="bg-[#1a1a1a] text-white p-2.5 rounded-none border border-[#1a1a1a] flex items-center justify-center shadow-xs">
              <Layers className="h-5 w-5 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-2xl font-bold tracking-tight text-[#1a1a1a]">Asli Taana</span>
                <span className="text-[10px] uppercase tracking-[0.15em] font-sans font-bold text-[#b45309]">
                  The Real Thread
                </span>
              </div>
              <p className="text-[11px] text-[#1a1a1a]/60 font-sans tracking-wide uppercase mt-0.5">
                Artisanal Thread Fingerprint Authentication Registry
              </p>
            </div>
          </div>

          {/* Hackathon Context Badge */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#1a1a1a]/5 border border-[#1a1a1a]/10 rounded-none px-3 py-1.5 text-[10px] tracking-wider uppercase font-sans font-bold">
              <Award className="h-3.5 w-3.5 text-[#b45309]" />
              <span className="text-[#1a1a1a]">HANDLOOM HACKATHON 2026</span>
            </div>
            <div className="flex items-center gap-2 bg-[#b45309]/10 border border-[#b45309]/30 rounded-none px-3 py-1.5 text-[10px] tracking-wider uppercase font-sans font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-[#b45309]" />
              <span className="text-[#b45309]">MARKET ACCESS & DIGITAL INTEGRATION</span>
            </div>
          </div>

        </div>
      </div>
      
      {/* Decorative Thin Traditional Pattern border strip instead of modern gradient */}
      <div className="h-0.5 w-full bg-[#b45309] opacity-90"></div>
    </header>
  );
}

