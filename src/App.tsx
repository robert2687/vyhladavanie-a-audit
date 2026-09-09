import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { SearchFilters } from "./components/SearchFilters";
import { InstantAudit } from "./components/InstantAudit";
import { ProspectCard } from "./components/ProspectCard";
import { PipelineView } from "./components/PipelineView";
import { RegistersGuideModal } from "./components/RegistersGuideModal";
import { RefinePitchModal } from "./components/RefinePitchModal";
import { ApiKeyModal } from "./components/ApiKeyModal";
import { SearchHistory } from "./components/SearchHistory";
import { Prospect, SearchFilterState, SearchHistoryItem, TabType, AIProviderId } from "./types";
import { SLOVAK_INDUSTRIES, SLOVAK_REGIONS } from "./data/slovakData";
import { AI_PROVIDERS, DEFAULT_AI_PROVIDER } from "./data/aiProviders";
import {
  Sparkles,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Filter,
  RefreshCw,
  Search,
  Globe,
  SlidersHorizontal,
} from "lucide-react";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("discover");

  // Search Filter State
  const [filters, setFilters] = useState<SearchFilterState>({
    region: SLOVAK_REGIONS[0],
    industry: SLOVAK_INDUSTRIES[0].name,
    minEmployees: 3,
    maxEmployees: 50,
    count: 3,
    customKeywords: "",
    language: "sk",
  });

  // Discovered Prospects
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  // Saved Pipeline Prospects
  const [savedProspects, setSavedProspects] = useState<Prospect[]>(() => {
    try {
      const saved = localStorage.getItem("slovak_b2b_saved_leads");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modal State for Refining Outreach Pitch
  const [refiningProspect, setRefiningProspect] = useState<Prospect | null>(null);
  const [isRefineModalOpen, setIsRefineModalOpen] = useState(false);

  // Search History State
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>(() => {
    try {
      const raw = localStorage.getItem("slovak_b2b_search_history");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Save search history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("slovak_b2b_search_history", JSON.stringify(searchHistory));
    } catch (e) {
      console.error("Failed to save search history to localStorage", e);
    }
  }, [searchHistory]);

  const addSearchHistory = (newItem: Omit<SearchHistoryItem, "id" | "timestamp">) => {
    const item: SearchHistoryItem = {
      ...newItem,
      id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };
    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (p) => !(p.title === item.title && p.type === item.type)
      );
      return [item, ...filtered].slice(0, 15);
    });
  };

  const handleRemoveHistoryItem = (id: string) => {
    setSearchHistory((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearHistory = () => {
    setSearchHistory([]);
    try {
      localStorage.removeItem("slovak_b2b_search_history");
    } catch {
      // Ignore
    }
  };

  // AI Provider & Key State
  const [activeProvider, setActiveProvider] = useState<AIProviderId>(() => {
    try {
      return (
        (localStorage.getItem("slovak_leadgen_active_provider") as AIProviderId) ||
        DEFAULT_AI_PROVIDER
      );
    } catch {
      return DEFAULT_AI_PROVIDER;
    }
  });

  const [providerKeys, setProviderKeys] = useState<Record<AIProviderId, string>>(() => {
    try {
      const saved = localStorage.getItem("slovak_leadgen_provider_keys");
      const parsed = saved ? JSON.parse(saved) : {};
      const legacyGemini = localStorage.getItem("slovak_leadgen_gemini_key");
      if (legacyGemini && !parsed.gemini) {
        parsed.gemini = legacyGemini;
      }
      return {
        gemini: "",
        anthropic: "",
        perplexity: "",
        nemotron: "",
        deepseek: "",
        openai: "",
        grok: "",
        ...parsed,
      };
    } catch {
      return {
        gemini: "",
        anthropic: "",
        perplexity: "",
        nemotron: "",
        deepseek: "",
        openai: "",
        grok: "",
      };
    }
  });

  const [providerModels, setProviderModels] = useState<Record<AIProviderId, string>>(() => {
    try {
      const saved = localStorage.getItem("slovak_leadgen_provider_models");
      const parsed = saved ? JSON.parse(saved) : {};
      const defaults: Record<AIProviderId, string> = {
        gemini: "gemini-3.8-flash",
        anthropic: "claude-3-5-sonnet-20241022",
        perplexity: "sonar",
        nemotron: "nvidia/llama-3.1-nemotron-70b-instruct",
        deepseek: "deepseek-chat",
        openai: "gpt-4o",
        grok: "grok-2-latest",
      };
      AI_PROVIDERS.forEach((p) => {
        if (!defaults[p.id]) defaults[p.id] = p.defaultModel;
      });
      return { ...defaults, ...parsed };
    } catch {
      return {
        gemini: "gemini-3.8-flash",
        anthropic: "claude-3-5-sonnet-20241022",
        perplexity: "sonar",
        nemotron: "nvidia/llama-3.1-nemotron-70b-instruct",
        deepseek: "deepseek-chat",
        openai: "gpt-4o",
        grok: "grok-2-latest",
      };
    }
  });

  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);

  const currentProviderConfig =
    AI_PROVIDERS.find((p) => p.id === activeProvider) || AI_PROVIDERS[0];
  const activeApiKey = providerKeys[activeProvider] || "";
  const activeModel = providerModels[activeProvider] || currentProviderConfig.defaultModel;

  const handleSelectActiveProvider = (provider: AIProviderId) => {
    setActiveProvider(provider);
    try {
      localStorage.setItem("slovak_leadgen_active_provider", provider);
    } catch (e) {
      console.error("Failed to save active provider to localStorage", e);
    }
  };

  const handleSaveProviderKey = (provider: AIProviderId, key: string) => {
    setProviderKeys((prev) => {
      const updated = { ...prev, [provider]: key };
      try {
        localStorage.setItem("slovak_leadgen_provider_keys", JSON.stringify(updated));
        if (provider === "gemini") {
          localStorage.setItem("slovak_leadgen_gemini_key", key);
        }
      } catch (e) {
        console.error("Failed to save provider keys to localStorage", e);
      }
      return updated;
    });
  };

  const handleSelectProviderModel = (provider: AIProviderId, model: string) => {
    setProviderModels((prev) => {
      const updated = { ...prev, [provider]: model };
      try {
        localStorage.setItem("slovak_leadgen_provider_models", JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save provider models to localStorage", e);
      }
      return updated;
    });
  };

  // Save to localStorage when savedProspects changes
  useEffect(() => {
    try {
      localStorage.setItem("slovak_b2b_saved_leads", JSON.stringify(savedProspects));
    } catch (e) {
      console.error("Failed to save to localStorage", e);
    }
  }, [savedProspects]);

  // Initial load: Fetch default sample search on mount if empty
  useEffect(() => {
    const loadInitialLeads = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/leads/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-ai-provider": activeProvider,
            "x-ai-model": activeModel,
            ...(activeApiKey ? { [`x-${activeProvider}-api-key`]: activeApiKey, "x-custom-api-key": activeApiKey } : {}),
          },
          body: JSON.stringify({
            provider: activeProvider,
            apiKey: activeApiKey || undefined,
            model: activeModel,
            region: filters.region,
            industry: filters.industry,
            minEmployees: filters.minEmployees,
            maxEmployees: filters.maxEmployees,
            count: 3,
            language: "sk",
          }),
        });

        const data = await response.json();
        if (data.success && Array.isArray(data.prospects)) {
          setProspects(data.prospects);
          if (data.isMock) {
            setStatusNotice(
              activeApiKey
                ? "Dáta sú pripravené z overenej databázy slovenských SMB subjektov."
                : `Dáta sú pripravené z overenej databázy slovenských SMB subjektov. Pre živé volanie cez ${currentProviderConfig.name} kliknite vpravo hore na tlačidlo providera.`
            );
          }
        }
      } catch (err: any) {
        console.warn("Notice loading initial leads:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialLeads();
  }, [activeProvider, activeApiKey, activeModel]);

  // Execute Search (supports passing specific filters or using state)
  const executeSearch = async (overrideFilters?: SearchFilterState) => {
    const activeFilters = overrideFilters || filters;
    setIsLoading(true);
    setErrorMessage(null);
    setStatusNotice(null);

    try {
      const response = await fetch("/api/leads/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-provider": activeProvider,
          "x-ai-model": activeModel,
          ...(activeApiKey ? { [`x-${activeProvider}-api-key`]: activeApiKey, "x-custom-api-key": activeApiKey } : {}),
        },
        body: JSON.stringify({
          provider: activeProvider,
          apiKey: activeApiKey || undefined,
          model: activeModel,
          region: activeFilters.region,
          industry: activeFilters.industry,
          minEmployees: activeFilters.minEmployees,
          maxEmployees: activeFilters.maxEmployees,
          count: activeFilters.count,
          customKeywords: activeFilters.customKeywords,
          language: activeFilters.language,
        }),
      });

      const data = await response.json();
      if (data.success && Array.isArray(data.prospects)) {
        setProspects(data.prospects);

        // Record into persistent Search History
        addSearchHistory({
          type: "market_discovery",
          title: `${activeFilters.region} • ${activeFilters.industry}`,
          subtitle: `${activeFilters.minEmployees}–${activeFilters.maxEmployees} zam.${
            activeFilters.customKeywords ? ` • ${activeFilters.customKeywords}` : ""
          }`,
          filters: { ...activeFilters },
          resultsCount: data.prospects.length,
        });

        if (data.isMock) {
          setStatusNotice(
            activeApiKey
              ? "Vyhľadávanie prebehlo s overenými slovenskými SMB profilmi."
              : `Vyhľadávanie prebehlo s overenými slovenskými SMB profilmi. Pre živé vyhľadávanie cez ${currentProviderConfig.name} môžete nastaviť kľúč v hornej lište.`
          );
        }
      } else {
        throw new Error(data.error || "Nepodarilo sa načítať prospekty");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Chyba pri vyhľadávaní firiem");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    executeSearch();
  };

  // Handle Instant Single Company Audit
  const handleInstantAudit = async (
    urlOrName: string,
    industry: string,
    language: "sk" | "en"
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    setStatusNotice(null);

    try {
      const response = await fetch("/api/audit/company", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-provider": activeProvider,
          "x-ai-model": activeModel,
          ...(activeApiKey ? { [`x-${activeProvider}-api-key`]: activeApiKey, "x-custom-api-key": activeApiKey } : {}),
        },
        body: JSON.stringify({
          provider: activeProvider,
          apiKey: activeApiKey || undefined,
          model: activeModel,
          urlOrName,
          industry,
          language,
        }),
      });

      const data = await response.json();
      if (data.success && data.prospect) {
        // Prepend audit result to the top of prospects list and switch to discover/results view
        setProspects((prev) => [data.prospect, ...prev.filter((p) => p.id !== data.prospect.id)]);
        setActiveTab("discover");
        setStatusNotice(`Hĺbkový audit pre ${data.prospect.companyName} bol úspešne dokončený.`);

        // Record into Search History
        addSearchHistory({
          type: "company_audit",
          title: `Audit: ${data.prospect.companyName || urlOrName}`,
          subtitle: `${industry} • ${data.prospect.website || urlOrName}`,
          auditTarget: {
            urlOrName,
            industry,
            language,
          },
          resultsCount: 1,
        });
      } else {
        throw new Error(data.error || "Audit sa nepodarilo vykonať");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Chyba pri audite firmy");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle click on recent search history item
  const handleSelectHistoryItem = (item: SearchHistoryItem) => {
    if (item.type === "market_discovery" && item.filters) {
      setFilters(item.filters);
      setActiveTab("discover");
      executeSearch(item.filters);
    } else if (item.type === "company_audit" && item.auditTarget) {
      setActiveTab("audit");
      handleInstantAudit(
        item.auditTarget.urlOrName,
        item.auditTarget.industry,
        item.auditTarget.language
      );
    }
  };

  // Toggle Save / Unsave to Pipeline
  const handleToggleSave = (prospect: Prospect) => {
    setSavedProspects((prev) => {
      const exists = prev.some((p) => p.id === prospect.id);
      if (exists) {
        return prev.filter((p) => p.id !== prospect.id);
      } else {
        return [{ ...prospect, status: "saved" }, ...prev];
      }
    });
  };

  // Update Status in Pipeline
  const handleUpdateStatus = (id: string, newStatus: Prospect["status"]) => {
    setSavedProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
    setProspects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
    );
  };

  // Open Pitch Refinement Modal
  const handleOpenRefineModal = (prospect: Prospect) => {
    setRefiningProspect(prospect);
    setIsRefineModalOpen(true);
  };

  // Save Updated Pitch from Modal
  const handleSaveUpdatedPitch = (prospectId: string, subject: string, body: string) => {
    setProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, coldOutreach: { ...p.coldOutreach, subject, body } }
          : p
      )
    );
    setSavedProspects((prev) =>
      prev.map((p) =>
        p.id === prospectId
          ? { ...p, coldOutreach: { ...p.coldOutreach, subject, body } }
          : p
      )
    );
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setErrorMessage(null);
        }}
        savedCount={savedProspects.length}
        onOpenApiKeyModal={() => setIsApiKeyModalOpen(true)}
        hasCustomKey={Boolean(activeApiKey && activeApiKey.trim().length > 5)}
        activeProviderName={currentProviderConfig.name}
        activeModelName={activeModel}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 pb-24 md:pb-8">
        {/* Status Notice Banner (Dismissible or informative) */}
        {statusNotice && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-xs sm:text-sm flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{statusNotice}</div>
            <button
              onClick={() => setStatusNotice(null)}
              className="text-blue-600 hover:text-blue-800 font-bold ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs sm:text-sm flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-600 hover:text-rose-800 font-bold ml-2 text-xs"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab 1: Market Discovery */}
        {activeTab === "discover" && (
          <div className="space-y-8">
            {/* Recent Search History */}
            <SearchHistory
              history={searchHistory}
              onSelect={handleSelectHistoryItem}
              onRemove={handleRemoveHistoryItem}
              onClear={handleClearHistory}
            />

            {/* Search Filters Section */}
            <SearchFilters
              filters={filters}
              onChange={setFilters}
              onSearch={handleSearch}
              isLoading={isLoading}
            />

            {/* Results Section */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-stone-200">
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    Nájdené B2B prospekty & audity webov ({prospects.length})
                  </h3>
                  <p className="text-xs text-stone-500">
                    Výsledky spĺňajúce kritérium SMB (3–50 zamestnancov) s auditom digitálnych bariér a draftom cold emailu.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs text-stone-600 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span>Výstupná schéma je pripravená na okamžité kopírovanie</span>
                </div>
              </div>

              {/* List of Prospects */}
              {isLoading && prospects.length === 0 ? (
                <div className="p-12 text-center bg-white rounded-2xl border border-stone-200">
                  <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-sm font-semibold text-stone-800">
                    Skenujem slovenský trh, registre ORSR & FinStat a webové stránky...
                  </p>
                  <p className="text-xs text-stone-500 mt-1">
                    Analyzujem formuláre, cenníky v PDF, rýchlosť a dohľadávam konateľov firiem.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {prospects.map((prospect) => (
                    <ProspectCard
                      key={prospect.id}
                      prospect={prospect}
                      isSaved={savedProspects.some((p) => p.id === prospect.id)}
                      onToggleSave={handleToggleSave}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenRefineModal={handleOpenRefineModal}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Instant Single Web/Company Audit */}
        {activeTab === "audit" && (
          <div className="space-y-8">
            {/* Recent Search & Audit History */}
            <SearchHistory
              history={searchHistory}
              onSelect={handleSelectHistoryItem}
              onRemove={handleRemoveHistoryItem}
              onClear={handleClearHistory}
            />

            <InstantAudit onAudit={handleInstantAudit} isLoading={isLoading} />

            {/* Display Most Recent Audits if any */}
            {prospects.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-bold text-stone-900">
                  Nedávno auditované slovenské firmy
                </h3>
                <div className="space-y-6">
                  {prospects.slice(0, 2).map((prospect) => (
                    <ProspectCard
                      key={prospect.id}
                      prospect={prospect}
                      isSaved={savedProspects.some((p) => p.id === prospect.id)}
                      onToggleSave={handleToggleSave}
                      onUpdateStatus={handleUpdateStatus}
                      onOpenRefineModal={handleOpenRefineModal}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Saved Pipeline */}
        {activeTab === "pipeline" && (
          <PipelineView
            savedProspects={savedProspects}
            onRemoveFromPipeline={(id) => {
              setSavedProspects((prev) => prev.filter((p) => p.id !== id));
            }}
            onUpdateStatus={handleUpdateStatus}
            onOpenRefineModal={handleOpenRefineModal}
            onClearAll={() => {
              if (window.confirm("Naozaj chcete vymazať všetky uložené prospekty z Pipeline?")) {
                setSavedProspects([]);
              }
            }}
          />
        )}

        {/* Tab 4: Registers & Methodology Guide */}
        {activeTab === "guide" && <RegistersGuideModal />}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-stone-200/90 bg-white py-6 mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            <span className="font-semibold text-stone-800">Slovak B2B Lead Generator & Web Audit</span>
            <span>– špecializované pre slovenské malé a stredné podniky (3–50 zamestnancov)</span>
          </div>
          <div className="flex items-center gap-4 text-stone-500">
            <span>Zdroje: ORSR.sk • FinStat.sk • Overit.sk • Web Inspection</span>
          </div>
        </div>
      </footer>

      {/* Modal for Pitch Customization */}
      <RefinePitchModal
        prospect={refiningProspect}
        isOpen={isRefineModalOpen}
        onClose={() => {
          setIsRefineModalOpen(false);
          setRefiningProspect(null);
        }}
        onSaveUpdatedPitch={handleSaveUpdatedPitch}
        activeProvider={activeProvider}
        activeApiKey={activeApiKey}
        activeModel={activeModel}
      />

      {/* Modal for Custom API Key Settings */}
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        activeProvider={activeProvider}
        onSelectActiveProvider={handleSelectActiveProvider}
        providerKeys={providerKeys}
        onSaveProviderKey={handleSaveProviderKey}
        providerModels={providerModels}
        onSelectProviderModel={handleSelectProviderModel}
      />
    </div>
  );
}
