import { useLanguage } from '../context/LanguageContext';
import React, { useState } from "react";
import {
  Download,
  Copy,
  Trash2,
  Check,
  Search,
  Filter,
  FileSpreadsheet,
  Building2,
  ExternalLink,
  Mail,
  UserCheck,
  Send,
  Loader2,
  Contact,
} from "lucide-react";
import { Prospect } from "../types";
import { ProspectCard } from "./ProspectCard";
import { CopyFallback } from './CopyFallback';

interface PipelineViewProps {
  savedProspects: Prospect[];
  onRemoveFromPipeline: (id: string) => void;
  onUpdateStatus: (id: string, status: Prospect["status"]) => void;
  onOpenRefineModal: (prospect: Prospect) => void;
  onClearAll: () => void;
  onEmailMyLeads?: () => Promise<{ ok: boolean; message: string }>;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  savedProspects,
  onRemoveFromPipeline,
  onUpdateStatus,
  onOpenRefineModal,
  onClearAll,
  onEmailMyLeads,
}) => {
  const { language: uiLanguage, t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedCrm, setCopiedCrm] = useState(false);
  const [emailing, setEmailing] = useState(false);
  const [emailNotice, setEmailNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [copyFallback, setCopyFallback] = useState<{ text: string; format: 'md' | 'tsv' } | null>(null);
  const copyExport = async (text: string, format: 'md' | 'tsv') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyFallback(null);
      return true;
    } catch {
      setCopyFallback({ text, format });
      return false;
    }
  };

  const extractEmail = (contact: string) => contact.match(/[\w.-]+@[\w.-]+\.\w+/)?.[0] || "";
  const extractPhone = (contact: string) => contact.match(/\+?\d[\d\s]{6,}\d/)?.[0]?.trim() || "";

  const filtered = savedProspects.filter((item) => {
    const matchesSearch =
      item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t(item.industry).toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.targetDecisionMaker.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter || (statusFilter === 'new' && item.status === 'saved');
    return matchesSearch && matchesStatus;
  });

  const exportToCSV = () => {
    if (savedProspects.length === 0) return;

    const headers = [
      "Company Name",
      "IČO",
      "Website",
      "Company Size",
      "Industry",
      "Region",
      "Target Decision Maker",
      "Direct Contact",
      "Identified Web Signals",
      "Value Proposition",
      "Cold Email Subject",
      "Cold Email Body",
      "Status",
    ];

    const rows = savedProspects.map((p) => [
      `"${p.companyName.replace(/"/g, '""')}"`,
      `"${p.ico || ""}"`,
      `"${p.website}"`,
      `"${p.companySize}"`,
      `"${p.industry}"`,
      `"${p.region}"`,
      `"${p.targetDecisionMaker.replace(/"/g, '""')}"`,
      `"${p.directContact.replace(/"/g, '""')}"`,
      `"${p.identifiedWebSignals.join("; ").replace(/"/g, '""')}"`,
      `"${p.valueProposition.replace(/"/g, '""')}"`,
      `"${p.coldOutreach.subject.replace(/"/g, '""')}"`,
      `"${p.coldOutreach.body.replace(/"/g, '""')}"`,
      `"${p.status}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `slovak_b2b_leads_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyAllMarkdown = async () => {
    if (savedProspects.length === 0) return;
    const text = savedProspects
      .map((p, idx) => {
        return `### Prospect #${idx + 1}:
**Company Name:** ${p.companyName}
**Website:** ${p.website}
**Company Size / Industry:** ${p.companySize} | ${p.industry}
**Target Decision-Maker:** ${p.targetDecisionMaker}
**Direct Contact:** ${p.directContact}

**Identified Web Signals & Gaps:**
${p.identifiedWebSignals.map((gap) => `- ${gap}`).join("\n")}

**Value Proposition & Solution:**
- ${p.valueProposition}

**Cold Outreach Draft (Personalized Pitch):**
- Subject: ${p.coldOutreach.subject}
- Body: ${p.coldOutreach.body}
----------------------------------------`;
      })
      .join("\n\n");

    setCopiedAll(await copyExport(text, 'md'));
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // HubSpot / Pipedrive friendly tab-separated columns, ready to paste into an import.
  const copyForCRM = async () => {
    if (savedProspects.length === 0) return;
    const headers = [
      "Company name",
      "Website",
      "Industry",
      "Contact name",
      "Email",
      "Phone",
      "Deal stage",
      "Notes",
    ];
    const stageMap: Record<string, string> = {
      new: "New",
      saved: "New",
      contacted: "Contacted",
      meeting: "Meeting scheduled",
      archived: "Archived",
    };
    const lines = savedProspects.map((p) =>
      [
        p.companyName,
        p.website,
        p.industry,
        p.targetDecisionMaker,
        extractEmail(p.directContact),
        extractPhone(p.directContact),
        stageMap[p.status] || "New",
        (p.valueProposition || "").replace(/\t/g, " "),
      ]
        .map((v) => String(v ?? "").replace(/[\t\n\r]+/g, " ").trim())
        .join("\t")
    );
    setCopiedCrm(await copyExport([headers.join("\t"), ...lines].join("\n"), 'tsv'));
    setTimeout(() => setCopiedCrm(false), 2000);
  };

  const handleEmailMe = async () => {
    if (!onEmailMyLeads || emailing) return;
    setEmailing(true);
    setEmailNotice(null);
    const result = await onEmailMyLeads();
    setEmailNotice(result);
    setEmailing(false);
    setTimeout(() => setEmailNotice(null), 6000);
  };

  if (savedProspects.length === 0) {
    return (
      <div data-testid="pipeline-view-div-1" className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center">
        <div data-testid="pipeline-view-div-2" className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 data-testid="pipeline-view-h3-3" className="text-base font-bold text-stone-900">{t("Váš Pipeline je zatiaľ prázdny")}</h3>
        <p data-testid="pipeline-view-p-4" className="text-xs sm:text-sm text-stone-500 max-w-md mx-auto mt-1.5 mb-4">
          {t("Vyhľadajte slovenské SMB firmy v záložke")} <strong>{t("Objavovanie trhu")}</strong> {t("alebo zadajte webstránku v")} <strong>{t("Okamžitom audite")}</strong> {t("a kliknite na tlačidlo")} <em>{t("\"Uložiť do Pipeline\"")}</em>.
        </p>
      </div>
    );
  }

  return (
    <div data-testid="pipeline-view-div-5" className="space-y-4 sm:space-y-6">
      {/* Controls & Export Bar */}
      <div data-testid="pipeline-view-div-6" className="bg-white rounded-2xl border border-stone-200 p-3.5 sm:p-5 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 sm:gap-4">
        <div data-testid="pipeline-view-div-7" className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 flex-1">
          <div data-testid="pipeline-view-div-8" className="relative w-full sm:w-64">
            <input data-testid="pipeline-view-input-9"
              type="text"
              placeholder={t("Filtrovať firmu, konateľa...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 h-11 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 touch-manipulation"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <select data-testid="pipeline-view-select-10"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-stone-50 border border-stone-300 rounded-xl px-3 h-11 text-base sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 touch-manipulation"
          >
            <option data-testid="pipeline-view-option-11" value="all">{t("Všetky stavy (")}{savedProspects.length})</option>
            <option data-testid="pipeline-view-option-12" value="new">{t("Nové")}</option>
            <option data-testid="pipeline-view-option-13" value="contacted">{t("Kontaktované")}</option>
            <option data-testid="pipeline-view-option-14" value="meeting">{t("Dohodnuté stretnutie")}</option>
            <option data-testid="pipeline-view-option-15" value="archived">{t("Archivované")}</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div data-testid="pipeline-view-div-16" className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 sm:pt-0">
          <button
            data-testid="export-csv-btn"
            onClick={exportToCSV}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors min-h-[40px] touch-manipulation"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span data-testid="pipeline-view-span-17" className="truncate">Excel / CSV</span>
          </button>

          <button
            data-testid="copy-crm-btn"
            onClick={copyForCRM}
            title={t("Skopíruje stĺpce pripravené na import do HubSpot / Pipedrive")}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors min-h-[40px] touch-manipulation"
          >
            {copiedCrm ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span data-testid="pipeline-view-span-18" className="text-emerald-700 truncate">{t("Skopírované")}</span>
              </>
            ) : (
              <>
                <Contact className="w-3.5 h-3.5 shrink-0" />
                <span data-testid="pipeline-view-span-19" className="truncate">{t("Kopírovať pre CRM")}</span>
              </>
            )}
          </button>

          <button
            data-testid="copy-md-btn"
            onClick={copyAllMarkdown}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors min-h-[40px] touch-manipulation"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span data-testid="pipeline-view-span-20" className="text-emerald-700 truncate">{t("Skopírované")}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 shrink-0" />
                <span data-testid="pipeline-view-span-21" className="truncate">{t("Kopírovať MD")}</span>
              </>
            )}
          </button>

          {onEmailMyLeads && (
            <button
              data-testid="email-me-btn"
              onClick={handleEmailMe}
              disabled={emailing}
              title={t("Pošle prehľad vášho Pipeline na e-mail vášho účtu")}
              className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white transition-colors min-h-[40px] touch-manipulation"
            >
              {emailing ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Send className="w-3.5 h-3.5 shrink-0" />}
              <span data-testid="pipeline-view-span-22" className="truncate">{t("Poslať mi e-mailom")}</span>
            </button>
          )}

          <button
            data-testid="clear-pipeline-btn"
            onClick={onClearAll}
            className="inline-flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold rounded-xl text-rose-600 bg-rose-50/50 hover:bg-rose-50 transition-colors min-h-[40px] touch-manipulation"
            title={t("Vyprázdniť pipeline")}
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span data-testid="pipeline-view-span-23" className="truncate">{t("Vymazať")}</span>
          </button>
        </div>
      </div>

      {copyFallback && <CopyFallback {...copyFallback} onClose={() => setCopyFallback(null)} />}

      {emailNotice && (
        <div
          data-testid="email-notice"
          className={`px-4 py-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2 ${
            emailNotice.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {emailNotice.ok ? <Check className="w-4 h-4 shrink-0 mt-0.5" /> : <Mail className="w-4 h-4 shrink-0 mt-0.5" />}
          <span data-testid="pipeline-view-span-24">{emailNotice.message}</span>
        </div>
      )}

      {/* List of Saved Prospects */}
      <div data-testid="pipeline-view-div-25" className="space-y-6">
        {filtered.map((prospect) => (
          <div data-testid={`pipeline-view-div-26-${prospect.id}`} key={prospect.id} className="relative">
            <div data-testid={`pipeline-view-div-27-${prospect.id}`} className="mb-2 flex flex-wrap gap-3 items-center justify-between px-1">
              <div data-testid={`pipeline-view-div-28-${prospect.id}`} className="flex items-center gap-2">
                <span data-testid={`pipeline-view-span-29-${prospect.id}`} className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  {t("Stav oslovenia:")} </span>
                <select data-testid={`pipeline-view-select-30-${prospect.id}`}
                  value={prospect.status === 'saved' ? 'new' : prospect.status}
                  onChange={(e) => onUpdateStatus(prospect.id, e.target.value as Prospect["status"])}
                  className={`text-xs font-semibold rounded-lg px-2.5 py-1 border transition-colors ${
                    prospect.status === "contacted"
                      ? "bg-purple-50 text-purple-700 border-purple-200"
                      : prospect.status === "meeting"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : prospect.status === "archived"
                      ? "bg-stone-100 text-stone-600 border-stone-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
                  }`}
                >
                  <option data-testid={`pipeline-view-option-31-${prospect.id}`} value="new">{t("Nový lead")}</option>
                  <option data-testid={`pipeline-view-option-32-${prospect.id}`} value="contacted">{t("Odoslaný cold pitch")}</option>
                  <option data-testid={`pipeline-view-option-33-${prospect.id}`} value="meeting">{t("Dohodnuté stretnutie / Demo")}</option>
                  <option data-testid={`pipeline-view-option-34-${prospect.id}`} value="archived">{t("Archivovaný")}</option>
                </select>
              </div>

              <button data-testid={`pipeline-view-button-35-${prospect.id}`}
                onClick={() => onRemoveFromPipeline(prospect.id)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span data-testid={`pipeline-view-span-36-${prospect.id}`}>{t("Odstrániť z Pipeline")}</span>
              </button>
            </div>

            <ProspectCard
              prospect={prospect}
              isSaved={true}
              onToggleSave={() => onRemoveFromPipeline(prospect.id)}
              onUpdateStatus={onUpdateStatus}
              onOpenRefineModal={onOpenRefineModal}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
