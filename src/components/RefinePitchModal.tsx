import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from "react";
import { X, Sparkles, Copy, Check, Sliders, Mail } from "lucide-react";
import { Prospect, AIProviderId } from "../types";
import { safeFetchJson } from "../utils/api";
import { generateRefinedPitchFallback } from "../utils/fallbackData";

interface RefinePitchModalProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveUpdatedPitch: (prospectId: string, subject: string, body: string, language: "sk" | "en") => void;
  activeProvider?: AIProviderId;
  activeApiKey?: string;
  activeModel?: string;
}

export const RefinePitchModal: React.FC<RefinePitchModalProps> = ({
  prospect,
  isOpen,
  onClose,
  onSaveUpdatedPitch,
  activeProvider = "gemini",
  activeApiKey = "",
  activeModel,
}) => {
  const { language: uiLanguage, t } = useLanguage();
  const [subject, setSubject] = useState(prospect?.coldOutreach.subject ?? "");
  const [body, setBody] = useState(prospect?.coldOutreach.body ?? "");
  const [tone, setTone] = useState<string>("direct");
  const [customOffer, setCustomOffer] = useState("");
  const [language, setLanguage] = useState<"sk" | "en">(
    uiLanguage
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [draftLanguage, setDraftLanguage] = useState<"sk" | "en">(prospect?.coldOutreach.language === 'en' ? 'en' : 'sk');
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => setLanguage(uiLanguage), [uiLanguage, isOpen]);

  // Re-sync editable fields whenever a different prospect is opened.
  useEffect(() => {
    if (prospect) {
      setSubject(prospect.coldOutreach.subject);
      setBody(prospect.coldOutreach.body);
      setLanguage(uiLanguage);
      setDraftLanguage(prospect.coldOutreach.language === 'en' ? 'en' : 'sk');
      setNotice(null);
      setTone("direct");
      setCustomOffer("");
    }
  }, [prospect?.id]);

  if (!isOpen || !prospect) return null;

  const handleRegenerate = async () => {
    setIsGenerating(true);
    setNotice(null);
    try {
      const data = await safeFetchJson<{
        success?: boolean;
        subject?: string;
        body?: string;
        isMock?: boolean;
      }>("/api/leads/refine-pitch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-provider": activeProvider,
          ...(activeModel ? { "x-ai-model": activeModel } : {}),
          ...(activeApiKey ? { [`x-${activeProvider}-api-key`]: activeApiKey, "x-custom-api-key": activeApiKey } : {}),
        },
        body: JSON.stringify({
          provider: activeProvider,
          apiKey: activeApiKey || undefined,
          model: activeModel,
          companyName: prospect.companyName,
          decisionMaker: prospect.targetDecisionMaker,
          webSignals: prospect.identifiedWebSignals,
          valueProposition: prospect.valueProposition,
          tone: tone,
          language: language,
          customOffer: customOffer || undefined,
        }),
      });

      if (data.success && data.subject && data.body) {
        setSubject(data.subject);
        setBody(data.body);
        setDraftLanguage(language);
        if (data.isMock) setNotice(uiLanguage === 'en' ? 'Sample draft — live AI was unavailable.' : 'Ukážkový draft — živá AI nebola dostupná.');
      } else {
        throw new Error(uiLanguage === 'en' ? 'Could not generate a draft.' : 'Nepodarilo sa vygenerovať draft.');
      }
    } catch (err) {
      console.error("Failed to regenerate pitch via API, using fallback generator:", err);
      const fallback = generateRefinedPitchFallback(
        prospect.companyName,
        prospect.targetDecisionMaker,
        customOffer || prospect.valueProposition,
        tone,
        language
      );
      if (fallback.subject && fallback.body) {
        setSubject(fallback.subject);
        setBody(fallback.body);
      }
    } catch (err: any) {
      console.error("Failed to regenerate pitch", err);
      setNotice(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSaveUpdatedPitch(prospect.id, subject, body, draftLanguage);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(t("Predmet: {0}\n\n{1}", subject, body));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div data-testid="refine-pitch-modal-div-1" className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div data-testid="refine-pitch-modal-div-2" className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-stone-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div data-testid="refine-pitch-modal-div-3" className="p-3.5 sm:p-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
          <div data-testid="refine-pitch-modal-div-4" className="flex items-center gap-2 min-w-0">
            <span data-testid="refine-pitch-modal-span-5" className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
              <Sliders className="w-4 h-4" />
            </span>
            <div data-testid="refine-pitch-modal-div-6" className="min-w-0">
              <h3 data-testid="refine-pitch-modal-h3-7" className="text-sm sm:text-base font-bold text-stone-900 truncate">
                {t("Prispôsobiť Cold Outreach Draft")} </h3>
              <p data-testid="refine-pitch-modal-p-8" className="text-[11px] sm:text-xs text-stone-500 truncate">
                {t("Pre:")} {prospect.companyName} ({prospect.targetDecisionMaker})
              </p>
            </div>
          </div>

          <button data-testid="refine-pitch-modal-close-9"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors touch-manipulation shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form controls (Scrollable) */}
        <div data-testid="refine-pitch-modal-div-10" className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          {notice && <p role="status" data-testid="refine-notice" className="text-xs text-amber-800 bg-amber-50 p-3 rounded-lg">{notice}</p>}
          <div data-testid="refine-pitch-modal-div-11" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div data-testid="refine-pitch-modal-div-12">
              <label data-testid="refine-pitch-modal-label-13" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                {t("Tón komunikácie")} </label>
              <select data-testid="refine-pitch-modal-select-14"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 h-11 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 touch-manipulation"
              >
                <option data-testid="refine-pitch-modal-option-15" value="direct">{t("Priamy a vecný (odporúčané pre majiteľov)")}</option>
                <option data-testid="refine-pitch-modal-option-16" value="consultative">{t("Konzultatívny & poradenský")}</option>
                <option data-testid="refine-pitch-modal-option-17" value="formal">{t("Formálny firemný (veľké SMB)")}</option>
                <option data-testid="refine-pitch-modal-option-18" value="technical">{t("Technicky zameraný (pre technických riaditeľov)")}</option>
              </select>
            </div>

            <div data-testid="refine-pitch-modal-div-19">
              <label data-testid="refine-pitch-modal-label-20" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                {t("Jazyk")} </label>
              <select data-testid="refine-pitch-modal-select-21"
                value={language}
                onChange={(e) => setLanguage(e.target.value as "sk" | "en")}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 h-11 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 touch-manipulation"
              >
                <option data-testid="refine-pitch-modal-option-22" value="sk">{t("Slovenčina (SK - vykanie)")}</option>
                <option data-testid="refine-pitch-modal-option-23" value="en">English (EN)</option>
              </select>
            </div>
          </div>

          <div data-testid="refine-pitch-modal-div-24">
            <label data-testid="refine-pitch-modal-label-25" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              {t("Špecifická ponuka alebo zámienka (voliteľné)")} </label>
            <input data-testid="refine-pitch-modal-input-26"
              type="text"
              placeholder={t("napr. Pripravil som 60-sekundové demo dopytového formulára priamo pre váš web...")}
              value={customOffer}
              onChange={(e) => setCustomOffer(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 h-11 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 touch-manipulation"
            />
          </div>

          <div data-testid="refine-pitch-modal-div-27" className="flex justify-end pt-1">
            <button data-testid="refine-pitch-modal-regenerate-28"
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 min-h-[42px] rounded-xl text-xs sm:text-sm font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-colors disabled:opacity-50 touch-manipulation"
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span data-testid="refine-pitch-modal-span-29">{isGenerating ? t("Generujem nový draft...") : t("Preformulovať s AI")}</span>
            </button>
          </div>

          {/* Editable Subject */}
          <div data-testid="refine-pitch-modal-div-30" className="pt-2 border-t border-stone-100">
            <label data-testid="refine-pitch-modal-label-31" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              {t("Predmet e-mailu (Subject line)")} </label>
            <input data-testid="refine-pitch-modal-input-32"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 h-11 text-base sm:text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 touch-manipulation"
            />
          </div>

          {/* Editable Body */}
          <div data-testid="refine-pitch-modal-div-33">
            <label data-testid="refine-pitch-modal-label-34" className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              {t("Telo e-mailu (3-4 vety, striktne hodnota)")} </label>
            <textarea data-testid="refine-pitch-modal-textarea-35"
              rows={5}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl p-3.5 text-base sm:text-sm text-stone-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/30 font-sans touch-manipulation"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div data-testid="refine-pitch-modal-div-36" className="p-3.5 sm:p-5 bg-stone-50 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 shrink-0">
          <button data-testid="refine-pitch-modal-copy-37"
            onClick={handleCopy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 min-h-[42px] text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100 touch-manipulation"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span data-testid="refine-pitch-modal-span-38">{t("Skopírované do schránky")}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span data-testid="refine-pitch-modal-span-39">{t("Kopírovať e-mail")}</span>
              </>
            )}
          </button>

          <div data-testid="refine-pitch-modal-div-40" className="grid grid-cols-2 sm:flex items-center gap-2">
            <button data-testid="refine-pitch-modal-close-41"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-xl touch-manipulation"
            >
              {t("Zrušiť")} </button>
            <button data-testid="refine-pitch-modal-save-42"
              onClick={handleSave}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 min-h-[42px] text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs touch-manipulation"
            >
              {t("Uložiť zmeny")} </button>
          </div>
        </div>
      </div>
    </div>
  );
};
