import React from "react";
import { Search, Globe, BookmarkCheck, BookOpen, Building2, Key } from "lucide-react";
import { TabType } from "../types";

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  savedCount: number;
  onOpenApiKeyModal: () => void;
  hasCustomKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  savedCount,
  onOpenApiKeyModal,
  hasCustomKey,
}) => {
  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-sm ring-1 ring-blue-900/10">
              <Building2 className="w-5 h-5 text-blue-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-stone-900">
                  Slovak B2B Lead Generator & Web Audit
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 px-2 py-0.5 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                  SK SMB 3–50
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                Identifikácia digitálnych medzier, ORSR/FinStat dáta a personalizovaný cold outreach
              </p>
            </div>
          </div>

          {/* Nav Tabs & Settings */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            <nav className="flex items-center gap-1 sm:gap-2">
              <button
                id="tab-discover-btn"
                onClick={() => onTabChange("discover")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "discover"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Search className="w-4 h-4" />
                <span>Objavovanie trhu</span>
              </button>

              <button
                id="tab-audit-btn"
                onClick={() => onTabChange("audit")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "audit"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Audit firmy / webu</span>
              </button>

              <button
                id="tab-pipeline-btn"
                onClick={() => onTabChange("pipeline")}
                className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "pipeline"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
              >
                <BookmarkCheck className="w-4 h-4" />
                <span>Pipeline</span>
                {savedCount > 0 && (
                  <span className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === "pipeline" ? "bg-white text-blue-700" : "bg-blue-100 text-blue-800"
                  }`}>
                    {savedCount}
                  </span>
                )}
              </button>

              <button
                id="tab-guide-btn"
                onClick={() => onTabChange("guide")}
                className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
                  activeTab === "guide"
                    ? "bg-stone-800 text-white"
                    : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                }`}
                title="Príručka registrov a signálov"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden md:inline">Registre & Metodika</span>
              </button>
            </nav>

            <div className="h-6 w-px bg-stone-200 hidden sm:block"></div>

            {/* Custom API Key Settings Button */}
            <button
              id="open-api-key-modal-btn"
              onClick={onOpenApiKeyModal}
              className={`relative inline-flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold rounded-lg border transition-all ${
                hasCustomKey
                  ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                  : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:text-stone-900 shadow-2xs"
              }`}
              title="Nastavenia vlastného API kľúča (Gemini / Multi-Provider)"
            >
              <Key className={`w-3.5 h-3.5 ${hasCustomKey ? "text-emerald-600" : "text-stone-500"}`} />
              <span className="hidden lg:inline">
                {hasCustomKey ? "Vlastný kľúč aktívny" : "Nastaviť API kľúč"}
              </span>
              {hasCustomKey && (
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
