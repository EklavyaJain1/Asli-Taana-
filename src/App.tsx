/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import ConceptSection from "./components/ConceptSection";
import RegisterForm from "./components/RegisterForm";
import VerifySection from "./components/VerifySection";
import SareeList from "./components/SareeList";
import LoadingScreen from "./components/LoadingScreen";
import { SlideTabs } from "./components/ui/slide-tabs";
import {
  Info, Layers, ListFilter, ShieldCheck, Heart,
  UserPlus, Store, TrendingUp, BookOpen,
} from "lucide-react";
import { useLanguage } from "./contexts/LanguageContext";

// Marketplace module imports (Modules 1–3)
import OnboardingFlow from "./components/marketplace/OnboardingFlow";
import VillageAssistant from "./components/marketplace/VillageAssistant";
import PriceBreakdownView from "./components/marketplace/PriceBreakdownView";
import DemandDashboard from "./components/marketplace/DemandDashboard";
import Storefront from "./components/marketplace/Storefront";
import AboutPanel from "./components/marketplace/AboutPanel";
import { useMarketplace } from "./marketplace/useMarketplaceStore";

type Tab =
  | "concept" | "register" | "registry" | "verify"
  | "village" | "pricing" | "store" | "demand";

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
  const [isLocked, setIsLocked] = useState(false);
  const { t } = useLanguage();

  // Marketplace state: which product to price, which weaver for demand
  const [pricingProductId, setPricingProductId] = useState<string | undefined>();
  const [demandWeaverId, setDemandWeaverId] = useState<string | undefined>();
  // Product opened directly from the Fair Trade Gallery — rendered as an
  // in-place detail overlay so the nav STAYS on "store" (it does NOT switch
  // to the invisible "pricing" tab, which previously made the nav jump to
  // "Concept").
  const [storeSelectedId, setStoreSelectedId] = useState<string | undefined>();
  const { products } = useMarketplace();

  // ── URL Deep Linking ──────────────────────────────────────────────────────
  // When opening via QR code: ?id=AT-2026-XXXX → auto-select saree & go to verify
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      setSelectedSareeId(id);
      setActiveTab("verify");
      setIsLocked(true);
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

  // ── Module flow callbacks ──
  const handleOnboardComplete = useCallback((weaverId: string, productId: string) => {
    setPricingProductId(productId);
    setDemandWeaverId(weaverId);
    setActiveTab("pricing");
  }, []);

  const handlePublished = useCallback(() => {
    setActiveTab("store");
  }, []);

  const handleViewStore = useCallback(() => {
    setActiveTab("store");
  }, []);

  const handleStoreSelectProduct = useCallback((id: string) => {
    // NOTE: we deliberately do NOT call setActiveTab here. Switching to the
    // invisible "pricing" tab made the nav highlight fall back to "Concept".
    // Instead we record the selection and let the Storefront render the
    // PriceBreakdownView as an in-place overlay while the tab stays "store".
    setPricingProductId(id);
    setStoreSelectedId(id);
  }, []);

  const handleStoreCloseProduct = useCallback(() => {
    setStoreSelectedId(undefined);
  }, []);

  // ── Nav definition ────────────────────────────────────────────────────────
  // Grouped: original tabs (top) + marketplace tabs (bottom)
  const originalNavItems = [
    { name: "Concept", key: "concept", url: "#concept", icon: Info },
    { name: "Registration", key: "register", url: "#register", icon: Layers },
    { name: "Live Registry", key: "registry", url: "#registry", icon: ListFilter },
    { name: "Verification", key: "verify", url: "#verify", icon: ShieldCheck },
  ];
  const marketplaceNavItems = [
    { name: "Fair Trade Gallery", key: "store", url: "#store", icon: Store },
    { name: "Demand", key: "demand", url: "#demand", icon: TrendingUp },
  ];
  const allNavItems = [...originalNavItems, ...marketplaceNavItems];

  const translatedNavItems = allNavItems.map((item) => ({
    ...item,
    name: t(`nav.${item.key}`),
  }));

  const handleNavChange = (name: string) => {
    const item = allNavItems.find((i) => i.name === name);
    if (item) setActiveTab(item.key as Tab);
  };

  const getActiveNavName = () => {
    return allNavItems.find((i) => i.key === activeTab)?.name || "Concept";
  };

  // Auto-select a product for pricing if one was just created and none is selected.
  // If pricing tab is active but no product is selected, pick the latest.
  useEffect(() => {
    if (activeTab === "pricing" && !pricingProductId && products.length > 0) {
      setPricingProductId(products[0].id);
    }
  }, [activeTab, pricingProductId, products]);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-900">
      <AnimatePresence>
        {isAppLoading && <LoadingScreen onComplete={() => setIsAppLoading(false)} />}
      </AnimatePresence>

      <Header
        navItems={allNavItems}
        activeItem={getActiveNavName()}
        onChange={handleNavChange}
      />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">

        {/* Desktop navbar — all tabs */}
        <div className="hidden sm:flex justify-center mb-8 z-50 relative">
          <SlideTabs
            items={translatedNavItems}
            activeItem={t(`nav.${allNavItems.find((i) => i.key === activeTab)?.key}`)}
            onChange={(name) => {
              const idx = translatedNavItems.findIndex((i) => i.name === name);
              if (idx >= 0 && allNavItems[idx]) handleNavChange(allNavItems[idx].name);
            }}
          />
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {/* ── ORIGINAL TABS (unchanged) ── */}
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
              <VerifySection sarees={sarees} currentSareeId={selectedSareeId} isLocked={isLocked} />
            )}

            {/* ── MARKETPLACE MODULE TABS ── */}
            {activeTab === "village" && (
              <VillageAssistant />
            )}
            {activeTab === "pricing" && (
              pricingProductId ? (
                <PriceBreakdownView
                  productId={pricingProductId}
                  onPublished={handlePublished}
                  onViewStore={handleViewStore}
                />
              ) : (
                <div className="bg-white border border-[#1a1a1a]/15 p-8 text-center text-[#1a1a1a]/50 font-serif">
                  No product to price. Onboard a weaver first.
                  <br />
                  <button onClick={() => setActiveTab("onboard")} className="mt-3 text-xs font-sans font-bold text-[#b45309] uppercase tracking-wider">
                    Go to Onboarding →
                  </button>
                </div>
              )
            )}
            {activeTab === "store" && (
              <Storefront
                onSelectProduct={handleStoreSelectProduct}
                selectedProductId={storeSelectedId}
                onCloseProduct={handleStoreCloseProduct}
                onPublished={handlePublished}
              />
            )}
            {activeTab === "demand" && (
              <DemandDashboard weaverId={demandWeaverId} />
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
