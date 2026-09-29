import { useLanguage } from '../context/LanguageContext';
import React, { useState } from "react";
import {
  History,
  RotateCcw,
  Trash2,
  MapPin,
  Globe,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Clock,
  Briefcase,
  Users
} from "lucide-react";
import { SearchHistoryItem } from "../types";

interface SearchHistoryProps {
  history: SearchHistoryItem[];
  onSelect: (item: SearchHistoryItem) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({
  history,
  onSelect,
  onRemove,
  onClear,
}) => {
  const { language: uiLanguage, t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);

  if (!history || history.length === 0) {
    return null;
  }

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 45) return t("Práve teraz");
    if (minutes < 60) return t("Pred {0} min", minutes);
    if (hours < 24) return t("Pred {0} hod", hours);
    if (days === 1) return t("Včera");
    return new Date(timestamp).toLocaleDateString(uiLanguage === 'en' ? 'en-GB' : 'sk-SK', {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div data-testid="search-history-container"
      id="search-history-container"
      className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-3.5 sm:p-5 transition-all mb-4 sm:mb-6"
    >
      {/* Header Bar */}
      <div data-testid="search-history-div-1" className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div data-testid="search-history-div-2" className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <div data-testid="search-history-div-3" className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <History className="w-4 h-4" />
          </div>
          <div data-testid="search-history-div-4" className="min-w-0">
            <div data-testid="search-history-div-5" className="flex items-center gap-1.5 sm:gap-2">
              <h3 data-testid="search-history-h3-6" className="text-xs sm:text-sm font-bold text-stone-900 truncate">
                {t("Nedávne dopyty")} </h3>
              <span data-testid="search-history-span-7" className="text-[10px] sm:text-[11px] font-semibold bg-stone-100 text-stone-600 px-1.5 sm:px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            </div>
            <p data-testid="search-history-p-8" className="text-[11px] text-stone-500 hidden sm:block">
              {t("Kliknutím na predchádzajúci dopyt ho okamžite znovu načítate a spustíte")} </p>
          </div>
        </div>

        <div data-testid="search-history-div-9" className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button data-testid="search-history-clear-10"
            type="button"
            onClick={onClear}
            className="text-[11px] font-semibold text-stone-400 hover:text-red-600 px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 touch-manipulation min-h-[36px]"
            title={t("Vymazať celú históriu z prehliadača")}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span data-testid="search-history-span-11" className="hidden sm:inline">{t("Vymazať históriu")}</span>
          </button>

          <button data-testid="search-history-button-12"
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors touch-manipulation min-h-[36px] min-w-[36px] flex items-center justify-center"
            title={isExpanded ? t("Zbaliť") : t("Rozbaliť")}
          >
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Items list */}
      {isExpanded && (
        <div data-testid="search-history-div-13" className="mt-3 flex flex-wrap gap-2 sm:gap-2.5">
          {history.map((item) => (
            <div data-testid={`search-history-div-14-${item.id}`}
              key={item.id}
              className="group relative flex items-center w-full sm:w-auto bg-stone-50 hover:bg-blue-50/70 border border-stone-200/80 hover:border-blue-300 rounded-xl p-2.5 pr-8 sm:pr-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.99] touch-manipulation"
              onClick={() => onSelect(item)}
              title={t("Kliknutím zopakujete tento dopyt")}
            >
              <div data-testid={`search-history-div-15-${item.id}`} className="flex items-start gap-2.5 min-w-0 flex-1">
                <div data-testid={`search-history-div-16-${item.id}`}
                  className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                    item.type === "company_audit"
                      ? "bg-indigo-100/70 text-indigo-700"
                      : "bg-blue-100/70 text-blue-700"
                  }`}
                >
                  {item.type === "company_audit" ? (
                    <Globe className="w-3.5 h-3.5" />
                  ) : (
                    <Search className="w-3.5 h-3.5" />
                  )}
                </div>

                <div data-testid={`search-history-div-17-${item.id}`} className="min-w-0 pr-1">
                  <div data-testid={`search-history-div-18-${item.id}`} className="flex items-center gap-1.5 flex-wrap">
                    <span data-testid={`search-history-span-19-${item.id}`} className="text-xs font-bold text-stone-800 group-hover:text-blue-900 transition-colors">
                      {item.type === 'market_discovery' && item.filters ? `${t(item.filters.region)} • ${t(item.filters.industry)}` : item.title}
                    </span>
                    {item.resultsCount !== undefined && item.resultsCount > 0 && (
                      <span data-testid={`search-history-span-20-${item.id}`} className="text-[10px] font-medium bg-white text-stone-500 border border-stone-200/70 px-1.5 py-0.2 rounded-md">
                        {item.resultsCount} {item.resultsCount === 1 ? t("firma") : item.resultsCount < 5 ? t("firmy") : t("firiem")}
                      </span>
                    )}
                  </div>

                  <div data-testid={`search-history-div-21-${item.id}`} className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                    <span data-testid={`search-history-span-22-${item.id}`} className="truncate max-w-[170px] sm:max-w-[240px]">
                      {item.filters ? `${item.filters.minEmployees}–${item.filters.maxEmployees} ${uiLanguage === 'en' ? 'employees' : 'zam.'}${item.filters.customKeywords ? ` • ${item.filters.customKeywords}` : ''}` : item.subtitle}
                    </span>
                    <span data-testid={`search-history-span-23-${item.id}`} className="text-stone-300">•</span>
                    <span data-testid={`search-history-span-24-${item.id}`} className="flex items-center gap-0.5 text-stone-400 font-mono text-[10px] shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remove single item button */}
              <button data-testid={`search-history-button-25-${item.id}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 sm:top-1.5 sm:translate-y-0 w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-700 hover:bg-stone-200/60 rounded-lg transition-colors opacity-80 group-hover:opacity-100 touch-manipulation"
                title={t("Odstrániť z histórie")}
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Repeat Indicator overlay on hover */}
              <div data-testid={`search-history-div-26-${item.id}`} className="hidden group-hover:flex absolute right-8 top-1/2 -translate-y-1/2 items-center gap-1 text-[10px] font-bold text-blue-600 bg-white/95 px-1.5 py-0.5 rounded shadow-2xs border border-blue-200">
                <RotateCcw className="w-2.5 h-2.5" />
                <span data-testid={`search-history-span-27-${item.id}`}>{t("Zopakovať")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
