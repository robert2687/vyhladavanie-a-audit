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
      const emailText = `Predmet: ${prospect.coldOutreach.subject}\n\n${prospect.coldOutreach.body}`;
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
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Top Bar / Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-stone-50 via-white to-stone-50 border-b border-stone-100 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold text-stone-900 tracking-tight">
              {prospect.companyName}
            </h3>
            {prospect.ico && (
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700 border border-stone-200">
                IČO: {prospect.ico}
              </span>
            )}
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
              {prospect.industry}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600 pt-1">
            <span className="font-medium text-stone-800">Veľkosť: {prospect.companySize}</span>
            <span className="text-stone-300">•</span>
            <span>Región: {prospect.region}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onToggleSave(prospect)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              isSaved
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Uložené v Pipeline</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5 text-stone-400" />
                <span>Uložiť do Pipeline</span>
              </>
            )}
          </button>

          <button
            onClick={handleCopySchema}
            title="Kopírovať celú výstupnú schému"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-200 bg-white text-stone-700 hover:bg-stone-50 transition-colors"
          >
            {copiedSchema ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Skopírované</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-500" />
                <span>Kopírovať schému</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Core Profile Fields (Exact Schema adherence) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-stone-50/80 border border-stone-200/70">
          {/* Website */}
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Website
            </span>
            <a
              href={prospect.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 hover:text-blue-800 hover:underline break-all"
            >
              <span>{prospect.website.replace(/^https?:\/\//, "")}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          {/* Target Decision-Maker */}
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              Target Decision-Maker
            </span>
            <p className="text-sm font-semibold text-stone-900 leading-snug">
              {prospect.targetDecisionMaker}
            </p>
            {prospect.decisionMakerSource && (
              <span className="text-[10px] text-stone-500 block mt-0.5">
                Zdroj: {prospect.decisionMakerSource}
              </span>
            )}
          </div>

          {/* Direct Contact */}
          <div>
            <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-blue-600" />
              Direct Contact
            </span>
            <p className="text-sm font-medium text-stone-800 break-words">
              {prospect.directContact}
            </p>
            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm inline-block mt-0.5">
              Bez všeobecného info@ e-mailu
            </span>
          </div>
        </div>

        {/* Identified Web Signals & Gaps */}
        <div className="border-t border-stone-100 pt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-md bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              Identified Web Signals & Gaps:
            </h4>
          </div>
          <ul className="space-y-2 pl-2">
            {prospect.identifiedWebSignals.map((signal, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-sm text-stone-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0"></span>
                <span>{signal}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Value Proposition & Solution */}
        <div className="border-t border-stone-100 pt-5">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-md bg-blue-100 text-blue-800 flex items-center justify-center shrink-0">
              <Lightbulb className="w-3.5 h-3.5" />
            </div>
            <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
              Value Proposition & Solution:
            </h4>
          </div>
          <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-100 text-sm text-stone-800 font-medium leading-relaxed">
            {prospect.valueProposition}
          </div>
        </div>

        {/* Cold Outreach Draft (Personalized Pitch) */}
        <div className="border-t border-stone-100 pt-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0">
                <Mail className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wide">
                Cold Outreach Draft (Personalized Pitch):
              </h4>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenRefineModal(prospect)}
                className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 px-2.5 py-1 rounded-md transition-colors"
                title="Prispôsobiť tón alebo zmeniť ponuku"
              >
                <Sliders className="w-3 h-3 text-stone-500" />
                <span>Prispôsobiť pitch</span>
              </button>

              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-800 hover:bg-blue-50 px-2.5 py-1 rounded-md transition-colors"
              >
                {copiedEmail ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span className="text-emerald-700">Skopírované</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Kopírovať text</span>
                  </>
                )}
              </button>

              <a
                href={mailtoUrl}
                className="inline-flex items-center gap-1 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 rounded-md transition-colors"
              >
                <Mail className="w-3 h-3" />
                <span>Otvoriť e-mail</span>
              </a>
            </div>
          </div>

          {/* Email Preview Box */}
          <div className="rounded-xl border border-stone-200 bg-stone-50/50 p-4 space-y-3 font-sans text-xs sm:text-sm">
            <div>
              <span className="font-semibold text-stone-500 block text-xs">Subject:</span>
              <p className="font-semibold text-stone-900 mt-0.5">
                {prospect.coldOutreach.subject}
              </p>
            </div>
            <div className="border-t border-stone-200/70 pt-2.5">
              <span className="font-semibold text-stone-500 block text-xs mb-1">Body (3-4 vety):</span>
              <p className="text-stone-700 whitespace-pre-line leading-relaxed">
                {prospect.coldOutreach.body}
              </p>
            </div>
          </div>
        </div>

        {/* Public Registers Quick Inspection Links */}
        <div className="border-t border-stone-100 pt-4 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-stone-500 font-medium">
            <Building className="w-3.5 h-3.5 text-stone-400" />
            <span>Verejné registre SR:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <a
              href={prospect.registers.orsrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors"
            >
              <span>ORSR.sk výpis</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <a
              href={prospect.registers.finstatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors"
            >
              <span>FinStat profil</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>

            <a
              href={prospect.registers.overitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium transition-colors"
            >
              <span>Overit.sk</span>
              <ExternalLink className="w-3 h-3 text-stone-400" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
