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
} from "lucide-react";
import { Prospect } from "../types";
import { ProspectCard } from "./ProspectCard";

interface PipelineViewProps {
  savedProspects: Prospect[];
  onRemoveFromPipeline: (id: string) => void;
  onUpdateStatus: (id: string, status: Prospect["status"]) => void;
  onOpenRefineModal: (prospect: Prospect) => void;
  onClearAll: () => void;
}

export const PipelineView: React.FC<PipelineViewProps> = ({
  savedProspects,
  onRemoveFromPipeline,
  onUpdateStatus,
  onOpenRefineModal,
  onClearAll,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [copiedAll, setCopiedAll] = useState(false);

  const filtered = savedProspects.filter((item) => {
    const matchesSearch =
      item.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.region.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.targetDecisionMaker.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || item.status === statusFilter;
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

    await navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  if (savedProspects.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-6 h-6" />
        </div>
        <h3 className="text-base font-bold text-stone-900">Váš Pipeline je zatiaľ prázdny</h3>
        <p className="text-sm text-stone-500 max-w-md mx-auto mt-1.5 mb-6">
          Vyhľadajte slovenské SMB firmy v záložke <strong>Objavovanie trhu</strong> alebo zadajte webstránku v <strong>Okamžitom audite</strong> a kliknite na tlačidlo <em>"Uložiť do Pipeline"</em>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls & Export Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Filtrovať firmu, konateľa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-xs sm:text-sm text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
          >
            <option value="all">Všetky stavy ({savedProspects.length})</option>
            <option value="new">Nové</option>
            <option value="contacted">Kontaktované</option>
            <option value="meeting">Dohodnuté stretnutie</option>
            <option value="archived">Archivované</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={copyAllMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Skopírované do schránky</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Kopírovať všetko (Markdown)</span>
              </>
            )}
          </button>

          <button
            onClick={onClearAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
            title="Vyprázdniť pipeline"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vymazať</span>
          </button>
        </div>
      </div>

      {/* List of Saved Prospects */}
      <div className="space-y-6">
        {filtered.map((prospect) => (
          <div key={prospect.id} className="relative">
            <div className="mb-2 flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                  Stav oslovenia:
                </span>
                <select
                  value={prospect.status}
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
                  <option value="new">Nový lead</option>
                  <option value="contacted">Odoslaný cold pitch</option>
                  <option value="meeting">Dohodnuté stretnutie / Demo</option>
                  <option value="archived">Archivovaný</option>
                </select>
              </div>

              <button
                onClick={() => onRemoveFromPipeline(prospect.id)}
                className="text-xs text-rose-600 hover:text-rose-700 hover:underline inline-flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>Odstrániť z Pipeline</span>
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
