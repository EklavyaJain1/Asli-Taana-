/**
 * Module 1 — Low-Digital-Literacy Weaver Onboarding.
 *
 * PRINCIPLES (from spec):
 *  - Large icon-based steps instead of text forms.
 *  - Voice-first entry (speak product name/material/price) via Web Speech API.
 *  - Photo-first: take the product photo first; AI auto-suggests title+category,
 *    weaver accepts with ONE tap.
 *  - Max ONE input action per screen (no cluttered multi-field forms).
 *  - Multilingual via the shared i18n (EN/HI, more can be added).
 *
 * Captured per weaver (spec): name, village, craft type, years of experience,
 * one voice-recorded "my story" clip (stored as transcribed text), bank/UPI.
 *
 * On finish → writes a Weaver + a draft Product to the shared store, then hands
 * control to Module 2 (set a fair price) or Module 3 (see demand).
 *
 * `villageMode` (set by the parent / VillageAssistant) tags onboardedBy so the
 * admin view can separate bulk-onboarded weavers.
 */
import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Camera, Mic, MapPin, Hammer, Calendar, Wallet, BookOpen,
  Check, ChevronLeft, Loader2, Sparkles, UserPlus, TrendingUp,
} from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { useMarketplaceActions, addProduct } from "../../marketplace/useMarketplaceStore";
import { suggestProduct } from "../../marketplace/api";
import { defaultBreakdown } from "../../marketplace/pricing";
import type { ProductSuggestion } from "../../marketplace/api";
import { SectionHeader, BigButton, StepDots, inputClass } from "./primitives";
import PhotoCapture from "./PhotoCapture";
import VoiceButton from "./VoiceButton";

const CRAFT_OPTIONS = [
  "Kanchipuram Silk", "Paithani", "Chanderi Silk", "Banarasi",
  "Kasavu Cotton", "Bandhani", "Jamdani", "Ikat", "Tussar Silk",
];

interface Draft {
  photo?: string;
  title?: string;
  category?: string;
  material?: string;
  name?: string;
  village?: string;
  craftType?: string;
  yearsExperience?: number;
  bankUpiId?: string;
  storyText?: string;
  spokenPrice?: number; // price the weaver spoke aloud (Module 2 can prefill from this)
}

const STEPS = ["photo", "details", "voice", "profile", "story", "upi"] as const;

export default function OnboardingFlow({
  villageMode = false,
  assistantName,
  onComplete,
}: {
  villageMode?: boolean;
  assistantName?: string;
  onComplete?: (weaverId: string, productId: string) => void;
}) {
  const { t } = useLanguage();
  const actions = useMarketplaceActions();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({});
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestion, setSuggestion] = useState<ProductSuggestion | null>(null);
  const [acceptedSuggestion, setAcceptedSuggestion] = useState(false);
  const [done, setDone] = useState<{ weaverId: string; productId: string } | null>(null);

  // ── Photo → AI suggestion ──
  const handlePhoto = async (photo: string) => {
    setDraft((d) => ({ ...d, photo }));
    setAnalyzing(true);
    setSuggestion(null);
    setAcceptedSuggestion(false);
    const s = await suggestProduct(photo);
    setSuggestion(s);
    // Pre-fill but don't auto-accept — weaver confirms with one tap.
    setDraft((d) => ({ ...d, title: d.title || s.title, category: d.category || s.category, material: d.material || s.material }));
    setAnalyzing(false);
  };

  const canAdvance = useMemo(() => {
    switch (STEPS[step]) {
      case "photo": return !!draft.photo;
      case "details": return !!draft.title;
      case "voice": return true; // voice is optional; typed details accepted
      case "profile": return !!draft.name && !!draft.village && !!draft.craftType;
      case "story": return true; // optional
      case "upi": return true; // optional (can add later)
    }
  }, [step, draft]);

  const finish = () => {
    const weaver = actions.addWeaver({
      name: draft.name || "Unknown Weaver",
      village: draft.village || "",
      craftType: draft.craftType || "Handloom",
      yearsExperience: Number(draft.yearsExperience) || 0,
      bankUpiId: draft.bankUpiId || "",
      storyText: draft.storyText || "",
      storyLang: "auto",
      onboardedBy: villageMode ? assistantName || "Village Assistant" : "self",
    });
    // Seed the breakdown with the weaver's spoken price (if any) so Module 2
    // isn't a blank slate — it shows a fair split of their own figure.
    const base = defaultBreakdown();
    if (draft.spokenPrice && draft.spokenPrice > 0) {
      // Roughly attribute the spoken total: ~30% material, rest as labor at fair wage.
      base.rawMaterial = Math.round(draft.spokenPrice * 0.3);
      const remaining = draft.spokenPrice - base.rawMaterial - base.logistics;
      base.laborHours = Math.max(1, Math.round(remaining / base.wagePerHour));
    }
    const product = addProduct({
      weaverId: weaver.id,
      title: draft.title || "Untitled Product",
      category: draft.category || "Other",
      craftType: draft.craftType || "Handloom",
      material: draft.material || "",
      photo: draft.photo || "",
      priceBreakdown: base,
      aiSuggestedTitle: suggestion?.title,
      aiSuggestedCategory: suggestion?.category,
      storyText: draft.storyText,
      published: false,
    });
    setDone({ weaverId: weaver.id, productId: product.id });
    onComplete?.(weaver.id, product.id);
  };

  const reset = () => {
    setDraft({}); setStep(0); setSuggestion(null); setAcceptedSuggestion(false); setDone(null);
  };

  // ── Success screen ──
  if (done) {
    return (
      <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 p-8 md:p-12 flex flex-col items-center text-center">
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 rounded-full bg-[#15803d]/10 border-2 border-[#15803d] flex items-center justify-center mb-5">
          <Check className="h-10 w-10 text-[#15803d]" />
        </motion.div>
        <h3 className="font-serif text-2xl font-bold text-[#1a1a1a]">{t("onboard.success.title")}</h3>
        <p className="text-xs font-mono text-[#b45309] mt-2 uppercase tracking-widest">
          {t("onboard.success.id")} {done.weaverId}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 mt-8 w-full max-w-md">
          <BigButton variant="secondary" icon={Hammer} onClick={() => onComplete?.(done.weaverId, done.productId)}>
            {t("onboard.success.next")}
          </BigButton>
          <BigButton variant="ghost" icon={TrendingUp} onClick={() => onComplete?.(done.weaverId, done.productId)}>
            {t("onboard.success.dashboard")}
          </BigButton>
        </div>
        <button onClick={reset} className="mt-6 text-xs font-sans font-bold uppercase tracking-wider text-[#1a1a1a]/60 hover:text-[#b45309] flex items-center gap-1.5">
          <UserPlus className="h-3.5 w-3.5" /> {t("onboard.success.again")}
        </button>
      </div>
    );
  }

  return (
    <div>
      <SectionHeader
        badge={villageMode ? `${t("onboard.villageMode")} · ${t("onboard.villageModeOn")}` : t("onboard.badge")}
        title={t("onboard.title")}
        subtitle={t("onboard.subtitle")}
        icon={UserPlus}
      />

      {/* Progress */}
      <div className="flex items-center justify-between mb-8">
        <StepDots total={STEPS.length} current={step} />
        <span className="text-[10px] font-sans uppercase tracking-widest text-[#1a1a1a]/50">
          {t("onboard.step")} {step + 1} {t("onboard.of")} {STEPS.length}
        </span>
      </div>

      <div className="bg-white border border-[#1a1a1a]/15 p-6 md:p-10 min-h-[420px] flex flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.22 }}
            className="flex-1 flex flex-col"
          >

            {/* STEP 1 — PHOTO FIRST + AI SUGGEST */}
            {STEPS[step] === "photo" && (
              <PhotoStep
                draft={draft}
                analyzing={analyzing}
                suggestion={suggestion}
                accepted={acceptedSuggestion}
                onPhoto={handlePhoto}
                onAccept={() => {
                  if (suggestion) {
                    setDraft((d) => ({ ...d, title: suggestion.title, category: suggestion.category, material: suggestion.material }));
                  }
                  setAcceptedSuggestion(true);
                }}
                onEditTitle={(v) => { setDraft((d) => ({ ...d, title: v })); setAcceptedSuggestion(false); }}
                onEditCategory={(v) => { setDraft((d) => ({ ...d, category: v })); setAcceptedSuggestion(false); }}
              />
            )}

            {/* STEP 2 — CONFIRM DETAILS (title/category/material) */}
            {STEPS[step] === "details" && (
              <StepShell icon={Sparkles} title={t("onboard.step.title")}>
                <div className="space-y-4 max-w-md mx-auto w-full">
                  <label className="block">
                    <span className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">{t("onboard.step.title")}</span>
                    <input className={inputClass} value={draft.title || ""} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
                  </label>
                  <label className="block">
                    <span className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">{t("onboard.step.category")}</span>
                    <select className={inputClass} value={draft.category || ""} onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}>
                      <option value="">—</option>
                      {["Saree", "Stole", "Dupatta", "Fabric", "Shawl", "Other"].map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">{t("register.material")}</span>
                    <input className={inputClass} value={draft.material || ""} onChange={(e) => setDraft((d) => ({ ...d, material: e.target.value }))} />
                  </label>
                  {suggestion && !acceptedSuggestion && (
                    <button onClick={() => { setDraft((d) => ({ ...d, title: suggestion.title, category: suggestion.category, material: suggestion.material })); setAcceptedSuggestion(true); }}
                      className="w-full text-xs font-sans font-bold uppercase tracking-wider text-[#b45309] border border-[#b45309]/30 bg-[#b45309]/5 py-2.5 hover:bg-[#b45309]/10">
                      ✨ {t("onboard.step.accept")}
                    </button>
                  )}
                </div>
              </StepShell>
            )}

            {/* STEP 3 — VOICE FIRST: speak name, material, price */}
            {STEPS[step] === "voice" && (
              <StepShell icon={Mic} title={t("onboard.step.voice")} subtitle={t("onboard.step.voice.hint")}>
                <VoiceButton
                  onTranscript={(text) => {
                    // Naive field-filling: a spoken number is read as a price
                    // (used by Module 2); otherwise we treat the words as a
                    // product/material description so the weaver doesn't type.
                    const m = text.match(/(\d[\d,]*)/);
                    if (m) {
                      const priceNum = parseInt(m[1].replace(/,/g, ""), 10);
                      setDraft((d) => ({
                        ...d,
                        spokenPrice: priceNum,
                        material: d.material || text.replace(m[0], "").trim() || "Voice-described material",
                      }));
                    } else {
                      setDraft((d) => ({ ...d, title: d.title || text, material: d.material || text }));
                    }
                  }}
                />
                {draft.material && (
                  <p className="text-[11px] text-[#1a1a1a]/50 mt-6 text-center font-sans">
                    {t("onboard.step.voice.heard")} <span className="font-serif text-[#1a1a1a]">“{draft.material}”</span>
                  </p>
                )}
              </StepShell>
            )}

            {/* STEP 4 — PROFILE (one field per row, icon-led) */}
            {STEPS[step] === "profile" && (
              <div className="space-y-5 max-w-md mx-auto w-full">
                <ProfileRow icon={Check} label={t("onboard.step.name")}>
                  <input className={inputClass} value={draft.name || ""} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="e.g. Lakshmi Devi" />
                </ProfileRow>
                <ProfileRow icon={MapPin} label={t("onboard.step.village")}>
                  <input className={inputClass} value={draft.village || ""} onChange={(e) => setDraft((d) => ({ ...d, village: e.target.value }))} placeholder="e.g. Kuthampully" />
                </ProfileRow>
                <ProfileRow icon={Hammer} label={t("onboard.step.craft")} hint={t("onboard.step.craft.hint")}>
                  <div className="flex flex-wrap gap-2">
                    {CRAFT_OPTIONS.map((c) => (
                      <button key={c} type="button" onClick={() => setDraft((d) => ({ ...d, craftType: c }))}
                        className={`text-xs font-sans font-bold px-3 py-2 border transition-all ${draft.craftType === c ? "border-[#b45309] bg-[#b45309]/5 text-[#b45309]" : "border-[#1a1a1a]/20 text-[#1a1a1a]/70 hover:border-[#1a1a1a]/40"}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </ProfileRow>
                <ProfileRow icon={Calendar} label={t("onboard.step.years")}>
                  <input type="number" min={0} className={inputClass} value={draft.yearsExperience ?? ""} onChange={(e) => setDraft((d) => ({ ...d, yearsExperience: Number(e.target.value) }))} />
                </ProfileRow>
              </div>
            )}

            {/* STEP 5 — STORY (voice clip -> text) */}
            {STEPS[step] === "story" && (
              <StepShell icon={BookOpen} title={t("onboard.step.story")} subtitle={t("onboard.step.story.hint")}>
                <VoiceButton
                  onTranscript={(text) => setDraft((d) => ({ ...d, storyText: text }))}
                />
                {draft.storyText && (
                  <div className="mt-6 bg-[#f9f8f4] border-l-4 border-[#b45309] p-4 max-w-md mx-auto w-full">
                    <p className="text-sm font-serif italic text-[#1a1a1a]/80 leading-relaxed">“{draft.storyText}”</p>
                    <p className="text-[10px] text-[#15803d] font-sans font-bold uppercase tracking-wider mt-2">✓ {t("onboard.step.story.recorded")}</p>
                  </div>
                )}
              </StepShell>
            )}

            {/* STEP 6 — UPI */}
            {STEPS[step] === "upi" && (
              <StepShell icon={Wallet} title={t("onboard.step.upi")} subtitle={t("onboard.step.upi.hint")}>
                <div className="max-w-md mx-auto w-full">
                  <input className={inputClass} value={draft.bankUpiId || ""} onChange={(e) => setDraft((d) => ({ ...d, bankUpiId: e.target.value }))} placeholder="name@upi" />
                  <p className="text-[10px] text-[#1a1a1a]/40 mt-2 font-sans text-center">
                    🔒 {t("onboard.step.upi.hint")}
                  </p>
                </div>
              </StepShell>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav — one primary action per screen */}
        <div className="flex items-center gap-3 mt-8 pt-6 border-t border-[#1a1a1a]/10">
          {step > 0 && (
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} className="flex items-center gap-1 text-xs font-sans font-bold uppercase tracking-wider text-[#1a1a1a]/60 hover:text-[#1a1a1a]">
              <ChevronLeft className="h-4 w-4" /> {t("onboard.back")}
            </button>
          )}
          <div className="flex-1" />
          {STEPS[step] !== "photo" && STepSuffixOptional(step, t) && (
            <span className="text-[10px] text-[#1a1a1a]/40 font-sans uppercase tracking-wider mr-2">{t("onboard.skip")}</span>
          )}
          {step < STEPS.length - 1 ? (
            <BigButton onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
              {t("onboard.next")}
            </BigButton>
          ) : (
            <BigButton variant="secondary" icon={Check} onClick={finish} disabled={!draft.name || !draft.village || !draft.craftType}>
              {t("onboard.finish")}
            </BigButton>
          )}
        </div>
      </div>
    </div>
  );
}

// Mark which steps are skippable (voice, story, upi).
function STepSuffixOptional(step: number, _t: any) {
  const s = STEPS[step];
  return s === "voice" || s === "story" || s === "upi";
}

function StepShell({ icon: Icon, title, subtitle, children }: {
  icon: React.ElementType; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-[#b45309]/10 border border-[#b45309]/30 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-[#b45309]" />
      </div>
      <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">{title}</h3>
      {subtitle && <p className="text-xs text-[#1a1a1a]/55 mt-1 mb-6 max-w-sm font-sans">{subtitle}</p>}
      <div className="w-full mt-6">{children}</div>
    </div>
  );
}

function ProfileRow({ icon: Icon, label, hint, children }: {
  icon: React.ElementType; label: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-9 h-9 shrink-0 rounded-full bg-[#1a1a1a]/5 border border-[#1a1a1a]/10 flex items-center justify-center mt-0.5">
        <Icon className="h-4 w-4 text-[#1a1a1a]/60" />
      </div>
      <div className="flex-1">
        <span className="block text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a] mb-1.5">{label}</span>
        {children}
        {hint && <span className="block text-[10px] text-[#1a1a1a]/45 mt-1 font-sans">{hint}</span>}
      </div>
    </div>
  );
}

// ── Photo step with live AI suggestion card ──
function PhotoStep({
  draft, analyzing, suggestion, accepted,
  onPhoto, onAccept, onEditTitle, onEditCategory,
}: {
  draft: Draft; analyzing: boolean; suggestion: ProductSuggestion | null; accepted: boolean;
  onPhoto: (p: string) => void; onAccept: () => void;
  onEditTitle: (v: string) => void; onEditCategory: (v: string) => void;
}) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center text-center w-full">
      <div className="w-14 h-14 rounded-full bg-[#b45309]/10 border border-[#b45309]/30 flex items-center justify-center mb-4">
        <Camera className="h-7 w-7 text-[#b45309]" />
      </div>
      <h3 className="font-serif text-xl font-bold text-[#1a1a1a]">{t("onboard.step.photo")}</h3>
      <p className="text-xs text-[#1a1a1a]/55 mt-1 mb-6 max-w-sm font-sans">{t("onboard.step.photo.hint")}</p>

      <PhotoCapture value={draft.photo} onCapture={onPhoto} />

      {/* AI suggestion card */}
      {analyzing && (
        <div className="mt-6 flex items-center gap-2 text-xs font-sans uppercase tracking-wider text-[#b45309] animate-pulse">
          <Loader2 className="h-4 w-4 animate-spin" /> {t("onboard.step.analyzing")}
        </div>
      )}

      {suggestion && !accepted && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="mt-6 w-full max-w-md bg-[#f9f8f4] border border-[#b45309]/30 p-4 text-left">
          <div className="flex items-center gap-1.5 mb-2">
            <Sparkles className="h-3.5 w-3.5 text-[#b45309]" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#b45309]">{t("onboard.step.suggested")}</span>
            {suggestion.isMock && <span className="text-[9px] text-[#1a1a1a]/40 ml-auto">mock</span>}
          </div>
          <p className="font-serif text-base font-bold text-[#1a1a1a]">{suggestion.title}</p>
          <p className="text-xs text-[#1a1a1a]/60 font-sans mt-0.5">{suggestion.category} · {suggestion.material}</p>
          <button onClick={onAccept}
            className="mt-3 w-full bg-[#15803d] hover:bg-[#166534] text-white text-xs font-sans font-bold uppercase tracking-wider py-2.5 flex items-center justify-center gap-2">
            <Check className="h-4 w-4" /> {t("onboard.step.accept")}
          </button>
        </motion.div>
      )}

      {accepted && (
        <div className="mt-6 flex items-center gap-2 text-xs font-sans font-bold text-[#15803d] uppercase tracking-wider">
          <Check className="h-4 w-4" /> {t("onboard.step.accept")}
        </div>
      )}
    </div>
  );
}
