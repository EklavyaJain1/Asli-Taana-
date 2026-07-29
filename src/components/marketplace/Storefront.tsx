/**
 * Public buyer-facing Storefront.
 *
 * Shows only published products with the Fairness Badge and a visible price
 * breakdown summary. Clicking "See price breakdown" links to Module 2's full
 * view. This is the buyer-facing end of the demo loop.
 */
import React, { useState } from "react";
import { motion } from "motion/react";
import {
  User, MapPin, Eye, IndianRupee,
  CheckCircle2, AlertTriangle, XCircle, Store,
  ArrowUpRight,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMarketplace, getWeaver } from "../../marketplace/useMarketplaceStore";
import { SectionHeader, rupee } from "./primitives";
import type { FairnessLevel } from "../../marketplace/types";

export default function Storefront({ onSelectProduct }: { onSelectProduct?: (id: string) => void }) {
  const { t } = useLanguage();
  const db = useMarketplace();
  const published = db.products.filter((p) => p.published);

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
          {published.map((product) => {
            const weaver = getWeaver(product.weaverId);
            return (
              <ProductCard
                key={product.id}
                product={product}
                weaver={weaver}
                onSelectProduct={onSelectProduct}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}

function ProductCard({
  product,
  weaver,
  onSelectProduct,
}: {
  key?: string;
  product: any;
  weaver: any;
  onSelectProduct?: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [isHovered, setIsHovered] = useState(false);

  const fairnessConfig: Record<FairnessLevel, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
    fair: { label: t("store.fairBadge"), color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", icon: CheckCircle2 },
    review: { label: t("price.review"), color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", icon: AlertTriangle },
    below: { label: t("price.below"), color: "text-rose-400", bg: "bg-rose-400/10", border: "border-rose-400/20", icon: XCircle },
  };

  const badge = fairnessConfig[product.fairness];
  const payoutPct = Math.round(
    (product.priceBreakdown.rawMaterial + product.priceBreakdown.laborHours * product.priceBreakdown.wagePerHour)
    / product.price * 100
  );

  // Split product title into two lines for the big gradient heading
  const words = (product.title || "Handloom Saree").toUpperCase().split(" ");
  const midpoint = Math.ceil(words.length / 2);
  const titleLine1 = words.slice(0, midpoint).join(" ");
  const titleLine2 = words.slice(midpoint).join(" ") || product.aiSuggestedCategory?.toUpperCase() || "HANDLOOM";

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } } }}
      className="min-h-[55vh] bg-black/80 backdrop-blur-sm rounded-[2rem] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] flex flex-col p-2 gap-2 overflow-hidden border border-gray-800"
      style={{
        background: `linear-gradient(160deg, ${product.mainColor || '#1a1a1a'}22 0%, rgba(5,5,5,0.92) 55%)`
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      whileHover={{
        scale: 1.01,
        boxShadow: "0 35px 60px -15px rgba(0,0,0,0.7)",
        borderColor: "rgba(255,255,255,0.2)",
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Top bar */}
      <motion.div
        className="flex justify-between p-2 items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {/* Weave icon */}
        <motion.div
          className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center"
          whileHover={{ rotate: 10, scale: 1.1 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Store className="h-4 w-4 text-amber-400" />
        </motion.div>

        {/* Arrow button */}
        <motion.div
          className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center cursor-pointer"
          whileHover={{
            scale: 1.1,
            backgroundColor: "#fbbf24",
            boxShadow: "0 0 15px rgba(251,191,36,0.6)",
          }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelectProduct?.(product.id)}
        >
          <ArrowUpRight className="h-5 w-5 text-black" />
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-3 px-2">
        {/* Big gradient title */}
        <motion.div
          className="text-3xl text-center font-bold leading-tight"
          style={{
            background: `linear-gradient(135deg, ${product.accentColor || '#f59e0b'}, #c084fc)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          {titleLine1}
          {titleLine2 && <><br />{titleLine2}</>}
        </motion.div>

        {/* Image with blurred background overlay */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7, duration: 0.8 }}
        >
          {/* Blurred bg glow */}
          <div className="absolute inset-0 rounded-2xl opacity-15 z-0 overflow-hidden">
            <motion.div
              animate={{ scale: isHovered ? 1.03 : 1 }}
              transition={{ duration: 3, ease: "easeInOut" }}
            >
              {product.photo ? (
                <img
                  src={product.photo}
                  alt={product.title}
                  className="w-full h-full object-cover blur-sm scale-150 opacity-70"
                />
              ) : (
                <div
                  className="w-full h-full"
                  style={{ background: `linear-gradient(135deg, ${product.mainColor || '#78350f'}, ${product.accentColor || '#d97706'})` }}
                />
              )}
            </motion.div>
          </div>

          {/* Foreground image */}
          <motion.div
            className="relative z-10 p-2"
            whileHover={{ scale: 1.03 }}
            transition={{ ease: "easeInOut", duration: 0.4 }}
          >
            {product.photo ? (
              <img
                src={product.photo}
                alt={product.title}
                className="rounded-2xl w-full h-44 object-cover shadow-lg"
              />
            ) : (
              <div
                className="rounded-2xl w-full h-44 shadow-lg flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${product.mainColor || '#78350f'}66, ${product.accentColor || '#d97706'}44)` }}
              >
                <IndianRupee className="h-12 w-12 text-white/20" />
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Description — weaver + village + material */}
        <motion.div
          className="text-xs text-center max-w-72 mx-auto text-neutral-400 font-light leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.7 }}
        >
          {weaver ? (
            <>
              <span className="text-white/70 font-medium">{weaver.name}</span>
              {weaver.village ? ` · ${weaver.village}` : ""}
              {product.material ? ` · ${product.material}` : ""}
            </>
          ) : (
            product.material || "Authentic handloom, made with care."
          )}
        </motion.div>
        </div>
      </motion.div>
    );
}
