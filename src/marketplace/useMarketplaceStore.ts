/**
 * Marketplace store — the SINGLE shared data layer for Modules 1–3.
 *
 * - Persists to localStorage so the demo loop survives reloads (per user choice).
 * - Exposes typed CRUD + a React hook (`useMarketplace`) that re-renders on change.
 * - Seeds itself once with realistic demo weavers/products so every screen is
 *   populated on first load (the same way the existing app seeds db.json).
 *
 * Cross-tab sync: a `storage` listener keeps multiple tabs consistent.
 */
import { useCallback, useSyncExternalStore } from "react";
import type { Weaver, Product, MarketplaceDB, LedgerEntry, PriceBreakdown } from "./types";
import { computeBreakdown, fairnessFor } from "./pricing";

const LS_KEY = "asli_taana_marketplace_v1";
const DB_VERSION = 1;

// ── tiny synchronous hashing (mock on-chain provenance) ─────────────────────
// Not cryptographic — it's a visible, deterministic fingerprint of the price
// breakdown so buyers can see it changed if a field is edited (tamper-visible).
function hashBreakdown(b: PriceBreakdown, total: number): string {
  const s = `${b.rawMaterial}|${b.laborHours}|${b.wagePerHour}|${b.platformFeePct}|${b.logistics}|${total}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return "0x" + (h >>> 0).toString(16).padStart(8, "0");
}

function rid(prefix: string): string {
  const s = Math.floor(0x1000 + Math.random() * 0xefff).toString(16).toUpperCase();
  return `${prefix}-${s}`;
}

function ledgerPush(p: Product, entry: Omit<LedgerEntry, "at">): LedgerEntry[] {
  return [...p.ledger, { ...entry, at: new Date().toISOString() }];
}

// ── seed data (realistic, bilingual-friendly) ──────────────────────────────
function seed(): MarketplaceDB {
  const w1: Weaver = {
    id: "WVR-SEED-1", name: "Lakshmi Devi", village: "Kuthampully", district: "Thrissur",
    state: "Kerala", craftType: "Kasavu Cotton", yearsExperience: 38, bankUpiId: "lakshmi@upi",
    storyText: "I have woven Kasavu since I was fourteen. Every golden border carries my family's blessing.",
    storyLang: "ml", onboardedAt: new Date().toISOString(), onboardedBy: "self",
  };
  const w2: Weaver = {
    id: "WVR-SEED-2", name: "Ramanathan K.", village: "Kanchipuram", district: "Kanchipuram",
    state: "Tamil Nadu", craftType: "Kanchipuram Silk", yearsExperience: 41, bankUpiId: "ramanathan@upi",
    storyText: "Three generations of my family have woven temple borders. The loom is our temple.",
    storyLang: "ta", onboardedAt: new Date().toISOString(), onboardedBy: "self",
  };

  const mkProduct = (
    weaverId: string, title: string, category: string, craftType: string, material: string,
    photo: string, b: PriceBreakdown, published: boolean,
  ): Product => {
    const c = computeBreakdown(b);
    const fairness = fairnessFor(c.payoutPct);
    const now = new Date().toISOString();
    return {
      id: rid("PRD"), weaverId, title, category, craftType, material,
      price: c.total, priceBreakdown: b, fairness, photo, colors: [],
      published, publishedAt: published ? now : undefined,
      provenanceHash: hashBreakdown(b, c.total),
      ledger: [{ at: now, action: "created", fairness }],
      createdAt: now,
    };
  };

  const products: Product[] = [
    mkProduct(w1.id, "Kasavu Cotton Saree with Gold Border", "Saree", "Kasavu Cotton", "Fine cotton + silver zari",
      PHOTO_PLACEHOLDER.kasavu,
      { rawMaterial: 2200, laborHours: 80, wagePerHour: 120, platformFeePct: 8, logistics: 350 }, true),
    mkProduct(w2.id, "Kanchipuram Temple Border Silk Saree", "Saree", "Kanchipuram Silk", "Mulberry silk + gold zari",
      PHOTO_PLACEHOLDER.silk,
      { rawMaterial: 14000, laborHours: 120, wagePerHour: 120, platformFeePct: 8, logistics: 600 }, true),
  ];

  return { weavers: [w1, w2], products, version: DB_VERSION };
}

// Placeholder product photos: tiny inline SVGs so the demo has visuals without
// binary assets. Components render <img src=...> on them fine.
const PHOTO_PLACEHOLDER = {
  kasavu: "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#faf6f0'/><rect y='460' width='400' height='40' fill='#d4af37'/><rect width='400' height='40' fill='#d4af37'/><g stroke='#d4af37' stroke-width='6'><line x1='20' y1='60' x2='380' y2='440'/><line x1='380' y1='60' x2='20' y2='440'/></g><text x='200' y='255' font-family='serif' font-size='22' fill='#1a1a1a' text-anchor='middle'>Kasavu</text></svg>`),
  silk: "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#7d051c'/><rect y='0' width='400' height='70' fill='#d4af37'/><polygon points='0,70 30,110 60,70 90,110 120,70 150,110 180,70 210,110 240,70 270,110 300,70 330,110 360,70 390,110 400,90 400,70' fill='#d4af37'/><text x='200' y='270' font-family='serif' font-size='22' fill='#ffd700' text-anchor='middle'>Kanchipuram</text></svg>`),
};
export { PHOTO_PLACEHOLDER };

// ── persistence ────────────────────────────────────────────────────────────
let cache: MarketplaceDB | null = null;
const listeners = new Set<() => void>();

function read(): MarketplaceDB {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as MarketplaceDB;
      if (parsed && Array.isArray(parsed.weavers)) { cache = parsed; return cache; }
    }
  } catch { /* ignore corrupt store */ }
  cache = seed();
  write(cache);
  return cache;
}

function write(db: MarketplaceDB) {
  cache = db;
  try { localStorage.setItem(LS_KEY, JSON.stringify(db)); } catch { /* quota */ }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => { if (e.key === LS_KEY) { cache = null; cb(); } };
  window.addEventListener("storage", onStorage);
  return () => { listeners.delete(cb); window.removeEventListener("storage", onStorage); };
}

// ── mutations ──────────────────────────────────────────────────────────────
export function addWeaver(input: Omit<Weaver, "id" | "onboardedAt">): Weaver {
  const db = read();
  const weaver: Weaver = { ...input, id: rid("WVR"), onboardedAt: new Date().toISOString() };
  write({ ...db, weavers: [weaver, ...db.weavers] });
  return weaver;
}

export function addProduct(input: {
  weaverId: string; title: string; category: string; craftType: string;
  material: string; photo: string; priceBreakdown: PriceBreakdown;
  aiSuggestedTitle?: string; aiSuggestedCategory?: string; storyText?: string; colors?: string[];
  published?: boolean;
}): Product {
  const db = read();
  const c = computeBreakdown(input.priceBreakdown);
  const fairness = fairnessFor(c.payoutPct);
  const now = new Date().toISOString();
  const product: Product = {
    id: rid("PRD"), weaverId: input.weaverId, title: input.title, category: input.category,
    craftType: input.craftType, material: input.material, price: c.total,
    priceBreakdown: input.priceBreakdown, fairness, photo: input.photo,
    colors: input.colors ?? [], aiSuggestedTitle: input.aiSuggestedTitle,
    aiSuggestedCategory: input.aiSuggestedCategory, storyText: input.storyText,
    published: false, provenanceHash: hashBreakdown(input.priceBreakdown, c.total),
    ledger: [{ at: now, action: "created", fairness }], createdAt: now,
  };
  write({ ...db, products: [product, ...db.products] });
  return product;
}

export function updatePriceBreakdown(productId: string, breakdown: PriceBreakdown): Product | undefined {
  const db = read();
  const products = db.products.map((p) => {
    if (p.id !== productId) return p;
    const c = computeBreakdown(breakdown);
    const fairness = fairnessFor(c.payoutPct);
    const prevFair = p.fairness;
    return {
      ...p,
      priceBreakdown: breakdown,
      price: c.total,
      fairness,
      provenanceHash: hashBreakdown(breakdown, c.total),
      ledger: ledgerPush(p, {
        action: "price_updated",
        field: "priceBreakdown",
        from: `₹${p.price}`,
        to: `₹${c.total}`,
        fairness,
        ...(prevFair !== fairness ? {} : {}),
      }),
    };
  });
  const updated = products.find((p) => p.id === productId);
  write({ ...db, products });
  return updated;
}

export function publishProduct(productId: string): Product | undefined {
  const db = read();
  const products = db.products.map((p) => {
    if (p.id !== productId) return p;
    return {
      ...p, published: true, publishedAt: new Date().toISOString(),
      ledger: ledgerPush(p, { action: "published", fairness: p.fairness }),
    };
  });
  const updated = products.find((p) => p.id === productId);
  write({ ...db, products });
  return updated;
}

export function getWeaver(id: string) { return read().weavers.find((w) => w.id === id); }
export function getProductsByWeaver(id: string) { return read().products.filter((p) => p.weaverId === id); }

export function resetDemo() {
  cache = seed();
  write(cache);
}

// ── React binding ──────────────────────────────────────────────────────────
export function useMarketplace() {
  const db = useSyncExternalStore(subscribe, read, read);
  return db;
}

/** Convenience hook returning a stable set of mutation actions. */
export function useMarketplaceActions() {
  return {
    addWeaver: useCallback(addWeaver, []),
    addProduct: useCallback(addProduct, []),
    updatePriceBreakdown: useCallback(updatePriceBreakdown, []),
    publishProduct: useCallback(publishProduct, []),
    resetDemo: useCallback(resetDemo, []),
  };
}

/** SSR-safe localStorage check used by components that touch storage directly. */
export function safeLocalStorage() {
  return typeof window !== "undefined" ? window.localStorage : null;
}
