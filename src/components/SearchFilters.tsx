import React from "react";
import { Search, MapPin, Briefcase, Users, SlidersHorizontal, Sparkles, Filter } from "lucide-react";
import { SLOVAK_REGIONS, SLOVAK_INDUSTRIES } from "../data/slovakData";
import { SearchFilterState } from "../types";

interface SearchFiltersProps {
  filters: SearchFilterState;
  onChange: (filters: SearchFilterState) => void;
  onSearch: () => void;
  isLoading: boolean;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  onSearch,
  isLoading,
}) => {
  const handleInputChange = (field: keyof SearchFilterState, value: any) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  const selectedIndustryObj = SLOVAK_INDUSTRIES.find(
    (ind) => ind.name.toLowerCase().includes(filters.industry.toLowerCase().slice(0, 8))
  );

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 sm:p-7 transition-all">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 sm:pb-5 border-b border-stone-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-700 shrink-0">
              <SlidersHorizontal className="w-4 h-4" />
            </span>
            <h2 className="text-sm sm:text-base font-semibold text-stone-900 leading-tight">
              Nastavenie vyhľadávania a auditu slovenských SMB
            </h2>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Cielené vyhľadávanie malých a stredných podnikov (3–50 zamestnancov) s analýzou digitálnych bariér.
          </p>
        </div>

        {/* Quick Constraint Badge */}
        <div className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-xs font-medium text-amber-900">
          <Users className="w-3.5 h-3.5 text-amber-600" />
          <span>Filter: Striktne SMB (3–50 osôb)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mt-4 sm:mt-5">
        {/* Region Selector */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Slovenský región / Kraj
          </label>
          <select
            id="search-region-select"
            value={filters.region}
            onChange={(e) => handleInputChange("region", e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 h-11 sm:h-10 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all touch-manipulation"
          >
            {SLOVAK_REGIONS.map((reg) => (
              <option key={reg} value={reg}>
                {reg}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Cieli na lokálnych podnikateľov a priemyselné zóny
          </span>
        </div>

        {/* Industry Sector */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-blue-600" />
            Odvetvie / Sektor
          </label>
          <select
            id="search-industry-select"
            value={filters.industry}
            onChange={(e) => handleInputChange("industry", e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 h-11 sm:h-10 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 transition-all touch-manipulation"
          >
            {SLOVAK_INDUSTRIES.map((ind) => (
              <option key={ind.id} value={ind.name}>
                {ind.name}
              </option>
            ))}
          </select>
          <span className="text-[11px] text-stone-400 mt-1 block truncate">
            {selectedIndustryObj?.description || "Vybrané B2B zameranie"}
          </span>
        </div>

        {/* Employee Range */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5 sm:mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              Veľkosť firmy
            </span>
            <span className="text-blue-700 font-bold font-mono text-xs">
              {filters.minEmployees} – {filters.maxEmployees} osôb
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-stone-500 block mb-1">Minimum</span>
              <input
                id="search-min-employees"
                type="number"
                min={3}
                max={30}
                value={filters.minEmployees}
                onChange={(e) => handleInputChange("minEmployees", Math.max(3, parseInt(e.target.value) || 3))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 h-11 sm:h-10 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 touch-manipulation"
              />
            </div>
            <div>
              <span className="text-[11px] text-stone-500 block mb-1">Maximum</span>
              <input
                id="search-max-employees"
                type="number"
                min={10}
                max={50}
                value={filters.maxEmployees}
                onChange={(e) => handleInputChange("maxEmployees", Math.min(50, parseInt(e.target.value) || 50))}
                className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 h-11 sm:h-10 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 touch-manipulation"
              />
            </div>
          </div>
          <span className="text-[11px] text-stone-400 mt-1 block">
            Striktne vylučuje korporácie a holdingy
          </span>
        </div>
      </div>

      {/* Secondary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-stone-100">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Špecifické kľúčové slová alebo zameranie (voliteľné)
          </label>
          <input
            id="search-keywords-input"
            type="text"
            placeholder="napr. CNC frézovanie, priemyselné haly, servis chladiarenských áut, fotovoltika..."
            value={filters.customKeywords}
            onChange={(e) => handleInputChange("customKeywords", e.target.value)}
            className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3.5 py-2.5 h-11 sm:h-10 text-base sm:text-sm text-stone-900 placeholder:text-stone-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 touch-manipulation"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Počet firiem
            </label>
            <select
              id="search-count-select"
              value={filters.count}
              onChange={(e) => handleInputChange("count", parseInt(e.target.value) || 3)}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 h-11 sm:h-10 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 touch-manipulation"
            >
              <option value={3}>3 prospekty</option>
              <option value={5}>5 prospektov</option>
              <option value={8}>8 prospektov</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Jazyk e-mailu
            </label>
            <select
              id="search-language-select"
              value={filters.language}
              onChange={(e) => handleInputChange("language", e.target.value as "sk" | "en")}
              className="w-full bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 h-11 sm:h-10 text-base sm:text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600 touch-manipulation"
            >
              <option value="sk">Slovenčina (SK)</option>
              <option value="en">English (EN)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-stone-100">
        <div className="text-xs text-stone-500 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span>
            Kontroluje webstránku, Google Business, ORSR.sk a FinStat pre overenie vedenia a digitálnych bariér.
          </span>
        </div>

        <button
          id="run-search-btn"
          disabled={isLoading}
          onClick={onSearch}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-semibold text-sm px-6 py-3 min-h-[48px] rounded-xl shadow-xs transition-all active:scale-[0.98] touch-manipulation"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Skenujem slovenský trh a registre...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>Vyhľadať a auditovať firmy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
