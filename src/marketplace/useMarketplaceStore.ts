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
const DB_VERSION = 2;

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
  const w3: Weaver = {
    id: "WVR-SEED-3", name: "Meena Yadav", village: "Varanasi", district: "Varanasi",
    state: "Uttar Pradesh", craftType: "Banarasi Silk", yearsExperience: 27, bankUpiId: "meena@upi",
    storyText: "Banarasi weave runs in my blood. Each motifs is tied by hand before it touches the loom.",
    storyLang: "hi", onboardedAt: new Date().toISOString(), onboardedBy: "self",
  };
  const w4: Weaver = {
    id: "WVR-SEED-4", name: "Sunita Sharma", village: "Chanderi", district: "Ashoknagar",
    state: "Madhya Pradesh", craftType: "Chanderi Silk Cotton", yearsExperience: 22, bankUpiId: "sunita@upi",
    storyText: "Chanderi fabric is sheer as mist. We weave it so fine you can read through it.",
    storyLang: "hi", onboardedAt: new Date().toISOString(), onboardedBy: "self",
  };
  const w5: Weaver = {
    id: "WVR-SEED-5", name: "Anjali Das", village: "Phulia", district: "Nadia",
    state: "West Bengal", craftType: "Jamdani", yearsExperience: 19, bankUpiId: "anjali@upi",
    storyText: "Jamdani patterns live only in the weaver's memory. No cards, no paper — just the loom and me.",
    storyLang: "bn", onboardedAt: new Date().toISOString(), onboardedBy: "self",
  };
  const w6: Weaver = {
    id: "WVR-SEED-6", name: "Vandana Pawar", village: "Yeola", district: "Nashik",
    state: "Maharashtra", craftType: "Paithani Silk", yearsExperience: 33, bankUpiId: "vandana@upi",
    storyText: "A single Paithani peacock border can take me two months. The birds come alive on the pallu.",
    storyLang: "mr", onboardedAt: new Date().toISOString(), onboardedBy: "self",
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
    mkProduct(w3.id, "Banarasi Brocade Saree with Floral Meena", "Saree", "Banarasi Silk", "Katan silk + real zari",
      PHOTO_PLACEHOLDER.banarasi,
      { rawMaterial: 11000, laborHours: 110, wagePerHour: 125, platformFeePct: 8, logistics: 500 }, true),
    mkProduct(w4.id, "Chanderi Sheer Saree with Butti Work", "Saree", "Chanderi Silk Cotton", "Silk-cotton blend + zari",
      PHOTO_PLACEHOLDER.chanderi,
      { rawMaterial: 3200, laborHours: 70, wagePerHour: 110, platformFeePct: 8, logistics: 300 }, true),
    mkProduct(w5.id, "Jamdani Saree with Geometric Motifs", "Saree", "Jamdani", "Hand-spun cotton",
      PHOTO_PLACEHOLDER.jamdani,
      { rawMaterial: 2600, laborHours: 160, wagePerHour: 130, platformFeePct: 8, logistics: 350 }, true),
    mkProduct(w6.id, "Paithani Saree with Peacock Pallu", "Saree", "Paithani Silk", "Pure silk + gold zari",
      PHOTO_PLACEHOLDER.paithani,
      { rawMaterial: 16500, laborHours: 200, wagePerHour: 135, platformFeePct: 8, logistics: 700 }, true),
  ];

  return { weavers: [w1, w2, w3, w4, w5, w6], products, version: DB_VERSION };
}

// Placeholder product photos: tiny inline SVGs so the demo has visuals without
// binary assets. Components render <img src=...> on them fine.
const PHOTO_PLACEHOLDER = {
  kasavu: "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#faf6f0'/><rect y='460' width='400' height='40' fill='#d4af37'/><rect width='400' height='40' fill='#d4af37'/><g stroke='#d4af37' stroke-width='6'><line x1='20' y1='60' x2='380' y2='440'/><line x1='380' y1='60' x2='20' y2='440'/></g><text x='200' y='255' font-family='serif' font-size='22' fill='#1a1a1a' text-anchor='middle'>Kasavu</text></svg>`),
  silk: "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#7d051c'/><rect y='0' width='400' height='70' fill='#d4af37'/><polygon points='0,70 30,110 60,70 90,110 120,70 150,110 180,70 210,110 240,70 270,110 300,70 330,110 360,70 390,110 400,90 400,70' fill='#d4af37'/><text x='200' y='270' font-family='serif' font-size='22' fill='#ffd700' text-anchor='middle'>Kanchipuram</text></svg>`),
  banarasi: "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#5b2c6f'/><rect y='0' width='400' height='50' fill='#c9a227'/><rect y='450' width='400' height='50' fill='#c9a227'/><g fill='#d4af37'><circle cx='100' cy='160' r='14'/><circle cx='200' cy='200' r='14'/><circle cx='300' cy='160' r='14'/><circle cx='150' cy='320' r='14'/><circle cx='250' cy='320' r='14'/></g><path d='M200 250 q-30 -20 -60 0 q30 20 60 40 q30 -20 60 0 q-30 -20 -60 -40' fill='none' stroke='#c9a227' stroke-width='4'/><text x='200' y='270' font-family='serif' font-size='22' fill='#ffd700' text-anchor='middle'>Banarasi</text></svg>`),
  chanderi: "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#f4ecec'/><rect y='0' width='400' height='40' fill='#7c3aed'/><rect y='460' width='400' height='40' fill='#7c3aed'/><g fill='#7c3aed'><circle cx='80' cy='140' r='6'/><circle cx='160' cy='200' r='6'/><circle cx='240' cy='140' r='6'/><circle cx='320' cy='200' r='6'/><circle cx='120' cy='300' r='6'/><circle cx='200' cy='360' r='6'/><circle cx='280' cy='300' r='6'/></g><text x='200' y='255' font-family='serif' font-size='22' fill='#4c1d95' text-anchor='middle'>Chanderi</text></svg>`),
  jamdani: "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#e8edf5'/><rect y='0' width='400' height='40' fill='#1e3a8a'/><rect y='460' width='400' height='40' fill='#1e3a8a'/><g stroke='#1e3a8a' stroke-width='3' fill='none'><path d='M60 120 L140 120 L100 80 Z'/><path d='M260 220 L340 220 L300 180 Z'/><path d='M60 340 L140 340 L100 300 Z'/><circle cx='200' cy='180' r='18'/><circle cx='200' cy='320' r='18'/></g><text x='200' y='255' font-family='serif' font-size='22' fill='#1e3a8a' text-anchor='middle'>Jamdani</text></svg>`),
  paithani: "data:image/svg+xml;utf8," + encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#4a0e0e'/><rect y='0' width='400' height='60' fill='#c9a227'/><rect y='440' width='400' height='60' fill='#c9a227'/><g fill='#1e6b3a' stroke='#c9a227' stroke-width='2'><ellipse cx='200' cy='250' rx='40' ry='55'/><circle cx='200' cy='180' r='14' fill='#c9a227'/><path d='M200 305 q-25 30 -50 25 q15 -20 50 -25 q35 5 50 25 q-25 5 -50 -25' fill='#1e6b3a'/></g><g stroke='#c9a227' stroke-width='3'><line x1='150' y1='250' x2='120' y2='230'/><line x1='250' y1='250' x2='280' y2='230'/></g><text x='200' y='380' font-family='serif' font-size='22' fill='#ffd700' text-anchor='middle'>Paithani</text></svg>`),
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
      // Re-seed if the stored version is behind the code's schema version.
      if (parsed && parsed.version === DB_VERSION && Array.isArray(parsed.weavers)) {
        cache = parsed;
        return cache;
      }
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
