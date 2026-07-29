/**
 * Module 2 — Fair Pricing & Anti-Exploitation Engine.
 *
 * The MOST VISUALLY PROMINENT element on the product page (per spec).
 * Every rupee is visible: raw material, labor, platform fee, logistics,
 * and the weaver payout — shown as a Recharts PieChart with the payout
 * slice intentionally the largest and most prominent.
 *
 * Features:
 *  - Editable breakdown fields (raw material, hours, wage, logistics).
 *  - Auto-suggested fair wage from the weaver's state minimum wage.
 *  - Fairness Score badge (Fair / Needs Review / Below Threshold).
 *  - Suggested minimum price when the verdict is "below".
 *  - Provenance hash (mock on-chain fingerprint of the breakdown).
 *  - Immutable edit ledger (tamper-visible).
 *  - Publish action (blocked if fairness === "below").
 */
import React, { useState, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  ShieldCheck, AlertTriangle, XCircle, IndianRupee,
  Clock, Truck, Landmark, Eye, CheckCircle2, ArrowRight,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMarketplace, useMarketplaceActions, getWeaver } from "../../marketplace/useMarketplaceStore";
import {
  computeBreakdown, fairnessFor, suggestedMinPrice,
  wageForState, FAIR_WAGE_BENCHMARK, CHART_COLORS,
  FAIRNESS_FAIR_THRESHOLD,
} from "../../marketplace/pricing";
import type { PriceBreakdown, Product } from "../../marketplace/types";
import { SectionHeader, BigButton, Field, inputClass, rupee } from "./primitives";

export default function PriceBreakdownView({
  productId,
  onPublished,
  onViewStore,
}: {
  productId: string;
  onPublished?: () => void;
  onViewStore?: () => void;
}) {
  const { t } = useLanguage();
  const db = useMarketplace();
  const actions = useMarketplaceActions();

  const product = db.products.find((p) => p.id === productId);
  const weaver = product ? getWeaver(product.weaverId) : null;

  // Local editing state (commits to store on Save).
  const [edit, setEdit] = useState<PriceBreakdown>(
    product?.priceBreakdown || { rawMaterial: 0, laborHours: 0, wagePerHour: FAIR_WAGE_BENCHMARK, platformFeePct: 8, logistics: 0 },
  );
  const [dirty, setDirty] = useState(false);

  // Auto-suggest wage from state
  const autoWage = useMemo(() => wageForState(weaver?.state), [weaver?.state]);
  const suggestedWage = autoWage;

  const computed = useMemo(() => computeBreakdown(edit), [edit]);
  const fairness = useMemo(() => fairnessFor(computed.payoutPct), [computed.payoutPct]);
  const sugMin = useMemo(() => suggestedMinPrice(edit), [edit]);

  const handleSave = () => {
    if (!product) return;
    actions.updatePriceBreakdown(product.id, edit);
    setDirty(false);
  };

  const handlePublish = () => {
    if (!product || fairness === "below") return;
    handleSave();
    actions.publishProduct(product.id);
    onPublished?.();
  };

  const handleFieldChange = (field: keyof PriceBreakdown, value: number) => {
    setEdit((e) => ({ ...e, [field]: Math.max(0, value) }));
    setDirty(true);
  };

  if (!product) {
    return (
      <div className="bg-white border border-[#1a1a1a]/15 p-8 text-center text-[#1a1a1a]/50 font-serif">
        {t("store.empty")}
      </div>
    );
  }

  // ── Chart data (payout as biggest slice) ──
  const chartData = [
    { name: t("price.raw"), value: edit.rawMaterial, fill: CHART_COLORS.rawMaterial },
    { name: t("price.labor"), value: computed.laborCost, fill: CHART_COLORS.labor },
    { name: t("price.logistics"), value: edit.logistics, fill: CHART_COLORS.logistics },
    { name: t("price.platform"), value: computed.platformFee, fill: CHART_COLORS.platform },
    { name: t("price.payout"), value: computed.payout, fill: CHART_COLORS.payout },
  ].filter((d) => d.value > 0);

  // ── Fairness badge config ──
  const badge: { level: string; color: string; bg: string; border: string; icon: React.ElementType } =
    fairness === "fair"
      ? { level: t("price.fair"), color: "text-[#15803d]", bg: "bg-[#15803d]/5", border: "border-[#15803d]/30", icon: ShieldCheck }
      : fairness === "review"
        ? { level: t("price.review"), color: "text-[#b45309]", bg: "bg-[#b45309]/5", border: "border-[#b45309]/30", icon: AlertTriangle }
        : { level: t("price.below"), color: "text-[#dc143c]", bg: "bg-[#dc143c]/5", border: "border-[#dc143c]/30", icon: XCircle };
  const BadgeIcon = badge.icon;

  return (
    <div className="space-y-6">
      <SectionHeader
        badge={t("price.title")}
        title={product.title}
        subtitle={product.craftType ? `${product.craftType} · ${t("price.subtitle")}` : t("price.subtitle")}
      />

      {/* ── TOP ROW: Pie chart (hero) + fairness badge ── */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">

        {/* Pie chart — 3 cols, the visual anchor */}
        <div className="md:col-span-3 bg-white border border-[#1a1a1a]/15 p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]/40">
              {t("price.title")}
            </span>
            <span className="font-mono text-lg font-bold text-[#1a1a1a]">{rupee(computed.total)}</span>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={110}
                paddingAngle={3} dataKey="value" stroke="none">
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v: number) => rupee(v)}
                contentStyle={{ fontFamily: "'Inter', sans-serif", fontSize: 12, border: "1px solid #1a1a1a/15", borderRadius: 0 }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {chartData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-[11px] font-sans">
                <span className="w-3 h-3 border border-[#1a1a1a]/10 shrink-0" style={{ backgroundColor: d.fill }} />
                <span className="text-[#1a1a1a]/70 flex-1 truncate">{d.name}</span>
                <span className="font-mono font-bold text-[#1a1a1a]">{rupee(d.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: fairness + payout share + provenance */}
        <div className="md:col-span-2 flex flex-col gap-4">

          {/* Fairness badge */}
          <div className={`${badge.bg} ${badge.border} border p-4 flex items-center gap-3`}>
            <BadgeIcon className={`h-8 w-8 ${badge.color}`} />
            <div>
              <span className="text-[10px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]/40">
                {t("price.fairness")}
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className={`text-xl font-serif font-bold ${badge.color}`}>{badge.level}</span>
                <span className="text-xs font-mono text-[#1a1a1a]/50">
                  {Math.round(computed.payoutPct)}%
                </span>
              </div>
            </div>
          </div>

          {/* Payout share */}
          <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 p-4">
            <span className="block text-[10px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]/50 mb-1">
              {t("price.payout")}
            </span>
            <span className="block text-2xl font-serif font-bold text-[#1a1a1a]">{rupee(computed.payout)}</span>
            <span className="block text-[11px] text-[#1a1a1a]/55 mt-0.5 font-sans">
              {Math.round(computed.payoutPct)}% {t("price.payoutShare")}
            </span>
            {weaver && (
              <span className="block text-[11px] text-[#b45309] mt-2 font-sans font-bold">
                {t("price.recipient")} {weaver.name}
              </span>
            )}
          </div>

          {/* Below-threshold warning + suggested min */}
          {fairness === "below" && (
            <div className="bg-[#dc143c]/5 border border-[#dc143c]/30 p-4">
              <XCircle className="h-5 w-5 text-[#dc143c] mb-1" />
              <p className="text-xs text-[#dc143c] font-sans font-bold">
                {t("price.cantPublish")}
              </p>
              <p className="text-[11px] text-[#1a1a1a]/60 mt-1 font-sans">
                {t("price.suggestedMin")}: <strong className="text-[#1a1a1a]">{rupee(sugMin)}</strong>
              </p>
            </div>
          )}

          {/* Provenance hash */}
          {product.provenanceHash && (
            <div className="bg-white border border-[#1a1a1a]/10 p-3 flex items-center gap-2">
              <Eye className="h-3.5 w-3.5 text-[#1a1a1a]/40 shrink-0" />
              <span className="text-[9px] font-mono text-[#1a1a1a]/40 uppercase tracking-wider truncate">
                {t("price.provenance")}: {product.provenanceHash}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── EDITABLE BREAKDOWN ── */}
      <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 p-6">
        <div className="flex items-center justify-between mb-5">
          <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]">
            Edit breakdown
          </h4>
          {dirty && (
            <button onClick={handleSave} className="text-xs font-sans font-bold uppercase tracking-wider text-[#b45309] hover:text-[#92400e] flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> {t("common.save")}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <Field label={t("price.raw")}>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a1a1a]/40" />
              <input type="number" min={0} className={`${inputClass} pl-8`}
                value={edit.rawMaterial} onChange={(e) => handleFieldChange("rawMaterial", +e.target.value)} />
            </div>
          </Field>

          <Field label={t("price.hours")}>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a1a1a]/40" />
              <input type="number" min={0} className={`${inputClass} pl-8`}
                value={edit.laborHours} onChange={(e) => handleFieldChange("laborHours", +e.target.value)} />
            </div>
          </Field>

          <Field label={`${t("price.wage")} (${t("price.autoWage")}: ${rupee(suggestedWage)})`}>
            <div className="relative">
              <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a1a1a]/40" />
              <input type="number" min={0} className={`${inputClass} pl-8`}
                value={edit.wagePerHour} onChange={(e) => handleFieldChange("wagePerHour", +e.target.value)} />
            </div>
          </Field>

          <Field label={t("price.logistics")}>
            <div className="relative">
              <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1a1a1a]/40" />
              <input type="number" min={0} className={`${inputClass} pl-8`}
                value={edit.logistics} onChange={(e) => handleFieldChange("logistics", +e.target.value)} />
            </div>
          </Field>
        </div>

        {/* Platform fee (fixed, read-only display) */}
        <div className="mt-4 pt-4 border-t border-[#1a1a1a]/10 flex items-center gap-3 text-xs font-sans text-[#1a1a1a]/60">
          <span className="font-bold uppercase tracking-wider">{t("price.platform")}: {edit.platformFeePct}{t("price.platform.pct")}</span>
          <span className="flex-1" />
          <span>= {rupee(computed.platformFee)}</span>
        </div>
      </div>

      {/* ── ACTIONS ── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {!product.published ? (
          <BigButton
            variant="secondary"
            icon={ShieldCheck}
            disabled={fairness === "below"}
            onClick={handlePublish}
          >
            {fairness === "below" ? t("price.cantPublish").split(".")[0] : t("price.publish")}
          </BigButton>
        ) : (
          <div className="flex items-center gap-2 text-sm font-sans font-bold text-[#15803d] uppercase tracking-wider bg-[#15803d]/5 border border-[#15803d]/30 px-5 py-4">
            <CheckCircle2 className="h-5 w-5" /> {t("price.published")}
          </div>
        )}
        {product.published && onViewStore && (
          <BigButton variant="ghost" icon={ArrowRight} onClick={onViewStore}>
            {t("store.title")}
          </BigButton>
        )}
      </div>

      {/* ── LEDGER (tamper-visible edit history) ── */}
      {product.ledger.length > 1 && (
        <details className="bg-white border border-[#1a1a1a]/10">
          <summary className="p-4 text-[10px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]/50 cursor-pointer hover:text-[#1a1a1a] flex items-center gap-2">
            <Eye className="h-3.5 w-3.5" /> {t("price.ledger")} ({product.ledger.length})
          </summary>
          <div className="border-t border-[#1a1a1a]/10">
            {[...product.ledger].reverse().map((entry, i) => (
              <div key={i} className="px-4 py-2.5 text-[11px] font-sans text-[#1a1a1a]/60 flex items-center gap-3 border-b border-[#1a1a1a]/5 last:border-b-0">
                <span className="font-mono text-[#1a1a1a]/30 shrink-0">{new Date(entry.at).toLocaleString()}</span>
                <span className="font-bold text-[#1a1a1a]/70">{entry.action}</span>
                {entry.field && (
                  <>
                    <span className="text-[#1a1a1a]/40">{entry.from}</span>
                    <span className="text-[#b45309]">→</span>
                    <span className="font-bold text-[#1a1a1a]">{entry.to}</span>
                  </>
                )}
                {entry.fairness && (
                  <span className={`ml-auto text-[9px] font-bold uppercase tracking-wider ${
                    entry.fairness === "fair" ? "text-[#15803d]" : entry.fairness === "review" ? "text-[#b45309]" : "text-[#dc143c]"
                  }`}>
                    {entry.fairness}
                  </span>
                )}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
