/**
 * Module 3 — Demand Intelligence mock data.
 *
 * Structured to mirror what a real backend (buyer search logs + order history)
 * would return. In production each array below would come from an API; here it
 * is static JSON so the dashboard is always populated for the demo.
 *
 * The `suggestNextProduct()` helper is the real logic: it combines trending
 * data with a weaver's own craft to produce the "Make this next" card.
 */
import type { TrendItem, UnmetQuery, RegionalDemand } from "./types";

/** Top 5 trending categories/colors/patterns "this month". */
export const TRENDING: TrendItem[] = [
  { rank: 1, label: "Indigo blue cotton stoles", category: "Stole", color: "Indigo", pattern: "Geometric", trend: "up", changePct: 42, searches: 1840 },
  { rank: 2, label: "Muga silk mekhela chador", category: "Saree", color: "Golden", pattern: "Traditional", trend: "up", changePct: 35, searches: 1620 },
  { rank: 3, label: "Pastel pink Banarasi dupatta", category: "Dupatta", color: "Pastel Pink", pattern: "Floral", trend: "up", changePct: 28, searches: 1340 },
  { rank: 4, label: "Black & gold Paithani borders", category: "Saree", color: "Black", pattern: "Peacock", trend: "flat", changePct: 4, searches: 1110 },
  { rank: 5, label: "Natural-dye kora cotton fabric", category: "Fabric", color: "Natural", pattern: "Plain weave", trend: "down", changePct: -9, searches: 880 },
];

/** Recent buyer search queries with NO matching product = genuine demand gap. */
export const UNMET_QUERIES: UnmetQuery[] = [
  { id: "u1", query: "handwoven indigo stole under ₹3000", region: "Karnataka", at: daysAgo(0), noMatch: true },
  { id: "u2", query: "soft cotton daily saree (pastel)", region: "Tamil Nadu", at: daysAgo(1), noMatch: true },
  { id: "u3", query: "tussar silk unstitched fabric 2m", region: "Maharashtra", at: daysAgo(1), noMatch: true },
  { id: "u4", query: "men's handloom cotton angarkha", region: "Rajasthan", at: daysAgo(2), noMatch: true },
  { id: "u5", query: "ek album of kasavu stoles", region: "Kerala", at: daysAgo(2), noMatch: true },
  { id: "u6", query: "naturally dyed dupatta gift set", region: "United States", at: daysAgo(3), noMatch: true },
];

/** Regional demand share by craft (mock order distribution). */
export const REGIONAL_DEMAND: RegionalDemand[] = [
  { region: "Maharashtra", orders: 342, sharePct: 24 },
  { region: "Karnataka", orders: 298, sharePct: 21 },
  { region: "Tamil Nadu", orders: 241, sharePct: 17 },
  { region: "United States", orders: 188, sharePct: 13 },
  { region: "Kerala", orders: 156, sharePct: 11 },
  { region: "Delhi NCR", orders: 132, sharePct: 9 },
  { region: "United Kingdom", orders: 68, sharePct: 5 },
];

/**
 * Suggested price range for a craft type based on recent successful sales.
 * Mock median ± spread. Keyed by canonical craft name.
 */
export const PRICE_RANGES: Record<string, { low: number; median: number; high: number }> = {
  "Kanchipuram Silk": { low: 22000, median: 34000, high: 52000 },
  "Chanderi Silk": { low: 6500, median: 11500, high: 21000 },
  "Paithani": { low: 28000, median: 42000, high: 68000 },
  "Kasavu Cotton": { low: 3800, median: 7200, high: 12500 },
  "Banarasi": { low: 12000, median: 21000, high: 38000 },
  "Bandhani": { low: 3200, median: 6500, high: 12000 },
  "Jamdani": { low: 9000, median: 16000, high: 28000 },
  "Ikat": { low: 7000, median: 13000, high: 24000 },
  "Tussar Silk": { low: 5500, median: 9800, high: 17500 },
};

export function priceRangeFor(craftType: string) {
  return (
    PRICE_RANGES[craftType] || { low: 4000, median: 9000, high: 18000 }
  );
}

/** Build the "Make this next" suggestion from trends × weaver's craft. */
export function suggestNextProduct(craftType: string): {
  title: string;
  reason: string;
  trendRef?: TrendItem;
} {
  const ct = (craftType || "").toLowerCase();
  // Match a trending item whose category aligns with the weaver's craft.
  let match: TrendItem | undefined;
  if (ct.includes("kasavu") || ct.includes("cotton")) {
    match = TRENDING.find((t) => t.label.toLowerCase().includes("indigo") || t.label.toLowerCase().includes("kora"));
  } else if (ct.includes("silk") || ct.includes("kanche") || ct.includes("paithani") || ct.includes("banaras")) {
    match = TRENDING.find((t) => t.category === "Saree" && (t.label.toLowerCase().includes("silk") || t.label.toLowerCase().includes("paithani")));
  }
  if (!match) match = TRENDING.find((t) => t.trend === "up");

  const chosen = match || TRENDING[0];
  return {
    title: `${chosen.label}`,
    reason: `"${chosen.label}" searches are ${chosen.changePct >= 0 ? "up" : "down"} ${Math.abs(chosen.changePct)}% this month, and you already know ${craftType || "this"} craft — the closest match to current demand.`,
    trendRef: chosen,
  };
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}
