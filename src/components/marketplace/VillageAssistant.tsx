/**
 * Module 1 — Village Assistant (simplified admin) mode.
 *
 * A literate helper (NGO worker / local youth) can bulk-onboard multiple
 * weavers in a single session. Each completed weaver is queued in a sidebar
 * list, clearly separated by profile. The underlying OnboardingFlow component
 * is reused with `villageMode={true}`.
 */
import React, { useState } from "react";
import { Users, Plus, UserCheck, ChevronRight } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMarketplace } from "../../marketplace/useMarketplaceStore";
import { SectionHeader, inputClass } from "./primitives";
import OnboardingFlow from "./OnboardingFlow";

interface QueuedWeaver {
  weaverId: string;
  productId: string;
  name: string;
  timestamp: string;
}

export default function VillageAssistant() {
  const { t } = useLanguage();
  const db = useMarketplace();
  const [assistantName, setAssistantName] = useState("");
  const [active, setActive] = useState(false);
  const [queue, setQueue] = useState<QueuedWeaver[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleComplete = (weaverId: string, productId: string) => {
    const w = db.weavers.find((x) => x.id === weaverId);
    setQueue((q) => [...q, { weaverId, productId, name: w?.name || "Unknown", timestamp: new Date().toLocaleTimeString() }]);
    setSelectedProductId(productId); // auto-route to pricing
  };

  // If a product was just created, show PriceBreakdown view instead.
  // (In the full wiring, the parent App routes this; here we keep it self-contained.)
  if (active && !selectedProductId) {
    return (
      <div>
        <SectionHeader badge={`${t("onboard.villageMode")} · ${t("onboard.villageModeOn")}`}
          title={t("onboard.title")} subtitle={t("onboard.subtitle")} icon={Users} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Onboarding (main) */}
          <div className="lg:col-span-2">
            <OnboardingFlow villageMode assistantName={assistantName || "Village Assistant"} onComplete={handleComplete} />
          </div>

          {/* Queue sidebar */}
          <div className="bg-white border border-[#1a1a1a]/15 p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck className="h-4 w-4 text-[#15803d]" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]">
                {t("onboard.villageModeOn")} ({queue.length})
              </span>
            </div>

            {queue.length === 0 ? (
              <p className="text-xs text-[#1a1a1a]/40 font-sans italic">
                No weavers onboarded this session.
              </p>
            ) : (
              <ul className="space-y-2">
                {queue.map((q, i) => (
                  <li key={i} className="flex items-center gap-3 p-3 bg-[#f9f8f4] border border-[#1a1a1a]/10">
                    <span className="w-6 h-6 rounded-full bg-[#15803d]/10 text-[#15803d] text-[10px] font-mono font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-sans font-bold text-[#1a1a1a] truncate">{q.name}</p>
                      <p className="text-[9px] font-mono text-[#1a1a1a]/40">{q.weaverId}</p>
                    </div>
                    <button onClick={() => setSelectedProductId(q.productId)}
                      className="text-[10px] font-sans font-bold text-[#b45309] uppercase tracking-wider hover:text-[#92400e] flex items-center gap-1">
                      Price <ChevronRight className="h-3 w-3" />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <button onClick={() => { setActive(false); setQueue([]); }}
              className="mt-4 w-full text-xs font-sans font-bold uppercase tracking-wider text-[#1a1a1a]/40 border border-[#1a1a1a]/10 py-2 hover:text-[#1a1a1a] hover:border-[#1a1a1a]/30">
              End session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // When a product is selected for pricing — the App component will handle routing.
  // For now, show the pricing link.
  if (selectedProductId) {
    return (
      <div className="bg-white border border-[#1a1a1a]/15 p-8 text-center">
        <p className="text-sm font-sans text-[#1a1a1a]/60 mb-4">
          Product {selectedProductId} ready for pricing. The pricing module will load next.
        </p>
        <button onClick={() => setSelectedProductId(null)}
          className="text-xs font-sans font-bold text-[#b45309] uppercase tracking-wider">
          ← Back to onboarding queue
        </button>
      </div>
    );
  }

  // Entry screen
  return (
    <div className="bg-white border border-[#1a1a1a]/15 p-8 md:p-12 flex flex-col items-center text-center max-w-lg mx-auto">
      <Users className="h-12 w-12 text-[#b45309] mb-5" />
      <h3 className="font-serif text-2xl font-bold text-[#1a1a1a]">{t("onboard.villageMode")}</h3>
      <p className="text-sm text-[#1a1a1a]/55 mt-2 font-serif max-w-sm">
        Onboard multiple weavers in one session. Each weaver's profile is clearly separated.
      </p>

      <div className="w-full mt-8">
        <label className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5 text-left">
          Your name (assistant)
        </label>
        <input className={inputClass} placeholder="e.g. Priya Sharma"
          value={assistantName} onChange={(e) => setAssistantName(e.target.value)} />
      </div>

      <button onClick={() => setActive(true)}
        className="mt-6 flex items-center gap-2 bg-[#b45309] hover:bg-[#92400e] text-white font-sans font-bold text-sm uppercase tracking-[0.15em] py-3.5 px-6 border border-[#b45309] transition-all">
        <Plus className="h-5 w-5" /> Start onboarding session
      </button>
    </div>
  );
}
