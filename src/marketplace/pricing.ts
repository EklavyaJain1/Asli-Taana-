/**
 * Fair Pricing & Anti-Exploitation Engine (Module 2) — pure calculation logic.
 *
 * POLICY ASSUMPTIONS (documented; configurable per-call):
 *  - FAIR_WAGE_BENCHMARK: default ₹120/hr (~₹960/day, ~8hr). Based on a
 *    reasonable handloom-skilled minimum wage. Override via state map below.
 *  - DEFAULT_PLATFORM_FEE_PCT: 8% (transparent, fixed).
 *  - FAIRNESS thresholds are based on WEAVER PAYOUT as a share of FINAL price.
 *      >= 60%  -> "fair"      (weaver gets the majority)
 *      45–59%  -> "review"    (needs a closer look)
 *      < 45%   -> "below"     (exploitative — blocked from publish)
 *
 * These constants are deliberately exported so the UI and any future
 * backend can share the exact same policy.
 */
import type { PriceBreakdown, FairnessLevel } from "./types";

export const FAIR_WAGE_BENCHMARK = 120;        // ₹ per hour (all-India default)
export const DEFAULT_PLATFORM_FEE_PCT = 8;     // %
export const FAIRNESS_FAIR_THRESHOLD = 60;     // payout % >= this is "fair"
export const FAIRNESS_REVIEW_THRESHOLD = 45;   // payout % >= this is "review"

/**
 * Rough state-level daily min-wage map for the labor auto-suggest.
 * Per-hour = daily / 8. Sourced to order-of-magnitude real values; the point is
 * configurability, not legal precision. Easily overridable per weaver.
 */
export const STATE_DAILY_WAGE: Record<string, number> = {
  "Tamil Nadu": 448,
  Karnataka: 488,
  Maharashtra: 458,
  "Madhya Pradesh": 410,
  Gujarat: 418,
  Kerala: 480,
  "Uttar Pradesh": 368,
  Telangana: 451,
  "Andhra Pradesh": 451,
  "West Bengal": 375,
  Rajasthan: 388,
  Odisha: 378,
};

/** Convert a state name to a per-hour fair wage, falling back to the benchmark. */
export function wageForState(state?: string): number {
  if (!state) return FAIR_WAGE_BENCHMARK;
  const daily = STATE_DAILY_WAGE[state];
  return daily ? Math.round(daily / 8) : FAIR_WAGE_BENCHMARK;
}

export interface ComputedBreakdown {
  laborCost: number;
  subtotal: number;        // raw + labor + logistics
  platformFee: number;
  payout: number;          // weaver's take-home
  total: number;           // final buyer price (subtotal + platformFee)
  payoutPct: number;       // payout / total * 100 — drives the Fairness Score
}

export function computeBreakdown(b: PriceBreakdown): ComputedBreakdown {
  const laborCost = Math.max(0, b.laborHours) * Math.max(0, b.wagePerHour);
  const subtotal = Math.max(0, b.rawMaterial) + laborCost + Math.max(0, b.logistics);
  const platformFee = Math.round((subtotal * b.platformFeePct) / 100);
  const total = subtotal + platformFee;
  const payout = subtotal; // platformFee is the only deduction; payout = subtotal
  const payoutPct = total > 0 ? (payout / total) * 100 : 0;
  return { laborCost, subtotal, platformFee, payout, total, payoutPct };
}

/** Fairness verdict from payout share. */
export function fairnessFor(payoutPct: number): FairnessLevel {
  if (payoutPct >= FAIRNESS_FAIR_THRESHOLD) return "fair";
  if (payoutPct >= FAIRNESS_REVIEW_THRESHOLD) return "review";
  return "below";
}

/**
 * Suggested minimum price to make the payout reach the "fair" threshold,
 * holding costs fixed. Returned as a hint shown to the weaver before publish.
 */
export function suggestedMinPrice(b: PriceBreakdown): number {
  const c = computeBreakdown(b);
  if (c.payoutPct >= FAIRNESS_FAIR_THRESHOLD) return c.total;
  // payout = total - platformFee; we want payout/total >= FAIR.
  // Since payout share only grows with payout (a cost), the lever is the
  // platformFee% / a "weaver markup". Simplest: bump total so payout share
  // clears the threshold. Solve: payout >= 0.60*total  =>  payout >=
  // 0.60*(payout+fee) => payout(1-0.60) >= 0.60*fee => payout >= 1.5*fee.
  // If payout is already fine on subtotal, the issue is the fee ratio only
  // when subtotal is tiny. In practice the block is when raw+labor is too low
  // relative to logistics+fee — so raise the price floor by the deficit.
  const targetTotal = c.payout / (FAIRNESS_FAIR_THRESHOLD / 100);
  return Math.max(c.total, Math.round(targetTotal / 10) * 10);
}

/** Default blank breakdown with sensible config defaults. */
export function defaultBreakdown(): PriceBreakdown {
  return {
    rawMaterial: 0,
    laborHours: 0,
    wagePerHour: FAIR_WAGE_BENCHMARK,
    platformFeePct: DEFAULT_PLATFORM_FEE_PCT,
    logistics: 0,
  };
}

/** Slice ordering for the pie chart (most prominent = payout). */
export const CHART_COLORS = {
  rawMaterial: "#a16207", // amber-700 (earth)
  labor: "#15803d",       // green-700 (livelihood)
  platform: "#1a1a1a",    // ink
  logistics: "#9a3412",   // orange-900
  payout: "#b45309",      // brand amber (largest slice, most visible)
};
