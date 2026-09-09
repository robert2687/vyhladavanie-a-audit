import React, { useState } from "react";
import { X, Sparkles, Copy, Check, Sliders, Mail } from "lucide-react";
import { Prospect } from "../types";

interface RefinePitchModalProps {
  prospect: Prospect | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveUpdatedPitch: (prospectId: string, subject: string, body: string) => void;
}

export const RefinePitchModal: React.FC<RefinePitchModalProps> = ({
  prospect,
  isOpen,
  onClose,
  onSaveUpdatedPitch,
}) => {
  if (!isOpen || !prospect) return null;

  const [subject, setSubject] = useState(prospect.coldOutreach.subject);
  const [body, setBody] = useState(prospect.coldOutreach.body);
  const [tone, setTone] = useState<string>("direct");
  const [customOffer, setCustomOffer] = useState("");
  const [language, setLanguage] = useState<"sk" | "en">(
    (prospect.coldOutreach.language as "sk" | "en") || "sk"
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRegenerate = async () => {
    setIsGenerating(true);
    try {
      const savedKey = localStorage.getItem("slovak_leadgen_gemini_key") || "";
      const res = await fetch("/api/leads/refine-pitch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(savedKey ? { "x-gemini-api-key": savedKey } : {}),
        },
        body: JSON.stringify({
          companyName: prospect.companyName,
          decisionMaker: prospect.targetDecisionMaker,
          webSignals: prospect.identifiedWebSignals,
          valueProposition: prospect.valueProposition,
          tone: tone,
          language: language,
          customOffer: customOffer || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSubject(data.subject);
        setBody(data.body);
      }
    } catch (err) {
      console.error("Failed to regenerate pitch", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    onSaveUpdatedPitch(prospect.id, subject, body);
    onClose();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`Predmet: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-xl border border-stone-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 border-b border-stone-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-bold text-stone-900">
                Prispôsobiť Cold Outreach Draft
              </h3>
              <p className="text-xs text-stone-500">
                Pre: {prospect.companyName} ({prospect.targetDecisionMaker})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form controls */}
        <div className="p-5 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Tón komunikácie
              </label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              >
                <option value="direct">Priamy a vecný (odporúčané pre majiteľov)</option>
                <option value="consultative">Konzultatívny & poradenský</option>
                <option value="formal">Formálny firemný (veľké SMB)</option>
                <option value="technical">Technicky zameraný (pre technických riaditeľov)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                Jazyk
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as "sk" | "en")}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              >
                <option value="sk">Slovenčina (SK - vykanie)</option>
                <option value="en">English (EN)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Špecifická ponuka alebo zámienka (voliteľné)
            </label>
            <input
              type="text"
              placeholder="napr. Pripravil som 60-sekundové demo dopytového formulára priamo pre váš web..."
              value={customOffer}
              onChange={(e) => setCustomOffer(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            />
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isGenerating ? "Generujem nový draft..." : "Preformulovať s AI"}</span>
            </button>
          </div>

          {/* Editable Subject */}
          <div className="pt-2 border-t border-stone-100">
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Predmet e-mailu (Subject line)
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
            />
          </div>

          {/* Editable Body */}
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
              Telo e-mailu (3-4 vety, striktne hodnota)
            </label>
            <textarea
              rows={6}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-white border border-stone-300 rounded-xl p-3.5 text-sm text-stone-800 leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600/30 font-sans"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-3">
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-100"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Skopírované</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kopírovať e-mail</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              Zrušiť
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800 text-white rounded-xl shadow-xs"
            >
              Uložiť zmeny v drafte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
