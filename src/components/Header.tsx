import React from "react";
import { Search, Globe, BookmarkCheck, BookOpen, Building2, Key } from "lucide-react";
import { TabType } from "../types";

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  savedCount: number;
  onOpenApiKeyModal: () => void;
  hasCustomKey: boolean;
  activeProviderName?: string;
  activeModelName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  savedCount,
  onOpenApiKeyModal,
  hasCustomKey,
  activeProviderName = "Google Gemini",
  activeModelName,
}) => {
  return (
    <>
      {/* Top Sticky Header */}
      <header className="border-b border-stone-200/90 bg-white/95 backdrop-blur-md sticky top-0 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-20">
            {/* Brand Info */}
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-700 to-indigo-900 flex items-center justify-center text-white shadow-xs ring-1 ring-blue-900/10 shrink-0">
                <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-100" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <h1 className="text-sm sm:text-lg lg:text-xl font-bold tracking-tight text-stone-900 truncate">
                    <span className="sm:hidden">Slovak B2B Leads</span>
                    <span className="hidden sm:inline">Slovak B2B Lead Generator & Web Audit</span>
                  </h1>
                  <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200/80 px-1.5 sm:px-2 py-0.5 rounded-md shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                    <span>3–50</span>
                  </span>
                </div>
                <p className="text-xs text-stone-500 hidden sm:block truncate">
                  Identifikácia digitálnych medzier, ORSR/FinStat dáta a personalizovaný cold outreach
                </p>
              </div>
            </div>

            {/* Desktop Navigation & Controls */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              {/* Desktop Nav Tabs */}
              <nav className="hidden md:flex items-center gap-1 sm:gap-2">
                <button
                  id="tab-discover-btn"
                  onClick={() => onTabChange("discover")}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
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
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
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
                  className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
                    activeTab === "pipeline"
                      ? "bg-blue-600 text-white shadow-xs"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4" />
                  <span>Pipeline</span>
                  {savedCount > 0 && (
                    <span
                      className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                        activeTab === "pipeline"
                          ? "bg-white text-blue-700"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {savedCount}
                    </span>
                  )}
                </button>

                <button
                  id="tab-guide-btn"
                  onClick={() => onTabChange("guide")}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors min-h-[40px] ${
                    activeTab === "guide"
                      ? "bg-stone-800 text-white"
                      : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
                  }`}
                  title="Príručka registrov a signálov"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Metodika & Registre</span>
                </button>
              </nav>

              <div className="h-6 w-px bg-stone-200 hidden md:block"></div>

              {/* Custom API Key & Provider Settings Button */}
              <button
                id="open-api-key-modal-btn"
                onClick={onOpenApiKeyModal}
                className={`relative inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-semibold rounded-xl border transition-all min-h-[40px] sm:min-h-[42px] touch-manipulation ${
                  hasCustomKey
                    ? "bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100"
                    : "bg-white text-stone-700 border-stone-200 hover:bg-stone-50 hover:text-stone-900 shadow-2xs"
                }`}
                title={`AI Provider: ${activeProviderName} (Kliknite pre zmenu providera alebo API kľúčov)`}
              >
                <Key className={`w-4 h-4 shrink-0 ${hasCustomKey ? "text-emerald-600" : "text-stone-500"}`} />
                <div className="text-left leading-tight">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-stone-900">
                      {activeProviderName}
                    </span>
                    {hasCustomKey && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-500 hidden sm:block">
                    {hasCustomKey ? "Vlastný kľúč aktívny" : "Zmeniť providera / kľúč"}
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (< md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200/90 shadow-lg px-1.5 py-1 flex items-center justify-around">
        <button
          onClick={() => onTabChange("discover")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] touch-manipulation ${
            activeTab === "discover"
              ? "text-blue-700 font-bold bg-blue-50/70"
              : "text-stone-500 hover:text-stone-800 font-medium"
          }`}
        >
          <Search className={`w-5 h-5 mb-0.5 ${activeTab === "discover" ? "text-blue-700 stroke-[2.3]" : "text-stone-400"}`} />
          <span className="text-[10px] leading-tight">Objavovanie</span>
        </button>

        <button
          onClick={() => onTabChange("audit")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] touch-manipulation ${
            activeTab === "audit"
              ? "text-blue-700 font-bold bg-blue-50/70"
              : "text-stone-500 hover:text-stone-800 font-medium"
          }`}
        >
          <Globe className={`w-5 h-5 mb-0.5 ${activeTab === "audit" ? "text-blue-700 stroke-[2.3]" : "text-stone-400"}`} />
          <span className="text-[10px] leading-tight">Audit webu</span>
        </button>

        <button
          onClick={() => onTabChange("pipeline")}
          className={`flex-1 relative flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] touch-manipulation ${
            activeTab === "pipeline"
              ? "text-blue-700 font-bold bg-blue-50/70"
              : "text-stone-500 hover:text-stone-800 font-medium"
          }`}
        >
          <div className="relative">
            <BookmarkCheck className={`w-5 h-5 mb-0.5 ${activeTab === "pipeline" ? "text-blue-700 stroke-[2.3]" : "text-stone-400"}`} />
            {savedCount > 0 && (
              <span className="absolute -top-1 -right-2 text-[9px] font-extrabold bg-blue-600 text-white w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {savedCount > 9 ? "9+" : savedCount}
              </span>
            )}
          </div>
          <span className="text-[10px] leading-tight">Pipeline</span>
        </button>

        <button
          onClick={() => onTabChange("guide")}
          className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all min-h-[48px] touch-manipulation ${
            activeTab === "guide"
              ? "text-stone-900 font-bold bg-stone-100"
              : "text-stone-500 hover:text-stone-800 font-medium"
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-0.5 ${activeTab === "guide" ? "text-stone-900 stroke-[2.3]" : "text-stone-400"}`} />
          <span className="text-[10px] leading-tight">Metodika</span>
        </button>
      </div>
    </>
  );
};
