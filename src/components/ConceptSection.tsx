/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { AlertCircle, Fingerprint } from "lucide-react";

export default function ConceptSection() {
  return (
    <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-6 md:p-10 shadow-xs">
      <div className="max-w-4xl mx-auto">
        
        {/* Pitch Headline */}
        <div className="text-center mb-10 md:mb-14">
          <span className="text-[10px] font-sans tracking-[0.25em] text-[#b45309] uppercase bg-[#b45309]/5 px-3 py-1 rounded-none border border-[#b45309]/20 font-bold">
            HACKATHON THEME CONTEXT
          </span>
          <h2 className="font-serif text-3xl md:text-5xl text-[#1a1a1a] mt-4 font-normal tracking-tight leading-tight">
            The Weave Fingerprint: <span className="italic font-normal">Solving the Powerloom Cheat</span>
          </h2>
          <div className="h-px w-20 bg-[#1a1a1a]/20 mx-auto my-5"></div>
          <p className="text-[#1a1a1a]/80 font-serif text-lg leading-relaxed max-w-2xl mx-auto">
            Every piece of cloth woven by hand contains an uncopiable structural signature. 
            We protect the livelihood of traditional artisans by scanning what machines can never fake.
          </p>
        </div>
 
        {/* 2-Column Problem & Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-[#1a1a1a]/15 mb-12">
          
          {/* Column 1: The Problem */}
          <div className="bg-white p-6 md:p-8 border-b md:border-b-0 md:border-r border-[#1a1a1a]/15">
            <div className="flex items-center gap-3 text-red-800 mb-6">
              <div className="bg-red-50 p-2 rounded-none border border-red-200">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">The Powerloom Threat</h3>
            </div>
            
            <p className="text-[#1a1a1a]/80 text-sm font-serif leading-relaxed mb-6">
              In famous villages like <strong>Kuthampully</strong>, over 100 shops claim to sell authentic handloom sarees. 
              In reality, only <strong>one cooperative</strong> still weaves by hand. The rest are cheap powerloom copies.
            </p>

            <ul className="space-y-4 text-xs md:text-sm text-[#1a1a1a]/80">
              <li className="flex items-start gap-3">
                <span className="text-red-700 font-bold">01.</span>
                <span className="font-sans leading-relaxed"><strong>Replication Speed:</strong> A machine copies handwoven patterns in minutes; a real weaver spends days, thread by thread.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-700 font-bold">02.</span>
                <span className="font-sans leading-relaxed"><strong>Price Undercutting:</strong> Authentic sarees cost ₹12,000+ to compensate skilled labor, but fakes sell for under ₹2,000.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-700 font-bold">03.</span>
                <span className="font-sans leading-relaxed"><strong>Law Enforcement Gap:</strong> The 1985 Handloom Act bans powerloom replication, but inspectors cannot visually tell the difference.</span>
              </li>
            </ul>
          </div>

          {/* Column 2: The Solution (Contrast Block) */}
          <div className="bg-[#1a1a1a] text-white p-6 md:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 text-[#b45309] mb-6">
                <div className="bg-white/5 p-2 rounded-none border border-white/15">
                  <Fingerprint className="h-5 w-5 text-[#b45309]" />
                </div>
                <h3 className="font-serif text-xl font-bold text-white">The Organic Fingerprint</h3>
              </div>

              <p className="text-white/80 text-sm font-serif leading-relaxed mb-6">
                A human weaver naturally creates microscopic irregularities—varying thread tension, tiny gaps, and occasional slubs. 
                These micro-irregularities form a <strong>uniquely uncopiable cloth fingerprint</strong>.
              </p>

              <ul className="space-y-4 text-xs md:text-sm text-white/80">
                <li className="flex items-start gap-3">
                  <span className="text-[#b45309] font-bold">01.</span>
                  <span className="font-sans leading-relaxed"><strong>Uncopiable Code:</strong> If a fake seller duplicates a QR label, the shopper's fresh macro-photo of the weave will still mismatch the registry.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#b45309] font-bold">02.</span>
                  <span className="font-sans leading-relaxed"><strong>Zero Equipment:</strong> Cooperative offices register items with a macro-lens. Shoppers authenticate instantly using native smartphone cameras.</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#b45309] font-bold">03.</span>
                  <span className="font-sans leading-relaxed"><strong>Artisan Protection:</strong> Redirects market capital to actual craftsmen, driving a fair economy and cultural preservation.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Visual Fingerprint Demonstration */}
        <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-6 md:p-8 mb-8">
          <div className="text-center mb-8">
            <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#1a1a1a]/60">Microscopic Magnification Comparison</span>
            <h4 className="font-serif text-xl text-[#1a1a1a] mt-1 font-semibold">Comparing Weave Fingerprints</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Handwoven Thread Card */}
            <div className="flex flex-col items-center bg-[#f9f8f4] p-5 rounded-none border border-[#1a1a1a]/10">
              <div className="relative h-28 w-48 mb-4 flex items-center justify-center bg-[#1a1a1a] rounded-none overflow-hidden border border-[#1a1a1a]">
                
                {/* Handwoven Organic Threads SVG */}
                <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Warp threads with slight organic wave */}
                  <path d="M 20 0 Q 18 30 22 60 T 19 120" stroke="#fcf8f2" strokeWidth="4.5" fill="none" opacity="0.8" />
                  <path d="M 60 0 Q 64 25 58 55 T 62 120" stroke="#fcf8f2" strokeWidth="3" fill="none" opacity="0.8" />
                  <path d="M 100 0 Q 97 40 103 80 T 98 120" stroke="#fcf8f2" strokeWidth="5" fill="none" opacity="0.8" />
                  <path d="M 140 0 Q 142 35 137 70 T 141 120" stroke="#d4af37" strokeWidth="4.2" fill="none" opacity="0.9" /> {/* Golden zari slub */}
                  <path d="M 180 0 Q 177 30 183 60 T 179 120" stroke="#fcf8f2" strokeWidth="3.5" fill="none" opacity="0.8" />

                  {/* Weft threads with slight organic wave */}
                  <path d="M 0 15 Q 40 18 80 13 T 200 17" stroke="#fcf8f2" strokeWidth="3.8" fill="none" opacity="0.8" />
                  <path d="M 0 45 Q 50 42 100 48 T 200 44" stroke="#fcf8f2" strokeWidth="4.2" fill="none" opacity="0.8" />
                  <path d="M 0 75 Q 35 77 90 71 T 200 76" stroke="#d4af37" strokeWidth="5.5" fill="none" opacity="0.9" /> {/* Slub */}
                  <path d="M 0 105 Q 45 102 95 108 T 200 104" stroke="#fcf8f2" strokeWidth="3" fill="none" opacity="0.8" />
                </svg>

                {/* Hand symbol */}
                <span className="absolute bottom-1 right-2 text-[9px] uppercase tracking-wider bg-[#b45309] text-white font-sans px-1.5 py-0.5 rounded-none font-bold">
                  Organic
                </span>
              </div>
              <p className="font-serif text-sm font-bold text-[#1a1a1a]">A. Handwoven Thread &quot;Fingerprint&quot;</p>
              <p className="text-xs text-[#1a1a1a]/60 text-center mt-2 max-w-xs leading-relaxed">
                Tiny random waves and thread variations (slubs) happen naturally. No two spots are identical.
              </p>
            </div>

            {/* Machine Thread Card */}
            <div className="flex flex-col items-center bg-[#f9f8f4] p-5 rounded-none border border-[#1a1a1a]/10">
              <div className="relative h-28 w-48 mb-4 flex items-center justify-center bg-[#1a1a1a] rounded-none overflow-hidden border border-[#1a1a1a]">
                
                {/* Machine Perfect Grid SVG */}
                <svg className="absolute inset-0 h-full w-full" xmlns="http://www.w3.org/2000/svg">
                  {/* Warp threads mathematically straight */}
                  <line x1="20" y1="0" x2="20" y2="120" stroke="#fcf8f2" strokeWidth="4" opacity="0.8" />
                  <line x1="60" y1="0" x2="60" y2="120" stroke="#fcf8f2" strokeWidth="4" opacity="0.8" />
                  <line x1="100" y1="0" x2="100" y2="120" stroke="#fcf8f2" strokeWidth="4" opacity="0.8" />
                  <line x1="140" y1="0" x2="140" y2="120" stroke="#d4af37" strokeWidth="4" opacity="0.9" />
                  <line x1="180" y1="0" x2="180" y2="120" stroke="#fcf8f2" strokeWidth="4" opacity="0.8" />

                  {/* Weft threads mathematically straight */}
                  <line x1="0" y1="15" x2="200" y2="15" stroke="#fcf8f2" strokeWidth="4" opacity="0.8" />
                  <line x1="0" y1="45" x2="200" y2="45" stroke="#fcf8f2" strokeWidth="4" opacity="0.8" />
                  <line x1="0" y1="75" x2="200" y2="75" stroke="#d4af37" strokeWidth="4" opacity="0.9" />
                  <line x1="0" y1="105" x2="200" y2="105" stroke="#fcf8f2" strokeWidth="4" opacity="0.8" />
                </svg>

                {/* Machine symbol */}
                <span className="absolute bottom-1 right-2 text-[9px] uppercase tracking-wider bg-red-800 text-white font-sans px-1.5 py-0.5 rounded-none font-bold">
                  Machine
                </span>
              </div>
              <p className="font-serif text-sm font-bold text-[#1a1a1a]">B. Powerloom Repeating Pattern</p>
              <p className="text-xs text-[#1a1a1a]/60 text-center mt-2 max-w-xs leading-relaxed">
                Perfect repeating pattern. A machine copies the grid flawlessly, making fakes easily detectable by AI comparison.
              </p>
            </div>

          </div>

          <div className="mt-8 p-5 bg-[#f9f8f4] border border-[#1a1a1a]/10 rounded-none flex flex-col sm:flex-row items-baseline gap-4">
            <div className="text-[#b45309] font-sans font-bold text-[9px] tracking-widest uppercase border border-[#b45309]/30 px-2.5 py-1 whitespace-nowrap">
              AUTHENTICATION LOGIC
            </div>
            <p className="text-xs font-serif text-[#1a1a1a]/80 leading-relaxed">
              <strong>The QR tag alone proves nothing.</strong> Anyone can copy a QR sticker onto 10,000 sarees. 
              The magic of <em>Asli Taana</em> is that scanning the QR prompts the shopper to photograph the fabric, 
              which is matched against the original registered fingerprint. <strong>It acts like FaceID, but for cloth.</strong>
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}

