/**
 * Shared data model for the 3 new modules (Onboarding, Fair Pricing, Demand).
 *
 * DESIGN INTENT
 * -------------
 * All three modules read/write to ONE shared data model so there are no demo
 * silos. A weaver onboarded in Module 1 immediately appears in Module 2's
 * pricing flow and Module 3's dashboard, and publishes to the buyer storefront.
 *
 * PERSISTENCE: localStorage (key = MARKETPLACE_LS_KEY). This keeps the demo
 * loop alive across reloads without a backend. See `useMarketplaceStore`.
 *
 * PROVENANCE: the priceBreakdown is structured as if it will be hashed and
 * stored on-chain (QR/blockchain). We include a `provenanceHash` placeholder
 * and an immutable ledger of edits so tampering is visible.
 */

/** A registered weaver (artisan). */
export interface Weaver {
  id: string;                 // e.g. "WVR-7F3A"
  name: string;
  village: string;
  district?: string;
  state?: string;
  craftType: string;          // e.g. "Kanchipuram Silk"
  yearsExperience: number;
  bankUpiId?: string;         // payment
  photo?: string;             // base64 headshot
  storyText?: string;         // voice "my story" -> transcribed text (Module 1)
  storyLang?: string;         // language the story was spoken in
  onboardedAt: string;        // ISO date
  onboardedBy?: string;       // "self" | Village Assistant name (Module 1)
}

/** Cost breakdown — editable by weaver, visible to buyer (Module 2). */
export interface PriceBreakdown {
  rawMaterial: number;        // ₹
  laborHours: number;         // hours worked
  wagePerHour: number;        // fair minimum wage benchmark (₹/hr) — configurable
  platformFeePct: number;     // transparent %, e.g. 8
  logistics: number;          // ₹ packaging/shipping
  // Derived (not stored, computed): laborCost = laborHours * wagePerHour
  //                                 platformFee = subtotal * pct
  //                                 payout = subtotal - platformFee
  // See computePriceBreakdown() in pricing.ts
}

/** Fairness verdict computed from the breakdown. */
export type FairnessLevel = "fair" | "review" | "below";

/** A listed product, tied to a weaver. */
export interface Product {
  id: string;                 // e.g. "PRD-2C81"
  weaverId: string;           // -> Weaver.id
  title: string;
  category: string;           // AI-suggested or chosen, e.g. "Silk Saree"
  craftType: string;          // mirrors weaver craft or overridden
  material: string;
  price: number;              // final buyer price (₹) — sum of breakdown
  priceBreakdown: PriceBreakdown;
  fairness: FairnessLevel;    // cached verdict
  photo: string;              // base64 product photo
  colors?: string[];
  storyText?: string;         // optional per-product voice story
  aiSuggestedTitle?: string;  // what AI proposed (for the "accept with one tap" UX)
  aiSuggestedCategory?: string;
  published: boolean;         // shown on public storefront only when true
  publishedAt?: string;
  provenanceHash?: string;    // mock on-chain hash of the breakdown (Module 2)
  ledger: LedgerEntry[];      // immutable edit history (tamper-visible)
  createdAt: string;
}

export interface LedgerEntry {
  at: string;                 // ISO timestamp
  action: string;             // e.g. "price_updated", "published"
  field?: string;
  from?: string;
  to?: string;
  fairness?: FairnessLevel;
}

/** Trending + demand-gap mock data shapes (Module 3). See demand.ts. */
export interface TrendItem {
  rank: number;
  label: string;              // e.g. "Indigo blue stoles"
  category: string;
  color?: string;
  pattern?: string;
  trend: "up" | "down" | "flat";
  changePct: number;          // vs last month
  searches: number;
}

export interface UnmetQuery {
  id: string;
  query: string;              // what buyers searched
  region: string;             // state/country
  at: string;                 // ISO timestamp
  noMatch: boolean;           // true = demand gap (no matching product)
}

export interface RegionalDemand {
  region: string;             // state or country
  orders: number;
  sharePct: number;
}

/** Full marketplace state persisted to localStorage. */
export interface MarketplaceDB {
  weavers: Weaver[];
  products: Product[];
  version: number;
}
