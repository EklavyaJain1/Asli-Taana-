/**
 * Module 3 — Demand Intelligence Dashboard for Weavers.
 *
 * Flips the platform from one-directional to two-directional: shows weavers
 * real signal on what to make next.
 *
 * Features (per spec):
 *  - Top 5 trending categories/colors/patterns this month (mock, structured).
 *  - "Buyers are searching for…" ticker of unmet queries (demand gap signal).
 *  - Suggested price range for the weaver's own craft type.
 *  - Regional map (simple list) showing which states/countries order most.
 *  - "Make this next" suggestion card combining trends + weaver's craft.
 *
 * DESIGN: icons, color-coded trend arrows (↑↓), minimal text — same low-literacy
 * friendly design as Module 1. Mobile-first responsive.
 */
import React, { useState, useEffect } from "react";
import {
  TrendingUp, TrendingDown, Minus, Search, Globe,
  Sparkles, IndianRupee, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMarketplace } from "../../marketplace/useMarketplaceStore";
import {
  TRENDING, UNMET_QUERIES, REGIONAL_DEMAND,
  priceRangeFor, suggestNextProduct,
} from "../../marketplace/demand";
import { SectionHeader, rupee } from "./primitives";

export default function DemandDashboard({ weaverId }: { weaverId?: string }) {
  const { t } = useLanguage();
  const db = useMarketplace();

  // Find the weaver's craft for contextual suggestions
  const weaver = weaverId ? db.weavers.find((w) => w.id === weaverId) : db.weavers[0];
  const craftType = weaver?.craftType || "Handloom";
  const priceRange = priceRangeFor(craftType);
  const suggestion = suggestNextProduct(craftType);

  // Ticker animation: rotate through unmet queries.
  const [tickerIdx, setTickerIdx] = useState(0);
  useEffect(() => {
    if (UNMET_QUERIES.length <= 1) return;
    const id = setInterval(() => setTickerIdx((i) => (i + 1) % UNMET_QUERIES.length), 4000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeader
        badge={t("demand.title")}
        title={t("demand.title")}
        subtitle={t("demand.subtitle")}
        icon={TrendingUp}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── TRENDING THIS MONTH ── */}
        <div className="bg-white border border-[#1a1a1a]/15 p-5">
          <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-4 flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5 text-[#b45309]" />
            {t("demand.trending")}
          </h4>
          <ul className="space-y-3">
            {TRENDING.map((item) => (
              <li key={item.rank} className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-[#1a1a1a]/5 border border-[#1a1a1a]/10 text-[10px] font-mono font-bold text-[#1a1a1a]/50 flex items-center justify-center shrink-0">
                  {item.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-serif font-bold text-[#1a1a1a] truncate">{item.label}</p>
                  <p className="text-[10px] font-sans text-[#1a1a1a]/40">
                    {t("demand.searches")}: {item.searches.toLocaleString()}
                  </p>
                </div>
                <TrendArrow trend={item.trend} pct={item.changePct} />
              </li>
            ))}
          </ul>
        </div>

        {/* ── RIGHT COLUMN: unmet queries + price range ── */}
        <div className="flex flex-col gap-6">

          {/* UNMET QUERIES TICKER */}
          <div className="bg-[#b45309]/5 border border-[#b45309]/30 p-5">
            <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#b45309] mb-3 flex items-center gap-2">
              <Search className="h-3.5 w-3.5" />
              {t("demand.unmet")}
            </h4>
            {UNMET_QUERIES.length > 0 && (
              <div className="min-h-[72px] flex items-start">
                <div key={tickerIdx} className="animate-[fadeIn_0.3s_ease-in-out]">
                  <p className="text-sm font-serif font-bold text-[#1a1a1a]">
                    "{UNMET_QUERIES[tickerIdx].query}"
                  </p>
                  <p className="text-[10px] font-sans text-[#1a1a1a]/50 mt-1">
                    <Globe className="h-3 w-3 inline mr-1" />{UNMET_QUERIES[tickerIdx].region}
                  </p>
                </div>
              </div>
            )}
            {/* Dots */}
            <div className="flex gap-1.5 mt-3 justify-center">
              {UNMET_QUERIES.map((_, i) => (
                <span key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === tickerIdx ? "bg-[#b45309] w-4" : "bg-[#1a1a1a]/15"}`} />
              ))}
            </div>
          </div>

          {/* PRICE RANGE for weaver's craft */}
          <div className="bg-white border border-[#1a1a1a]/15 p-5">
            <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
              <IndianRupee className="h-3.5 w-3.5 text-[#b45309]" />
              {t("demand.range")} <span className="text-[#1a1a1a]/40 lowercase normal-case">{t("demand.range.for")} {craftType}</span>
            </h4>
            <div className="flex items-end gap-2">
              <div className="flex-1 h-3 rounded-full bg-[#1a1a1a]/5 overflow-hidden relative">
                <div className="absolute inset-y-0 left-[10%] right-[10%] bg-gradient-to-r from-[#b45309]/20 via-[#b45309] to-[#b45309]/20 rounded-full" />
                <div className="absolute inset-y-0 left-[40%] right-[40%] bg-[#b45309] rounded-full" />
              </div>
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-mono text-[#1a1a1a]/60">
              <span>{rupee(priceRange.low)}</span>
              <span className="font-bold text-[#1a1a1a]">{rupee(priceRange.median)} <span className="text-[#1a1a1a]/40 normal-case lowercase">{t("demand.median")}</span></span>
              <span>{rupee(priceRange.high)}</span>
            </div>
          </div>

          {/* REGIONAL DEMAND */}
          <div className="bg-white border border-[#1a1a1a]/15 p-5">
            <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
              <Globe className="h-3.5 w-3.5 text-[#b45309]" />
              {t("demand.regions")}
            </h4>
            <ul className="space-y-2">
              {REGIONAL_DEMAND.slice(0, 5).map((r) => (
                <li key={r.region} className="flex items-center gap-3">
                  <span className="text-xs font-sans text-[#1a1a1a]/70 flex-1 truncate">{r.region}</span>
                  <div className="w-24 h-1.5 bg-[#1a1a1a]/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#b45309] rounded-full" style={{ width: `${r.sharePct * 3}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-[#1a1a1a]/50 w-8 text-right">{r.sharePct}%</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── MAKE THIS NEXT (suggestion card) ── */}
      <div className="bg-[#f9f8f4] border-2 border-[#b45309]/30 p-6 md:p-8 flex flex-col md:flex-row items-start gap-6">
        <div className="w-14 h-14 rounded-full bg-[#b45309]/10 border border-[#b45309]/30 flex items-center justify-center shrink-0">
          <Sparkles className="h-7 w-7 text-[#b45309]" />
        </div>
        <div className="flex-1">
          <span className="text-[9px] font-sans font-bold tracking-widest text-[#b45309] uppercase">
            {t("demand.next")}
          </span>
          <h3 className="font-serif text-xl md:text-2xl font-bold text-[#1a1a1a] mt-1">
            {suggestion.title}
          </h3>
          <p className="text-sm text-[#1a1a1a]/60 mt-2 font-serif leading-relaxed max-w-xl">
            {suggestion.reason}
          </p>
          {weaver && (
            <p className="text-[10px] text-[#1a1a1a]/40 mt-2 font-sans">
              {t("common.from")} <span className="font-bold text-[#1a1a1a]/60">{weaver.name}</span> · {craftType}
            </p>
          )}
        </div>
        {suggestion.trendRef && (
          <div className="flex items-center gap-2 text-xs font-sans">
            <TrendArrow trend={suggestion.trendRef.trend} pct={suggestion.trendRef.changePct} />
            <span className="text-[#1a1a1a]/50">{suggestion.trendRef.searches} {t("demand.searches")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Color-coded trend arrow component. */
function TrendArrow({ trend, pct }: { trend: "up" | "down" | "flat"; pct: number }) {
  if (trend === "up") {
    return (
      <span className="flex items-center gap-0.5 text-[#15803d] font-mono text-xs font-bold">
        <ArrowUpRight className="h-4 w-4" />+{pct}%
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="flex items-center gap-0.5 text-[#dc143c] font-mono text-xs font-bold">
        <ArrowDownRight className="h-4 w-4" />{pct}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[#1a1a1a]/40 font-mono text-xs font-bold">
      <Minus className="h-4 w-4" />{pct}%
    </span>
  );
}
