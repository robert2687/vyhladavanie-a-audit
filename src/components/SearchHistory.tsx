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

    if (seconds < 45) return "Práve teraz";
    if (minutes < 60) return `Pred ${minutes} min`;
    if (hours < 24) return `Pred ${hours} hod`;
    if (days === 1) return "Včera";
    return new Date(timestamp).toLocaleDateString("sk-SK", {
      day: "numeric",
      month: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      id="search-history-container"
      className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs p-4 sm:p-5 transition-all mb-6"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-stone-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                Nedávne vyhľadávania a dopyty
              </h3>
              <span className="text-[11px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            </div>
            <p className="text-[11px] text-stone-500 hidden sm:block">
              Kliknutím na predchádzajúci dopyt ho okamžite znovu načítate a spustíte
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onClear}
            className="text-[11px] font-semibold text-stone-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1"
            title="Vymazať celú históriu z prehliadača"
          >
            <Trash2 className="w-3 h-3" />
            <span className="hidden sm:inline">Vymazať históriu</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
            title={isExpanded ? "Zbaliť" : "Rozbaliť"}
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
        <div className="mt-3.5 flex flex-wrap gap-2.5">
          {history.map((item) => (
            <div
              key={item.id}
              className="group relative flex items-center bg-stone-50 hover:bg-blue-50/70 border border-stone-200/80 hover:border-blue-300 rounded-xl p-2.5 pr-2 transition-all cursor-pointer shadow-2xs hover:shadow-xs"
              onClick={() => onSelect(item)}
              title="Kliknutím zopakujete tento dopyt"
            >
              <div className="flex items-start gap-2.5">
                <div
                  className={`mt-0.5 p-1 rounded-lg shrink-0 ${
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

                <div className="pr-5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold text-stone-800 group-hover:text-blue-900 transition-colors">
                      {item.title}
                    </span>
                    {item.resultsCount !== undefined && item.resultsCount > 0 && (
                      <span className="text-[10px] font-medium bg-white text-stone-500 border border-stone-200/70 px-1.5 py-0.2 rounded-md">
                        {item.resultsCount} {item.resultsCount === 1 ? "firma" : item.resultsCount < 5 ? "firmy" : "firiem"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-stone-500">
                    <span className="truncate max-w-[200px] sm:max-w-[260px]">
                      {item.subtitle}
                    </span>
                    <span className="text-stone-300">•</span>
                    <span className="flex items-center gap-0.5 text-stone-400 font-mono text-[10px] shrink-0">
                      <Clock className="w-2.5 h-2.5" />
                      {formatTimeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Remove single item button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(item.id);
                }}
                className="absolute right-1.5 top-1.5 p-1 text-stone-300 hover:text-stone-600 hover:bg-stone-200/60 rounded-md transition-colors opacity-70 group-hover:opacity-100"
                title="Odstrániť z histórie"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Repeat Indicator overlay on hover */}
              <div className="hidden group-hover:flex absolute right-7 top-1/2 -translate-y-1/2 items-center gap-1 text-[10px] font-bold text-blue-600 bg-white/95 px-1.5 py-0.5 rounded shadow-2xs border border-blue-200">
                <RotateCcw className="w-2.5 h-2.5" />
                <span>Zopakovať</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
