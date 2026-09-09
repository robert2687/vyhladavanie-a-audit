import React, { useState } from "react";
import { Globe, Search, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import { SLOVAK_INDUSTRIES } from "../data/slovakData";

interface InstantAuditProps {
  onAudit: (urlOrName: string, industry: string, language: "sk" | "en") => void;
  isLoading: boolean;
}

export const InstantAudit: React.FC<InstantAuditProps> = ({ onAudit, isLoading }) => {
  const [target, setTarget] = useState("");
  const [industry, setIndustry] = useState(SLOVAK_INDUSTRIES[0].name);
  const [language, setLanguage] = useState<"sk" | "en">("sk");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!target.trim()) return;
    onAudit(target.trim(), industry, language);
  };

  const handleQuickFill = (sampleTarget: string, sampleIndustry: string) => {
    setTarget(sampleTarget);
    setIndustry(sampleIndustry);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 sm:p-8">
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
            <Globe className="w-5 h-5" />
          </span>
          <h2 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
            Okamžitý audit slovenskej firmy & webu
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-stone-600">
          Zadajte URL adresu webu (napr. <code>stavomont.sk</code>), názov firmy alebo IČO.
          Systém preverí digitálne signály, overí konateľa v ORSR/FinStat a pripraví riešenie s cold outreach draftom.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-5 sm:mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              URL webu, Obchodné meno alebo IČO
            </label>
            <div className="relative">
              <input
                id="instant-audit-input"
                type="text"
                placeholder="napr. in-vest.sk, mont-r.sk, alebo 36244491..."
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-4 pr-10 h-12 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 touch-manipulation"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                <Search className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Odvetvie
            </label>
            <select
              id="instant-audit-industry-select"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 h-12 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 touch-manipulation"
            >
              {SLOVAK_INDUSTRIES.map((ind) => (
                <option key={ind.id} value={ind.name}>
                  {ind.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-2">
          {/* Quick presets */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <span className="font-semibold text-stone-700 shrink-0">Rýchly test:</span>
            <button
              type="button"
              onClick={() => handleQuickFill("in-vest.sk", "Stavebníctvo & Priemyselné stavby")}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium transition-colors shrink-0 touch-manipulation"
            >
              in-vest.sk
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("mont-r.sk", "Kovoobrábanie, CNC & Strojárstvo")}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium transition-colors shrink-0 touch-manipulation"
            >
              mont-r.sk
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill("klimaservis.sk", "Inštalácie TZB, Fotovoltika & HVAC")}
              className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-medium transition-colors shrink-0 touch-manipulation"
            >
              klimaservis.sk
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as "sk" | "en")}
              className="bg-stone-100 border border-stone-300 rounded-xl px-3 h-11 text-xs font-medium text-stone-800 focus:outline-none touch-manipulation"
            >
              <option value="sk">Draft: Slovenčina</option>
              <option value="en">Draft: English</option>
            </select>

            <button
              id="submit-instant-audit-btn"
              type="submit"
              disabled={isLoading || !target.trim()}
              className="inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-sm px-6 py-3 min-h-[48px] rounded-xl shadow-xs transition-all active:scale-[0.98] touch-manipulation"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Auditujem web a registre...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Spustiť hĺbkový audit</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
