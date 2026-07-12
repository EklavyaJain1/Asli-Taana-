/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import Header from "./components/Header";
import ConceptSection from "./components/ConceptSection";
import RegisterForm from "./components/RegisterForm";
import VerifySection from "./components/VerifySection";
import SareeList from "./components/SareeList";
import { Info, Layers, ListFilter, ShieldCheck, Heart, Github } from "lucide-react";

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

export default function App() {
  const [activeTab, setActiveTab] = useState<"concept" | "register" | "registry" | "verify">("concept");
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [selectedSareeId, setSelectedSareeId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch registered sarees from the backend server
  const fetchSarees = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sarees");
      if (response.ok) {
        const data = await response.json();
        setSarees(data);
      }
    } catch (err) {
      console.error("Failed to fetch sarees from server:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSarees();
  }, []);

  // Handler when a weaver registers a new saree
  const handleNewRegistration = (newSaree: any) => {
    // Add to local state first for immediate UI response
    setSarees(prev => [newSaree, ...prev]);
    // Set active ID so verify section loads it
    setSelectedSareeId(newSaree.id);
    // Refresh database array from server
    fetchSarees();
  };

  // Switch to verify tab and select a specific Saree ID
  const handleVerifySaree = (id: string) => {
    setSelectedSareeId(id);
    setActiveTab("verify");
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-900">
      
      {/* Top Navigation Branding Header */}
      <Header />

      {/* Main Content Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        
        {/* Tab Navigator Switcher */}
        <div className="flex border-b border-stone-200/80 mb-6 sm:mb-8 overflow-x-auto gap-2">
          
          <button
            type="button"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "concept"
                ? "border-amber-600 text-amber-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
            onClick={() => setActiveTab("concept")}
          >
            <Info className="h-4 w-4" />
            Core Pitch & Concept
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "register"
                ? "border-amber-600 text-amber-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
            onClick={() => setActiveTab("register")}
          >
            <Layers className="h-4 w-4" />
            Weaver Registration Portal
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "registry"
                ? "border-amber-600 text-amber-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
            onClick={() => setActiveTab("registry")}
          >
            <ListFilter className="h-4 w-4" />
            Secure Live Registry ({sarees.length})
          </button>

          <button
            type="button"
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
              activeTab === "verify"
                ? "border-amber-600 text-amber-800"
                : "border-transparent text-stone-500 hover:text-stone-800"
            }`}
            onClick={() => setActiveTab("verify")}
          >
            <ShieldCheck className="h-4 w-4" />
            Shopper Verification Portal
          </button>

        </div>

        {/* Tab Sections Rendering */}
        <div className="transition-all duration-300">
          
          {activeTab === "concept" && (
            <ConceptSection />
          )}

          {activeTab === "register" && (
            <RegisterForm onRegisterSuccess={handleNewRegistration} />
          )}

          {activeTab === "registry" && (
            <SareeList sarees={sarees} onSelectVerify={handleVerifySaree} />
          )}

          {activeTab === "verify" && (
            <VerifySection sarees={sarees} currentSareeId={selectedSareeId} />
          )}

        </div>

      </main>

      {/* Footer Branding details */}
      <footer className="bg-stone-900 border-t border-amber-900/20 text-stone-400 py-6 text-center mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-serif text-amber-500 font-bold text-sm tracking-wide">Asli Taana — National Handloom Hackathon 2026</p>
            <p className="text-[10px] mt-1 text-stone-500">
              Preserving cultural heritage and protecting weaver economics using AI thread fingerprinting.
            </p>
          </div>
          
          <div className="flex items-center gap-2 font-mono text-[10px] text-stone-500">
            <span>Built with Love</span>
            <Heart className="h-3.5 w-3.5 text-rose-600 fill-rose-600" />
            <span>&amp; respect for Indian Weavers</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
