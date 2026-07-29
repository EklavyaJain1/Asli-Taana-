/**
 * Public buyer-facing Storefront.
 *
 * Shows only published products with the Fairness Badge and a visible price
 * breakdown summary. Clicking "See price breakdown" links to Module 2's full
 * view. This is the buyer-facing end of the demo loop.
 */
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User, MapPin, Eye, IndianRupee,
  CheckCircle2, AlertTriangle, XCircle, Store,
  ArrowUpRight, ArrowRight, X,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMarketplace, getWeaver } from "../../marketplace/useMarketplaceStore";
import { SectionHeader, rupee } from "./primitives";
import type { FairnessLevel } from "../../marketplace/types";
import PriceBreakdownView from "./PriceBreakdownView";

/**
 * Per-product color theme.
 *
 * Each card carries its OWN light gradient background (never flat, never black)
 * derived from the product's craft/material so the gallery feels curated rather
 * than uniform. If the product ships explicit colors we honor them; otherwise
 * we sniff the craft type for a fitting palette, and finally fall back to a
 * rotating set of tasteful earth/jewel tones.
 */
const PRODUCT_THEMES = [
  { name: "ivory",     tint: "#faf6ef", accent: "#d4af37" }, // gold/ivory
  { name: "crimson",   tint: "#fbeaea", accent: "#b91c1c" }, // kanchipuram red
  { name: "emerald",   tint: "#e7f3ec", accent: "#15803d" }, // banarasi green
  { name: "indigo",    tint: "#e8edf5", accent: "#1e3a8a" }, // jamdani blue
  { name: "plum",      tint: "#f1ebf3", accent: "#7c3aed" }, // chanderi purple
  { name: "terracotta",tint: "#f6ece4", accent: "#c2410c" }, // kota earth
];

function productTheme(product: any, index: number) {
  // 1) Honour explicit product colors if present
  if (product.colors && product.colors.length) {
    const c = product.colors[0];
    return { tint: c + "22", accent: c, glow: c };
  }
  const hay = `${product.craftType || ""} ${product.material || ""} ${product.title || ""} ${product.category || ""}`.toLowerCase();
  // 2) Sniff craft / material keywords for a fitting palette
  if (/silk|zari|kanchipuram|temple/.test(hay)) return { tint: "#fbeaea", accent: "#b91c1c", glow: "#b91c1c" };
  if (/cotton|kasavu|kerala/.test(hay))          return { tint: "#faf6ef", accent: "#d4af37", glow: "#d4af37" };
  if (/banarasi|green/.test(hay))                return { tint: "#e7f3ec", accent: "#15803d", glow: "#15803d" };
  if (/jamdani|linen|blue/.test(hay))            return { tint: "#e8edf5", accent: "#1e3a8a", glow: "#1e3a8a" };
  if (/chanderi|chikankari/.test(hay))           return { tint: "#f1ebf3", accent: "#7c3aed", glow: "#7c3aed" };
  // 3) Rotate curated palette
  const t = PRODUCT_THEMES[index % PRODUCT_THEMES.length];
  return { tint: t.tint, accent: t.accent, glow: t.accent };
}

export default function Storefront({
  onSelectProduct,
  selectedProductId,
  onCloseProduct,
  onPublished,
}: {
  onSelectProduct?: (id: string) => void;
  selectedProductId?: string;
  onCloseProduct?: () => void;
  onPublished?: () => void;
}) {
  const { t } = useLanguage();
  const db = useMarketplace();
  const published = db.products.filter((p) => p.published);
  const isOpen = !!selectedProductId;

  // Lock body scroll while the detail overlay is open.
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("overflow-hidden");
      return () => document.body.classList.remove("overflow-hidden");
    }
  }, [isOpen]);

  return (
    <div className="space-y-6">
      <SectionHeader
        badge={t("store.title")}
        title={t("store.title")}
        subtitle={t("store.subtitle")}
        icon={Store}
      />

      {published.length === 0 ? (
        <div className="bg-white border border-[#1a1a1a]/15 p-12 text-center text-[#1a1a1a]/50 font-serif italic text-lg">
          {t("store.empty")}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden" animate="show"
          variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } }}
        >
          {published.map((product, i) => {
            const weaver = getWeaver(product.weaverId);
            const theme = productTheme(product, i);
            return (
              <ProductCard
                key={product.id}
                product={product}
                weaver={weaver}
                theme={theme}
                // The selected card shares its layoutId with the detail overlay
                // so Framer Motion morphs it open / shut. Non-selected cards
                // keep their normal entrance animation.
                isActive={selectedProductId === product.id}
                onSelectProduct={onSelectProduct}
              />
            );
          })}
        </motion.div>
      )}

      {/* ── In-place detail overlay (card → detail morph) ──
          The overlay shares the same layoutId as the active card so the
          expand/collapse is a continuous shared-layout animation, exactly the
          effect from the linear-card component. The nav stays on "store". */}
      <AnimatePresence>
        {isOpen && selectedProductId && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-40 bg-[#1a1a1a]/40 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseProduct}
            />
            {/* Detail panel — morphs from the clicked card */}
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-8">
              <motion.div
                layoutId={`product-card-${selectedProductId}`}
                className="relative w-full max-w-3xl bg-[#fcf8f2] rounded-2xl border border-[#1a1a1a]/15 shadow-2xl overflow-hidden my-4"
                transition={{ type: "spring", bounce: 0.05, duration: 0.5 }}
              >
                {/* Close button */}
                <button
                  onClick={onCloseProduct}
                  className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[#1a1a1a] text-white flex items-center justify-center hover:bg-[#b45309] transition-colors"
                  aria-label="Close"
                >
                  <X className="h-4 w-4" />
                </button>

                {/* The real price breakdown module renders inside the morphed panel */}
                <PriceBreakdownView
                  productId={selectedProductId}
                  onPublished={onPublished}
                  onViewStore={onCloseProduct}
                />
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductCard({
  product,
  weaver,
  theme,
  isActive,
  onSelectProduct,
}: {
  key?: string;
  product: any;
  weaver: any;
  theme: { tint: string; accent: string; glow: string };
  isActive?: boolean;
  onSelectProduct?: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const fairnessConfig: Record<FairnessLevel, { label: string; color: string; icon: React.ElementType }> = {
    fair: { label: t("store.fairBadge"), color: "#137333", icon: CheckCircle2 },
    review: { label: t("price.review"), color: "#b45309", icon: AlertTriangle },
    below: { label: t("price.below"), color: "#c5221f", icon: XCircle },
  };

  const badge = fairnessConfig[product.fairness];
  const payoutPct = Math.round(
    (product.priceBreakdown.rawMaterial + product.priceBreakdown.laborHours * product.priceBreakdown.wagePerHour)
    / product.price * 100
  );

  const title = product.title || "Handloom Saree";
  const category = product.category || product.craftType || product.aiSuggestedCategory || "Handloom";

  return (
    <motion.article
      // When this card is the active (selected) one, it shares a layoutId with
      // the detail overlay, so Framer Motion morphs the card into the overlay
      // and back. Non-active cards just animate in normally.
      layoutId={isActive ? `product-card-${product.id}` : undefined}
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } } }}
      className="group relative rounded-2xl flex flex-col overflow-hidden border border-[#1a1a1a]/10"
      style={{
        // Light per-product gradient: tint fades to near-white, never dark.
        background: `linear-gradient(165deg, ${theme.tint} 0%, #ffffff 60%, ${theme.tint} 100%)`,
      }}
      whileHover={{
        y: -5,
        boxShadow: `0 22px 45px -20px ${theme.glow}66`,
        borderColor: `${theme.accent}66`,
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSelectProduct?.(product.id)}
      role="button"
      tabIndex={0}
    >
      {/* ── Image ── shorter ratio, ambient tinted glow behind ── */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {/* Ambient glow blob — tinted to the product, softens the image edge */}
        <div
          className="absolute -inset-6 z-0 blur-2xl opacity-40"
          style={{ background: `radial-gradient(circle at 50% 40%, ${theme.glow}, transparent 70%)` }}
          aria-hidden
        />
        {product.photo ? (
          <motion.img
            src={product.photo}
            alt={title}
            className="relative z-10 m-2 rounded-xl w-[calc(100%-1rem)] h-[calc(100%-1rem)] object-cover shadow-md"
            animate={{ scale: isHovered ? 1.06 : 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          />
        ) : (
          <div
            className="relative z-10 m-2 rounded-xl w-[calc(100%-1rem)] h-[calc(100%-1rem)] flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${theme.accent}33, ${theme.tint})` }}
          >
            <IndianRupee className="h-10 w-10 text-[#1a1a1a]/20" />
          </div>
        )}

        {/* Fairness badge — top-left */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1 bg-white/90 backdrop-blur-sm border border-[#1a1a1a]/10 px-2 py-1 shadow-sm rounded-full">
          <badge.icon className="h-3 w-3" style={{ color: badge.color }} />
          <span className="text-[8px] font-sans font-bold tracking-widest uppercase" style={{ color: badge.color }}>
            {badge.label}
          </span>
        </div>

        {/* Mono product ID — top-right */}
        <div className="absolute top-3 right-3 z-20 bg-[#1a1a1a]/85 backdrop-blur-sm px-1.5 py-0.5 rounded-full">
          <span className="text-[8px] font-mono font-medium tracking-wider text-white/90">
            {product.id}
          </span>
        </div>
      </div>

      {/* ── Body ── compact placard ── */}
      <div className="flex flex-col flex-1 px-3.5 pt-2.5 pb-3">
        {/* Eyebrow: category · material */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span className="text-[8px] font-sans font-bold tracking-widest uppercase" style={{ color: theme.accent }}>
            {category}
          </span>
          <span className="h-px flex-1 bg-[#1a1a1a]/10" />
          <span className="text-[8px] font-sans font-medium tracking-wider text-[#1a1a1a]/45 uppercase">
            {product.material}
          </span>
        </div>

        {/* Title — Crimson Pro serif */}
        <h3 className="font-serif font-bold text-[#1a1a1a] text-base leading-snug mb-1.5 line-clamp-2">
          {title}
        </h3>

        {/* Weaver attribution */}
        {weaver && (
          <div className="flex items-center gap-1.5 text-[11px] text-[#1a1a1a]/60 mb-2">
            <User className="h-3 w-3 shrink-0" style={{ color: theme.accent }} />
            <span className="font-serif italic">
              {weaver.name}
              {weaver.village ? `, ${weaver.village}` : ""}
            </span>
          </div>
        )}

        <div className="flex-1" />

        {/* Divider */}
        <div className="h-px w-full mb-2.5" style={{ background: `${theme.accent}33` }} />

        {/* Footer: price + weaver share + CTA */}
        <div className="flex items-end justify-between">
          <div>
            <span className="block text-[7px] font-sans font-semibold tracking-widest text-[#1a1a1a]/40 uppercase mb-0.5">
              {t("store.price") || "Price"}
            </span>
            <span className="text-sm font-mono font-semibold text-[#1a1a1a]">
              {rupee(product.price)}
            </span>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[7px] font-sans font-semibold tracking-widest text-[#1a1a1a]/40 uppercase">
              {t("store.weaverShare") || "Weaver"}
            </span>
            <motion.span
              className="text-[11px] font-mono font-semibold"
              style={{ color: theme.accent }}
              animate={{ scale: isHovered ? 1.05 : 1 }}
            >
              {payoutPct}%
            </motion.span>
          </div>
        </div>

        {/* View CTA */}
        <motion.div
          className="mt-2.5 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-white text-[9px] font-sans font-bold tracking-widest uppercase"
          style={{ backgroundColor: isHovered ? theme.accent : "#1a1a1a" }}
          animate={{}}
          transition={{ duration: 0.25 }}
        >
          {t("store.viewDetails") || "View Details"}
          <ArrowRight className="h-3 w-3" />
        </motion.div>
      </div>
    </motion.article>
  );
}
