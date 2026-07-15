/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ArrowRight, ShieldCheck, Factory, PlayCircle, Fingerprint, RefreshCw, AlertCircle } from "lucide-react";
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
}

interface ConceptSectionProps {
  sarees?: Saree[];
}

export default function ConceptSection({ sarees = [] }: ConceptSectionProps) {
  const { t } = useLanguage();

  return (
    <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 rounded-none p-6 md:p-10 shadow-xs">
      <div className="max-w-4xl mx-auto">
        
        {/* Pitch Headline */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1a1a1a] text-[#f5f5f5] mb-6 rounded-none">
            <span className="h-2 w-2 rounded-full bg-[#b45309] animate-pulse"></span>
            <span className="text-[10px] font-sans font-bold uppercase tracking-[0.2em]">{t("concept.badge")}</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold text-[#1a1a1a] tracking-tight mb-6 text-center">
            <span className="block font-serif italic text-3xl md:text-4xl lg:text-5xl text-[#1a1a1a]/60 mb-2">
              {t("concept.title1")}
            </span>
            {t("concept.title2")}
            <span className="block font-serif italic text-3xl md:text-4xl lg:text-5xl text-[#1a1a1a]/60 mt-2">
              {t("concept.title3")}
            </span>
          </h1>

          <p className="text-base md:text-lg text-[#1a1a1a]/70 max-w-xl mx-auto font-serif leading-relaxed mb-8 text-center">
            {t("concept.desc")}
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
              <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">{t("concept.problem.title")}</h3>
            </div>
            
            <p className="text-[#1a1a1a]/80 text-sm font-serif leading-relaxed mb-6">
              {t("concept.problem.desc")}
            </p>

            <ul className="space-y-4 text-xs md:text-sm text-[#1a1a1a]/80">
              <li className="flex items-start gap-3">
                <span className="text-red-700 font-bold">01.</span>
                <span className="font-sans leading-relaxed"><strong>{t("concept.problem.point1.title")}</strong> {t("concept.problem.point1.desc")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-700 font-bold">02.</span>
                <span className="font-sans leading-relaxed"><strong>{t("concept.problem.point2.title")}</strong> {t("concept.problem.point2.desc")}</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-700 font-bold">03.</span>
                <span className="font-sans leading-relaxed"><strong>{t("concept.problem.point3.title")}</strong> {t("concept.problem.point3.desc")}</span>
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
                <h3 className="font-serif text-xl font-bold text-white">{t("concept.solution.title")}</h3>
              </div>

              <p className="text-white/80 text-sm font-serif leading-relaxed mb-6">
                {t("concept.solution.desc")}
              </p>

              <ul className="space-y-4 text-xs md:text-sm text-white/80">
                <li className="flex items-start gap-3">
                  <span className="text-[#b45309] font-bold">01.</span>
                  <span className="font-sans leading-relaxed"><strong>{t("concept.solution.point1.title")}</strong> {t("concept.solution.point1.desc")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#b45309] font-bold">02.</span>
                  <span className="font-sans leading-relaxed"><strong>{t("concept.solution.point2.title")}</strong> {t("concept.solution.point2.desc")}</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-[#b45309] font-bold">03.</span>
                  <span className="font-sans leading-relaxed"><strong>{t("concept.solution.point3.title")}</strong> {t("concept.solution.point3.desc")}</span>
                </li>
              </ul>
            </div>
          </div>

        </div>

        {/* Visual Fingerprint Demonstration */}
        <div className="bg-white border border-[#1a1a1a]/15 rounded-none p-6 md:p-8 mb-8">
          <div className="text-center mb-8">
            <span className="text-[9px] font-sans uppercase tracking-[0.2em] text-[#1a1a1a]/60">{t("concept.fingerprint.badge")}</span>
            <h4 className="font-serif text-xl text-[#1a1a1a] mt-1 font-semibold">{t("concept.fingerprint.title")}</h4>
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
                  {t("concept.fingerprint.organic")}
                </span>
              </div>
              <p className="font-serif text-sm font-bold text-[#1a1a1a]">{t("concept.fingerprint.handwoven.title")}</p>
              <p className="text-xs text-[#1a1a1a]/60 text-center mt-2 max-w-xs leading-relaxed">
                {t("concept.fingerprint.handwoven.desc")}
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
                  {t("concept.fingerprint.machine")}
                </span>
              </div>
              <p className="font-serif text-sm font-bold text-[#1a1a1a]">{t("concept.fingerprint.machine.title")}</p>
              <p className="text-xs text-[#1a1a1a]/60 text-center mt-2 max-w-xs leading-relaxed">
                {t("concept.fingerprint.machine.desc")}
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
