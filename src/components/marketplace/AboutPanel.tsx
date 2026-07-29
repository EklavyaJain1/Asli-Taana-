/**
 * About this project — in-app panel summarizing how the three modules solve
 * real gaps in the rural weaver digital economy (per spec DELIVERABLE).
 */
import React from "react";
import { Info, Mic, ShieldCheck, TrendingUp, Database, BookOpen } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import { SectionHeader } from "./primitives";

export default function AboutPanel() {
  const { t } = useLanguage();
  const modules = [
    { icon: Mic, badge: "Module 1", title: t("about.m1.title"), body: t("about.m1.body"), color: "text-[#b45309]" },
    { icon: ShieldCheck, badge: "Module 2", title: t("about.m2.title"), body: t("about.m2.body"), color: "text-[#15803d]" },
    { icon: TrendingUp, badge: "Module 3", title: t("about.m3.title"), body: t("about.m3.body"), color: "text-[#9a3412]" },
  ];

  return (
    <div className="max-w-4xl">
      <SectionHeader badge={t("about.title")} title={t("about.title")} subtitle={t("about.subtitle")} icon={BookOpen} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {modules.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="bg-white border border-[#1a1a1a]/15 p-5 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-9 h-9 rounded-full bg-[#1a1a1a]/5 border border-[#1a1a1a]/10 flex items-center justify-center`}>
                  <Icon className={`h-5 w-5 ${m.color}`} />
                </div>
                <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-[#1a1a1a]/40">{m.badge}</span>
              </div>
              <h4 className="font-serif text-base font-bold text-[#1a1a1a] mb-1.5">{m.title}</h4>
              <p className="text-xs text-[#1a1a1a]/60 font-sans leading-relaxed">{m.body}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-[#f9f8f4] border border-[#1a1a1a]/15 p-5 flex items-start gap-3">
        <Database className="h-5 w-5 text-[#b45309] shrink-0 mt-0.5" />
        <div>
          <h4 className="text-[10px] font-sans uppercase tracking-wider font-bold text-[#1a1a1a]">{t("about.data")}</h4>
          <p className="text-xs text-[#1a1a1a]/60 font-sans mt-1 leading-relaxed">{t("about.data.body")}</p>
        </div>
      </div>

      <div className="mt-6 text-[10px] font-sans text-[#1a1a1a]/40 flex items-center gap-1.5">
        <Info className="h-3 w-3" />
        Demo flow: onboard (1) → set fair price (2) → see demand (3) → public store. All data persists in localStorage.
      </div>
    </div>
  );
}
