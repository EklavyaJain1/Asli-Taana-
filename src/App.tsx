/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import ConceptSection from "./components/ConceptSection";
import RegisterForm from "./components/RegisterForm";
import VerifySection from "./components/VerifySection";
import SareeList from "./components/SareeList";
import LoadingScreen from "./components/LoadingScreen";
import { NavBar } from "./components/ui/tubelight-navbar";
import { Info, Layers, ListFilter, ShieldCheck, Heart } from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";

type Tab = "concept" | "register" | "registry" | "verify";

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
  const [activeTab, setActiveTab] = useState<Tab>("concept");
  const [sarees, setSarees] = useState<Saree[]>([]);
  const [selectedSareeId, setSelectedSareeId] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isAppLoading, setIsAppLoading] = useState(true);
  const { t } = useLanguage();

  // ── URL Deep Linking ──────────────────────────────────────────────────────
  // When opening via QR code: ?id=AT-2026-XXXX → auto-select saree & go to verify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setSelectedSareeId(id);
      setActiveTab("verify");
      // Clean the URL without reloading the page
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // ── Fetch sarees from backend ─────────────────────────────────────────────
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

  useEffect(() => { fetchSarees(); }, []);

  const handleNewRegistration = (newSaree: any) => {
    setSarees((prev) => [newSaree, ...prev]);
    setSelectedSareeId(newSaree.id);
    fetchSarees();
  };

  const handleVerifySaree = (id: string) => {
    setSelectedSareeId(id);
    setActiveTab("verify");
  };

  const navItems = [
    { name: "Concept", key: "concept", url: "#concept", icon: Info },
    { name: "Registration", key: "register", url: "#register", icon: Layers },
    { name: "Live Registry", key: "registry", url: "#registry", icon: ListFilter },
    { name: "Verification", key: "verify", url: "#verify", icon: ShieldCheck },
  ];
  
  const translatedNavItems = navItems.map(item => ({
    ...item,
    name: t(`nav.${item.key}`)
  }));

  const handleNavChange = (name: string) => {
    if (name === "Concept") setActiveTab("concept");
    else if (name === "Registration") setActiveTab("register");
    else if (name === "Live Registry") setActiveTab("registry");
    else if (name === "Verification") setActiveTab("verify");
  };

  const getActiveNavName = () => {
    if (activeTab === "concept") return "Concept";
    if (activeTab === "register") return "Registration";
    if (activeTab === "registry") return "Live Registry";
    if (activeTab === "verify") return "Verification";
    return "Concept";
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-900">
      <AnimatePresence>
        {isAppLoading && <LoadingScreen onComplete={() => setIsAppLoading(false)} />}
      </AnimatePresence>

      <Header 
        navItems={navItems}
        activeItem={getActiveNavName()}
        onChange={handleNavChange}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Tubelight Navbar (Hidden on mobile, shown on desktop) */}
        <div className="hidden sm:block">
          <NavBar 
            items={translatedNavItems} 
            activeItem={t(`nav.${navItems.find(i => i.name === getActiveNavName())?.key}`)} 
            onChange={(name) => {
              const originalItem = translatedNavItems.find(i => i.name === name);
              if (originalItem) {
                const idx = translatedNavItems.indexOf(originalItem);
                handleNavChange(navItems[idx].name);
              }
            }} 
          />
        </div>

        {/* Tab Content with AnimatePresence */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}>

            {activeTab === "concept" && <ConceptSection sarees={sarees} />}
            {activeTab === "register" && <RegisterForm onRegisterSuccess={handleNewRegistration} />}
            {activeTab === "registry" && (
              isLoading ? (
                <div className="flex items-center justify-center py-24 text-stone-400">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-6 w-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-sans uppercase tracking-widest">Loading Registry...</span>
                  </div>
                </div>
              ) : (
                <SareeList sarees={sarees} onSelectVerify={handleVerifySaree} />
              )
            )}
            {activeTab === "verify" && (
              <VerifySection sarees={sarees} currentSareeId={selectedSareeId} />
            )}

          </motion.div>
        </AnimatePresence>

      </main>

      {/* Footer */}
      <footer className="bg-stone-900 border-t border-amber-900/20 text-stone-400 py-6 text-center mt-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-serif text-amber-500 font-bold text-sm tracking-wide">{t("footer.title")}</p>
            <p className="text-[10px] mt-1 text-stone-500">
              {t("footer.subtitle")}
            </p>
          </div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-stone-500">
            <span>{t("footer.built")}</span>
            <Heart className="h-3.5 w-3.5 text-rose-600 fill-rose-600" />
            <span>{t("footer.respect")}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
