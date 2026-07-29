/**
 * Shared UI primitives for the marketplace modules.
 *
 * These reuse the app's craft-authentic design tokens (earth palette, square
 * corners, uppercase tracking labels, Crimson Pro serif headings) so the new
 * modules feel native to the existing app instead of a generic SaaS skin.
 *
 * Designed mobile-first: large tap targets, minimal text, icon-led.
 */
import React from "react";
import { cn } from "../../lib/utils";

/** Section heading with a small eyebrow badge + serif title + subtitle. */
export function SectionHeader({
  badge, title, subtitle, icon: Icon,
}: {
  badge?: string; title: string; subtitle?: string; icon?: React.ElementType;
}) {
  return (
    <div className="mb-6 md:mb-8">
      {badge && (
        <span className="inline-flex items-center gap-1.5 text-[9px] font-sans font-bold tracking-widest text-[#b45309] bg-[#b45309]/5 border border-[#b45309]/20 px-3 py-1.5 uppercase mb-3">
          {Icon && <Icon className="h-3 w-3" />}
          {badge}
        </span>
      )}
      <h2 className="font-serif text-2xl md:text-3xl font-bold text-[#1a1a1a] leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="text-sm md:text-base text-[#1a1a1a]/60 mt-1.5 font-serif max-w-2xl">
          {subtitle}
        </p>
      )}
    </div>
  );
}

/** Big primary action button — oversized for low-literacy / one-action screens. */
export function BigButton({
  children, onClick, disabled, variant = "primary", icon: Icon, className,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "ghost";
  icon?: React.ElementType;
  className?: string;
}) {
  const variants: Record<string, string> = {
    primary:
      "bg-[#1a1a1a] hover:bg-[#b45309] text-white border-[#1a1a1a]",
    secondary:
      "bg-[#b45309] hover:bg-[#92400e] text-white border-[#b45309]",
    ghost:
      "bg-white text-[#1a1a1a] border-[#1a1a1a]/20 hover:bg-[#1a1a1a]/5",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full flex items-center justify-center gap-2.5 font-sans font-bold text-sm uppercase tracking-[0.15em] py-4 px-5 rounded-none border transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-xs",
        variants[variant],
        className,
      )}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {children}
    </button>
  );
}

/** Step progress dots for the one-action-per-screen onboarding flow. */
export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 rounded-full transition-all",
            i === current ? "w-6 bg-[#b45309]" : i < current ? "w-1.5 bg-[#b45309]/50" : "w-1.5 bg-[#1a1a1a]/15",
          )}
        />
      ))}
    </div>
  );
}

/** Large icon-led choice tile (one tap to fill a field). */
export function IconTile({
  icon: Icon, label, onClick, active,
}: {
  icon: React.ElementType; label: string; onClick?: () => void; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 p-5 border rounded-none transition-all aspect-square",
        active
          ? "border-[#b45309] bg-[#b45309]/5 shadow-sm"
          : "border-[#1a1a1a]/15 bg-white hover:border-[#1a1a1a]/40 hover:bg-[#1a1a1a]/5",
      )}
    >
      <Icon className={cn("h-8 w-8", active ? "text-[#b45309]" : "text-[#1a1a1a]/70")} />
      <span className="text-xs font-sans font-bold text-center text-[#1a1a1a] leading-tight">
        {label}
      </span>
    </button>
  );
}

/** A labeled field row used in compact admin/village-assistant forms. */
export function Field({
  label, children, hint,
}: {
  label: string; children: React.ReactNode; hint?: string;
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">
        {label}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-[#1a1a1a]/50 mt-1 font-sans">{hint}</span>}
    </label>
  );
}

/** Standard text input matching the app's existing form styling. */
export const inputClass =
  "w-full text-sm border border-[#1a1a1a]/20 rounded-none p-3 bg-white text-[#1a1a1a] focus:outline-none focus:border-[#1a1a1a] transition-all font-serif";

/** Format an integer rupee amount. */
export function rupee(n: number): string {
  return "₹" + Math.round(n).toLocaleString("en-IN");
}
