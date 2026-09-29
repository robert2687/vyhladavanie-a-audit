import { useLanguage } from '../context/LanguageContext';
import React, { useState } from "react";
import {
  ExternalLink,
  Copy,
  Check,
  Mail,
  Phone,
  UserCheck,
  AlertTriangle,
  Lightbulb,
  Building,
  Bookmark,
  BookmarkCheck,
  Sliders,
  Share2,
  FileSpreadsheet,
} from "lucide-react";
import { Prospect } from "../types";

interface ProspectCardProps {
  prospect: Prospect;
  isSaved: boolean;
  onToggleSave: (prospect: Prospect) => void;
  onUpdateStatus?: (id: string, status: Prospect["status"]) => void;
  onOpenRefineModal: (prospect: Prospect) => void;
}

export const ProspectCard: React.FC<ProspectCardProps> = ({
  prospect,
  isSaved,
  onToggleSave,
  onUpdateStatus,
  onOpenRefineModal,
}) => {
  const { language: uiLanguage, t } = useLanguage();
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Generate markdown matching the exact output schema requested by user
  const generateMarkdownSchema = () => {
    return `**Company Name:** ${prospect.companyName}
**Website:** ${prospect.website}
**Company Size / Industry:** ${prospect.companySize} | ${prospect.industry}
**Target Decision-Maker:** ${prospect.targetDecisionMaker}
**Direct Contact:** ${prospect.directContact}

**Identified Web Signals & Gaps:**
${prospect.identifiedWebSignals.map((gap) => `- ${gap}`).join("\n")}

**Value Proposition & Solution:**
- ${prospect.valueProposition}

**Cold Outreach Draft (Personalized Pitch):**
- Subject: ${prospect.coldOutreach.subject}
- Body: ${prospect.coldOutreach.body}`;
  };

  const handleCopySchema = async () => {
    try {
      await navigator.clipboard.writeText(generateMarkdownSchema());
      setCopiedSchema(true);
      setTimeout(() => setCopiedSchema(false), 2000);
    } catch (err) {
      console.error("Failed to copy schema", err);
    }
  };

  const handleCopyEmail = async () => {
    try {
      const emailText = t("Predmet: {0}\n\n{1}", prospect.coldOutreach.subject, prospect.coldOutreach.body);
      await navigator.clipboard.writeText(emailText);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error("Failed to copy email", err);
    }
  };

  const mailtoUrl = `mailto:${encodeURIComponent(
    prospect.directContact.includes("@")
      ? prospect.directContact.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || ""
      : ""
  )}?subject=${encodeURIComponent(prospect.coldOutreach.subject)}&body=${encodeURIComponent(
    prospect.coldOutreach.body
  )}`;

  return (
    <div data-testid={`prospect-card-div-1-${prospect.id}`} className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div data-testid={`prospect-card-div-2-${prospect.id}`} className="flex flex-wrap gap-2 px-4 sm:px-6 pt-3 text-[11px] font-semibold text-stone-500">
        <span data-testid={`prospect-language-${prospect.id}`}>{prospect.coldOutreach.language === 'en' ? 'English' : prospect.coldOutreach.language === 'sk' ? 'Slovenčina' : t('Neuvedené')}</span>
        {prospect.isMock && <span data-testid={`prospect-sample-${prospect.id}`} className="text-amber-800">{uiLanguage === 'en' ? 'SAMPLE · Unverified' : 'UKÁŽKA · Neoverené'}</span>}
      </div>
      {/* Top Bar / Header */}
      <div data-testid={`prospect-card-div-3-${prospect.id}`} className="p-4 sm:p-6 bg-gradient-to-r from-stone-50 via-white to-stone-50 border-b border-stone-100 flex flex-col sm:flex-row sm:items-start justify-between gap-3.5 sm:gap-4">
        <div data-testid={`prospect-card-div-4-${prospect.id}`} className="space-y-1">
          <div data-testid={`prospect-card-div-5-${prospect.id}`} className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <h3 data-testid={`prospect-card-h3-6-${prospect.id}`} className="text-base sm:text-lg font-bold text-stone-900 tracking-tight leading-snug">
              {prospect.companyName}
            </h3>
            {prospect.ico && (
              <span data-testid={`prospect-card-span-7-${prospect.id}`} className="font-mono text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                {t("IČO:")} {prospect.ico}
              </span>
            )}
            <span data-testid={`prospect-card-span-8-${prospect.id}`} className="text-[11px] sm:text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
              {prospect.industry}
            </span>
          </div>

          <div data-testid={`prospect-card-div-9-${prospect.id}`} className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-stone-600 pt-0.5">
            <span data-testid={`prospect-card-span-10-${prospect.id}`} className="font-medium text-stone-800">{t("Veľkosť:")} {prospect.companySize}</span>
            <span data-testid={`prospect-card-span-11-${prospect.id}`} className="text-stone-300">•</span>
            <span data-testid={`prospect-card-span-12-${prospect.id}`}>{t("Región:")} {prospect.region}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div data-testid={`prospect-card-div-13-${prospect.id}`} className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0 pt-1 sm:pt-0">
          <button data-testid={`prospect-card-button-14-${prospect.id}`}
            onClick={() => onToggleSave(prospect)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors min-h-[42px] touch-manipulation ${
              isSaved
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50"
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-blue-600 shrink-0" />
                <span data-testid={`prospect-card-span-15-${prospect.id}`} className="truncate">{t("V Pipeline")}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4 text-stone-400 shrink-0" />
                <span data-testid={`prospect-card-span-16-${prospect.id}`} className="truncate">{t("Uložiť do Pipeline")}</span>
              </>
            )}
          </button>

          <button data-testid={`prospect-card-copy-schema-17-${prospect.id}`}
            onClick={handleCopySchema}
            title={t("Kopírovať celú výstupnú schému")}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors min-h-[42px] touch-manipulation"
          >
            {copiedSchema ? (
              <>
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span data-testid={`prospect-card-span-18-${prospect.id}`} className="text-emerald-700 truncate">{t("Skopírované")}</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-stone-500 shrink-0" />
                <span data-testid={`prospect-card-span-19-${prospect.id}`} className="truncate">{t("Kopírovať schému")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div data-testid={`prospect-card-div-20-${prospect.id}`} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
        {/* Core Profile Fields (Exact Schema adherence) */}
        <div data-testid={`prospect-card-div-21-${prospect.id}`} className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 p-3.5 sm:p-4 rounded-xl bg-stone-50/80 border border-stone-200/70">
          {/* Website */}
          <div data-testid={`prospect-card-div-22-${prospect.id}`}>
            <span data-testid={`prospect-card-span-23-${prospect.id}`} className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Website
            </span>
            <a data-testid={`prospect-card-a-24-${prospect.id}`}
              href={prospect.website || undefined}
              aria-disabled={!prospect.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline break-all py-0.5 touch-manipulation"
            >
              <span data-testid={`prospect-card-span-25-${prospect.id}`}>{prospect.website.replace(/^https?:\/\//, "") || t('Neuvedené')}</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          {/* Target Decision-Maker */}
          <div data-testid={`prospect-card-div-26-${prospect.id}`}>
            <span data-testid={`prospect-card-span-27-${prospect.id}`} className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Target Decision-Maker
            </span>
            <p data-testid={`prospect-card-p-28-${prospect.id}`} className="text-sm font-semibold text-stone-900 leading-snug">
              {prospect.targetDecisionMaker}
            </p>
            {prospect.decisionMakerSource && (
              <span data-testid={`prospect-card-span-29-${prospect.id}`} className="text-[10px] text-stone-500 block mt-0.5">
                {t("Zdroj:")} {prospect.decisionMakerSource}
              </span>
            )}
          </div>

          {/* Direct Contact */}
          <div data-testid={`prospect-card-div-30-${prospect.id}`}>
            <span data-testid={`prospect-card-span-31-${prospect.id}`} className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              Direct Contact
            </span>
            <p data-testid={`prospect-card-p-32-${prospect.id}`} className="text-sm font-medium text-stone-800 break-words">
              {prospect.directContact}
            </p>
            <span data-testid={`prospect-card-span-33-${prospect.id}`} className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mt-0.5">
              {t("Bez všeobecného info@ e-mailu")} </span>
          </div>
        </div>

        {/* Identified Web Signals & Gaps */}
        <div data-testid={`prospect-card-div-34-${prospect.id}`} className="border-t border-stone-100 pt-4 sm:pt-5">
          <div data-testid={`prospect-card-div-35-${prospect.id}`} className="flex items-center gap-2 mb-3">
            <div data-testid={`prospect-card-div-36-${prospect.id}`} className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h4 data-testid={`prospect-card-h4-37-${prospect.id}`} className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wide">
              Identified Web Signals & Gaps:
            </h4>
          </div>
          <ul data-testid={`prospect-card-ul-38-${prospect.id}`} className="space-y-2 pl-1 sm:pl-2">
            {prospect.identifiedWebSignals.map((signal, idx) => (
              <li data-testid={`prospect-card-li-39-${idx}-${prospect.id}`} key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-stone-700 leading-relaxed">
                <span data-testid={`prospect-card-span-40-${idx}-${prospect.id}`} className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                <span data-testid={`prospect-card-span-41-${idx}-${prospect.id}`}>{signal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Value Proposition & Solution */}
        <div data-testid={`prospect-card-div-42-${prospect.id}`} className="border-t border-stone-100 pt-4 sm:pt-5">
          <div data-testid={`prospect-card-div-43-${prospect.id}`} className="flex items-center gap-2 mb-2">
            <div data-testid={`prospect-card-div-44-${prospect.id}`} className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <h4 data-testid={`prospect-card-h4-45-${prospect.id}`} className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wide">
              Value Proposition & Solution:
            </h4>
          </div>
          <div data-testid={`prospect-card-div-46-${prospect.id}`} className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-xs sm:text-sm text-stone-800 font-medium leading-relaxed">
            {prospect.valueProposition}
          </div>
        </div>

        {/* Cold Outreach Draft (Personalized Pitch) */}
        <div data-testid={`prospect-card-div-47-${prospect.id}`} className="border-t border-stone-100 pt-4 sm:pt-5">
          <div data-testid={`prospect-card-div-48-${prospect.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 mb-3">
            <div data-testid={`prospect-card-div-49-${prospect.id}`} className="flex items-center gap-2">
              <div data-testid={`prospect-card-div-50-${prospect.id}`} className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <h4 data-testid={`prospect-card-h4-51-${prospect.id}`} className="text-xs sm:text-sm font-bold text-stone-900 uppercase tracking-wide">
                Cold Outreach Draft (Personalized Pitch):
              </h4>
            </div>

            <div data-testid={`prospect-card-div-52-${prospect.id}`} className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
              <button data-testid={`prospect-card-button-53-${prospect.id}`}
                onClick={() => onOpenRefineModal(prospect)}
                className="inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold text-stone-700 hover:text-stone-900 hover:bg-stone-100 px-2 py-1.5 rounded-lg border border-stone-200/80 transition-colors min-h-[38px] touch-manipulation"
                title={t("Prispôsobiť tón alebo zmeniť ponuku")}
              >
                <Sliders className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span data-testid={`prospect-card-span-54-${prospect.id}`} className="truncate">{t("Upraviť")}</span>
              </button>

              <button data-testid={`prospect-card-copy-email-55-${prospect.id}`}
                onClick={handleCopyEmail}
                className="inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-2 py-1.5 rounded-lg border border-blue-200/80 transition-colors min-h-[38px] touch-manipulation"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span data-testid={`prospect-card-span-56-${prospect.id}`} className="text-emerald-700 truncate">{t("Skopírované")}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 shrink-0" />
                    <span data-testid={`prospect-card-span-57-${prospect.id}`} className="truncate">{t("Kopírovať")}</span>
                  </>
                )}
              </button>

              <a data-testid={`prospect-card-a-58-${prospect.id}`}
                href={mailtoUrl}
                className="inline-flex items-center justify-center gap-1 text-[11px] sm:text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1.5 rounded-lg transition-colors min-h-[38px] touch-manipulation"
              >
                <Mail className="w-3.5 h-3.5 shrink-0" />
                <span data-testid={`prospect-card-span-59-${prospect.id}`} className="truncate">{t("E-mail")}</span>
              </a>
            </div>
          </div>

          {/* Email Preview Box */}
          <div data-testid={`prospect-card-div-60-${prospect.id}`} className="rounded-xl border border-stone-200 bg-stone-50/50 p-3.5 sm:p-4 space-y-2.5 sm:space-y-3 font-sans text-xs sm:text-sm">
            <div data-testid={`prospect-card-div-61-${prospect.id}`}>
              <span data-testid={`prospect-card-span-62-${prospect.id}`} className="font-semibold text-stone-500 block text-xs">Subject:</span>
              <p data-testid={`prospect-card-p-63-${prospect.id}`} className="font-semibold text-stone-900 mt-0.5">
                {prospect.coldOutreach.subject}
              </p>
            </div>
            <div data-testid={`prospect-card-div-64-${prospect.id}`} className="border-t border-stone-200/70 pt-2.5">
              <span data-testid={`prospect-card-span-65-${prospect.id}`} className="font-semibold text-stone-500 block text-xs mb-1">{t("Body (3-4 vety):")}</span>
              <p data-testid={`prospect-card-p-66-${prospect.id}`} className="text-stone-700 whitespace-pre-line leading-relaxed">
                {prospect.coldOutreach.body}
              </p>
            </div>
          </div>
        </div>

        {/* Public Registers Quick Inspection Links */}
        <div data-testid={`prospect-card-div-67-${prospect.id}`} className="border-t border-stone-100 pt-3.5 sm:pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs">
          <div data-testid={`prospect-card-div-68-${prospect.id}`} className="flex items-center gap-1.5 text-stone-500 font-medium">
            <Building className="w-3.5 h-3.5 text-stone-400" />
            <span data-testid={`prospect-card-span-69-${prospect.id}`}>{t("Verejné registre SR:")}</span>
          </div>

          <div data-testid={`prospect-card-div-70-${prospect.id}`} className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2">
            <a data-testid={`prospect-card-a-71-${prospect.id}`}
              href={prospect.registers.orsrUrl || undefined}
              aria-disabled={!prospect.registers.orsrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-2 sm:py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition-colors min-h-[38px] touch-manipulation text-center"
            >
              <span data-testid={`prospect-card-span-72-${prospect.id}`} className="truncate">{t("ORSR výpis")}</span>
              <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
            </a>

            <a data-testid={`prospect-card-a-73-${prospect.id}`}
              href={prospect.registers.finstatUrl || undefined}
              aria-disabled={!prospect.registers.finstatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-2 sm:py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition-colors min-h-[38px] touch-manipulation text-center"
            >
              <span data-testid={`prospect-card-span-74-${prospect.id}`} className="truncate">{t("FinStat profil")}</span>
              <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
            </a>

            <a data-testid={`prospect-card-a-75-${prospect.id}`}
              href={prospect.registers.overitUrl || undefined}
              aria-disabled={!prospect.registers.overitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1 px-2 sm:px-2.5 py-2 sm:py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold transition-colors min-h-[38px] touch-manipulation text-center"
            >
              <span data-testid={`prospect-card-span-76-${prospect.id}`} className="truncate">Overit.sk</span>
              <ExternalLink className="w-3 h-3 text-stone-400 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
