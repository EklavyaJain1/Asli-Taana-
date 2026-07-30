/**
 * Module 3 — Demand Intelligence Dashboard for Weavers (Bento edition).
 *
 * Redesigned as an interactive bento gallery:
 *  - Each metric lives in its own variably-sized bento tile.
 *  - Tiles stagger in on mount and lift on hover.
 *  - Clicking a tile opens a focused full-screen detail modal (shared-element
 *    layout animation morphs the tile into the modal).
 *  - A bottom dock lets the weaver jump between tiles (active chip scales up
 *    with a glow) — non-draggable, fixed at the bottom.
 *
 * Drag-to-reorder from the source pattern is intentionally removed: tiles stay
 * put so the layout is predictable for a low-literacy audience.
 *
 * All data sources, i18n keys, props and the default export are unchanged, so
 * this drops into App.tsx without any wiring changes.
 */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  TrendingUp, TrendingDown, Minus, Search, Globe,
  Sparkles, IndianRupee, ArrowUpRight, ArrowDownRight, X,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMarketplace } from "../../marketplace/useMarketplaceStore";
import {
  TRENDING, UNMET_QUERIES, REGIONAL_DEMAND,
  priceRangeFor, suggestNextProduct,
} from "../../marketplace/demand";
import { rupee } from "./primitives";
import { cn } from "../../lib/utils";

/** The five bento tiles, in DOM/grid order. */
const CARD_IDS = ["next", "unmet", "trending", "price", "region"] as const;
type CardId = (typeof CARD_IDS)[number];

/** Responsive grid spans per tile — hand-tuned to tile with zero gaps. */
const SPANS: Record<CardId, string> = {
  next:     "sm:col-span-2 md:col-span-2 md:row-span-2",
  unmet:    "sm:col-span-2 md:col-span-1 md:row-span-2",
  trending: "sm:col-span-2 md:col-span-2 md:row-span-3",
  price:    "sm:col-span-1 md:col-span-1 md:row-span-1",
  region:   "sm:col-span-1 md:col-span-1 md:row-span-2",
};

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

  // Currently focused tile (null = bento grid visible; set = detail modal open).
  const [selected, setSelected] = useState<CardId | null>(null);

  // Shared context passed into every tile's content renderer.
  const ctx = { t, craftType, weaver, priceRange, suggestion, tickerIdx };

  return (
    <div className="space-y-6">
      {/* ── Centered hero heading with a typewriter title ── */}
      <div className="text-center flex flex-col items-center pt-2 pb-1">
        <motion.span
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-1.5 text-[10px] sm:text-[11px] font-sans font-bold tracking-widest text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 px-3 py-1.5 uppercase mb-3"
        >
          <TrendingUp className="h-3 w-3" />
          {t("demand.subtitle")}
        </motion.span>

        <TypewriterTitle
          text={t("demand.title")}
          className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-[#1a1a1a] leading-tight min-h-[2.2em] sm:min-h-[2.4em] flex items-center justify-center"
        />

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xs sm:text-sm text-[#1a1a1a]/55 mt-2 font-serif max-w-xl"
        >
          {t("demand.unmet.hint")}
        </motion.p>
      </div>

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div key="modal">
            <DetailModal
              cardId={selected}
              onSelect={setSelected}
              onClose={() => setSelected(null)}
              renderContent={(id) => <CardContent id={id} expanded ctx={ctx} />}
            />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 auto-rows-[110px] md:auto-rows-[124px]"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              hidden: { opacity: 0 },
              visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
            }}
          >
            {CARD_IDS.map((id, index) => (
              <motion.button
                key={id}
                layoutId={`card-${id}`}
                onClick={() => setSelected(id)}
                variants={{
                  hidden: { y: 40, scale: 0.92, opacity: 0 },
                  visible: {
                    y: 0, scale: 1, opacity: 1,
                    transition: { type: "spring", stiffness: 320, damping: 26, delay: index * 0.05 },
                  },
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.99 }}
                className={`group relative overflow-hidden rounded-2xl border border-[#1a1a1a]/10 bg-white text-left
                            shadow-sm hover:shadow-md transition-shadow cursor-pointer min-h-[120px]
                            ${SPANS[id]}`}
              >
                <CardContent id={id} expanded={false} ctx={ctx} />
                {/* hover sheen to signal interactivity */}
                <span className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-[#b45309]/0 via-[#b45309]/0 to-[#b45309]/0 group-hover:to-[#b45309]/5 transition-colors" />
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ───────────────────────── Typewriter title ───────────────────────── */

/**
 * Reveals `text` one character at a time with a blinking caret.
 * Re-runs whenever the text changes (e.g. language switch). On mobile the
 * step interval is slightly faster so multi-word titles finish quickly.
 */
function TypewriterTitle({ text, className }: { text: string; className?: string }) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown("");
    setDone(false);
    let i = 0;
    const step = window.innerWidth < 640 ? 38 : 55; // ms per char
    const id = setInterval(() => {
      i += 1;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(id);
        setDone(true);
      }
    }, step);
    return () => clearInterval(id);
  }, [text]);

  return (
    <h2 className={cn(className)}>
      <span>{shown}</span>
      <span
        aria-hidden
        className={cn("inline-block w-[3px] align-baseline -mb-[0.1em] ml-1 bg-[#b45309]", done && "animate-[caretBlink_1s_step-end_infinite]")}
        style={{ height: "0.85em" }}
      />
    </h2>
  );
}

/* ───────────────────────── Detail modal + dock ───────────────────────── */

interface DetailModalProps {
  cardId: CardId;
  onSelect: (id: CardId) => void;
  onClose: () => void;
  renderContent: (id: CardId) => React.ReactNode;
}

function DetailModal({ cardId, onSelect, onClose, renderContent }: DetailModalProps): React.ReactElement {
  return (
    <>
      {/* Backdrop — sits above the sticky header so it doesn't bleed through */}
      <motion.div
        className="fixed inset-0 z-[55] bg-[#1a1a1a]/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Focused card — morphs out of the clicked tile via shared layoutId */}
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
        <motion.div
          layoutId={`card-${cardId}`}
          className="pointer-events-auto relative w-full max-w-2xl max-h-[80vh] overflow-auto
                     rounded-2xl border border-[#1a1a1a]/10 bg-white shadow-2xl"
          initial={{ scale: 0.96 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 md:p-8">
            {renderContent(cardId)}
          </div>

          {/* Close */}
          <motion.button
            className="absolute top-3 right-3 p-2 rounded-full bg-[#1a1a1a]/5 text-[#1a1a1a]/60 hover:bg-[#1a1a1a]/10"
            onClick={onClose}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </motion.div>
      </div>

      {/* Bottom dock — jump between tiles (fixed, not draggable). Raised above
          the modal + kept on top so it never gets underlaid by content. */}
      <motion.div
        className="fixed z-[70] bottom-10 sm:bottom-12 left-1/2 -translate-x-1/2 px-4"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 30, opacity: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 px-3 py-2 rounded-2xl border border-[#b45309]/20 bg-white/80 backdrop-blur-xl shadow-lg">
          {CARD_IDS.map((id, index) => {
            const Icon = DOCK_ICON[id];
            const active = id === cardId;
            return (
              <motion.button
                key={id}
                onClick={() => onSelect(id)}
                className="relative flex items-center justify-center rounded-xl"
                initial={{ rotate: index % 2 === 0 ? -12 : 12 }}
                animate={{
                  scale: active ? 1.18 : 1,
                  rotate: active ? 0 : index % 2 === 0 ? -12 : 12,
                  y: active ? -4 : 0,
                }}
                whileHover={{ scale: 1.28, rotate: 0, y: -6 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                style={{ zIndex: active ? 30 : 10 }}
                aria-label={DOCK_LABEL[id]}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-colors
                    ${active
                      ? "border-[#b45309] bg-[#b45309]/10 text-[#b45309]"
                      : "border-[#1a1a1a]/10 bg-white text-[#1a1a1a]/50 hover:text-[#1a1a1a]"}`}
                >
                  <Icon className="h-4 w-4" />
                </span>
                {active && (
                  <motion.span
                    layoutId="activeGlow"
                    className="absolute -inset-1 -z-10 rounded-2xl bg-[#b45309]/15 blur-md"
                    transition={{ duration: 0.2 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </>
  );
}

const DOCK_ICON: Record<CardId, React.ElementType> = {
  next: Sparkles, unmet: Search, trending: TrendingUp, price: IndianRupee, region: Globe,
};
const DOCK_LABEL: Record<CardId, string> = {
  next: "Make this next", unmet: "Unmet searches", trending: "Trending", price: "Price range", region: "Regions",
};

/* ───────────────────────── Tile content ───────────────────────── */

interface Ctx {
  t: (k: string) => string;
  craftType: string;
  weaver?: { name: string };
  priceRange: { low: number; median: number; high: number };
  suggestion: { title: string; reason: string; trendRef?: { trend: "up" | "down" | "flat"; changePct: number; searches: number } };
  tickerIdx: number;
}

/**
 * Renders a tile's inner content. `expanded` toggles between the compact
 * bento preview (truncated) and the full detail shown in the modal.
 */
function CardContent({ id, expanded, ctx }: { id: CardId; expanded: boolean; ctx: Ctx }) {
  const { t } = ctx;

  if (id === "next") {
    return (
      <div className="flex h-full flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#b45309]/10 border border-[#b45309]/30">
            <Sparkles className="h-5 w-5 text-[#b45309]" />
          </span>
          <div className="min-w-0">
            <span className="text-[9px] font-sans font-bold tracking-widest text-[#b45309] uppercase">
              {t("demand.next")}
            </span>
            <h3 className="font-serif text-base md:text-lg font-bold text-[#1a1a1a] leading-tight">
              {ctx.suggestion.title}
            </h3>
          </div>
        </div>
        <div>
          <p className={`text-xs md:text-sm text-[#1a1a1a]/60 font-serif leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
            {ctx.suggestion.reason}
          </p>
          <div className="mt-2 flex items-center gap-3 text-[10px] font-sans text-[#1a1a1a]/40">
            {ctx.weaver && <span>{t("common.from")} <b className="text-[#1a1a1a]/70">{ctx.weaver.name}</b> · {ctx.craftType}</span>}
            {expanded && ctx.suggestion.trendRef && (
              <span className="flex items-center gap-1">
                <TrendArrow trend={ctx.suggestion.trendRef.trend} pct={ctx.suggestion.trendRef.changePct} />
                <span>· {ctx.suggestion.trendRef.searches} {t("demand.searches")}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (id === "unmet") {
    const list = expanded ? UNMET_QUERIES : [UNMET_QUERIES[ctx.tickerIdx]];
    return (
      <div className={`p-4 sm:p-5 ${expanded ? "space-y-3" : "flex h-full flex-col justify-between"}`}>
        <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#b45309] flex items-center gap-2">
          <Search className="h-3.5 w-3.5" />{t("demand.unmet")}
        </h4>
        <div className={expanded ? "space-y-2" : "flex-1 flex flex-col justify-center"}>
          {list.map((q, i) => (
            <div key={q.id} className={!expanded && i === 0 ? "animate-[fadeIn_0.3s_ease-in-out]" : ""}>
              <p className="text-sm font-serif font-bold text-[#1a1a1a] line-clamp-2">“{q.query}”</p>
              <p className="text-[10px] font-sans text-[#1a1a1a]/50 mt-0.5">
                <Globe className="h-3 w-3 inline mr-1" />{q.region}
              </p>
            </div>
          ))}
        </div>
        {!expanded && (
          <div className="flex gap-1.5 justify-center">
            {UNMET_QUERIES.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all ${i === ctx.tickerIdx ? "bg-[#b45309] w-4" : "bg-[#1a1a1a]/15 w-1.5"}`} />
            ))}
          </div>
        )}
      </div>
    );
  }

  if (id === "trending") {
    const items = expanded ? TRENDING : TRENDING.slice(0, 3);
    return (
      <div className="p-4 sm:p-5">
        <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
          <TrendingUp className="h-3.5 w-3.5 text-[#b45309]" />{t("demand.trending")}
        </h4>
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.rank} className="flex items-center gap-3">
              <span className="w-6 h-6 shrink-0 rounded-full bg-[#1a1a1a]/5 border border-[#1a1a1a]/10 text-[10px] font-mono font-bold text-[#1a1a1a]/50 flex items-center justify-center">
                {item.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-serif font-bold text-[#1a1a1a] truncate">{item.label}</p>
                <p className="text-[10px] font-sans text-[#1a1a1a]/40">{t("demand.searches")}: {item.searches.toLocaleString()}</p>
              </div>
              <TrendArrow trend={item.trend} pct={item.changePct} />
            </li>
          ))}
        </ul>
        {!expanded && TRENDING.length > 3 && (
          <p className="mt-3 text-[10px] font-sans text-[#1a1a1a]/40">+{TRENDING.length - 3} more</p>
        )}
      </div>
    );
  }

  if (id === "price") {
    const { low, median, high } = ctx.priceRange;
    return (
      <div className="p-4 sm:p-5">
        <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
          <IndianRupee className="h-3.5 w-3.5 text-[#b45309]" />
          {t("demand.range")} <span className="text-[#1a1a1a]/40 lowercase normal-case">{t("demand.range.for")} {ctx.craftType}</span>
        </h4>
        <div className="relative h-3 rounded-full bg-[#1a1a1a]/5 overflow-hidden">
          <div className="absolute inset-y-0 left-[10%] right-[10%] bg-gradient-to-r from-[#b45309]/20 via-[#b45309] to-[#b45309]/20 rounded-full" />
          <div className="absolute inset-y-0 left-[40%] right-[40%] bg-[#b45309] rounded-full" />
        </div>
        <div className="flex justify-between mt-2 text-[10px] font-mono text-[#1a1a1a]/60">
          <span>{rupee(low)}</span>
          <span className="font-bold text-[#1a1a1a]">{rupee(median)} <span className="text-[#1a1a1a]/40 lowercase">{t("demand.median")}</span></span>
          <span>{rupee(high)}</span>
        </div>
      </div>
    );
  }

  // region
  const items = expanded ? REGIONAL_DEMAND.slice(0, 5) : REGIONAL_DEMAND.slice(0, 3);
  return (
    <div className="p-4 sm:p-5">
      <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-3 flex items-center gap-2">
        <Globe className="h-3.5 w-3.5 text-[#b45309]" />{t("demand.regions")}
      </h4>
      <ul className="space-y-2">
        {items.map((r) => (
          <li key={r.region} className="flex items-center gap-2.5">
            <span className="text-xs font-sans text-[#1a1a1a]/70 flex-1 truncate">{r.region}</span>
            <div className="w-16 h-1.5 bg-[#1a1a1a]/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#b45309] rounded-full" style={{ width: `${r.sharePct * 3}%` }} />
            </div>
            <span className="text-[10px] font-mono text-[#1a1a1a]/50 w-7 text-right">{r.sharePct}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Color-coded trend arrow component. */
function TrendArrow({ trend, pct }: { trend: "up" | "down" | "flat"; pct: number }) {
  if (trend === "up") {
    return (
      <span className="flex items-center gap-0.5 text-[#15803d] font-mono text-xs font-bold shrink-0">
        <ArrowUpRight className="h-4 w-4" />+{pct}%
      </span>
    );
  }
  if (trend === "down") {
    return (
      <span className="flex items-center gap-0.5 text-[#dc143c] font-mono text-xs font-bold shrink-0">
        <ArrowDownRight className="h-4 w-4" />{pct}%
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-[#1a1a1a]/40 font-mono text-xs font-bold shrink-0">
      <Minus className="h-4 w-4" />{pct}%
    </span>
  );
}
