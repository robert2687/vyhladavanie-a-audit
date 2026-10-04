import { useLanguage } from '../context/LanguageContext';
import React, { useState, useEffect } from "react";
import {
  Key,
  X,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Trash2,
  Sparkles,
  Check,
  Globe,
  Cpu,
  Zap,
} from "lucide-react";
import { AIProviderId, AIProviderConfig } from "../types";
import { AI_PROVIDERS } from "../data/aiProviders";
import { safeFetchJson } from "../utils/api";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProvider: AIProviderId;
  onSelectActiveProvider: (provider: AIProviderId) => void;
  providerKeys: Record<AIProviderId, string>;
  onSaveProviderKey: (provider: AIProviderId, key: string) => void;
  providerModels: Record<AIProviderId, string>;
  onSelectProviderModel: (provider: AIProviderId, model: string) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  activeProvider,
  onSelectActiveProvider,
  providerKeys,
  onSaveProviderKey,
  providerModels,
  onSelectProviderModel,
}) => {
  const { language: uiLanguage, t } = useLanguage();
  const [selectedTabProvider, setSelectedTabProvider] = useState<AIProviderId>(activeProvider);
  const [localKeys, setLocalKeys] = useState<Record<AIProviderId, string>>(providerKeys);
  const [localModels, setLocalModels] = useState<Record<AIProviderId, string>>(providerModels);
  const [showKey, setShowKey] = useState<Record<AIProviderId, boolean>>({
    gemini: false,
    anthropic: false,
    perplexity: false,
    nemotron: false,
    deepseek: false,
    openai: false,
    grok: false,
  });

  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<
    Record<AIProviderId, { success: boolean; message: string } | null>
  >({
    gemini: null,
    anthropic: null,
    perplexity: null,
    nemotron: null,
    deepseek: null,
    openai: null,
    grok: null,
  });

  useEffect(() => {
    setSelectedTabProvider(activeProvider);
  }, [activeProvider]);

  useEffect(() => {
    setLocalKeys(providerKeys);
  }, [providerKeys]);

  useEffect(() => {
    setLocalModels(providerModels);
  }, [providerModels]);

  if (!isOpen) return null;

  const currentProviderConfig =
    AI_PROVIDERS.find((p) => p.id === selectedTabProvider) || AI_PROVIDERS[0];
  const currentKey = localKeys[selectedTabProvider] || "";
  const currentModel =
    localModels[selectedTabProvider] || currentProviderConfig.defaultModel;
  const currentTestResult = testResults[selectedTabProvider];

  const handleKeyChange = (value: string) => {
    setLocalKeys((prev) => ({
      ...prev,
      [selectedTabProvider]: value,
    }));
    setTestResults((prev) => ({
      ...prev,
      [selectedTabProvider]: null,
    }));
  };

  const handleModelChange = (model: string) => {
    setLocalModels((prev) => ({
      ...prev,
      [selectedTabProvider]: model,
    }));
    onSelectProviderModel(selectedTabProvider, model);
  };

  const handleToggleShowKey = () => {
    setShowKey((prev) => ({
      ...prev,
      [selectedTabProvider]: !prev[selectedTabProvider],
    }));
  };

  const handleClearCurrentKey = () => {
    handleKeyChange("");
    onSaveProviderKey(selectedTabProvider, "");
    setTestResults((prev) => ({
      ...prev,
      [selectedTabProvider]: {
        success: true,
        message: t("Kľúč pre {0} bol vymazaný.", currentProviderConfig.name),
      },
    }));
  };

  const handleTestConnection = async () => {
    const keyToTest = currentKey.trim();
    if (!keyToTest && selectedTabProvider !== "gemini") {
      setTestResults((prev) => ({
        ...prev,
        [selectedTabProvider]: {
          success: false,
          message: t("Pred testom prosím zadajte váš API kľúč pre {0}.", currentProviderConfig.name),
        },
      }));
      return;
    }

    setIsTesting(true);
    setTestResults((prev) => ({
      ...prev,
      [selectedTabProvider]: null,
    }));

    try {
      const data = await safeFetchJson<{
        valid?: boolean;
        message?: string;
      }>("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-ai-provider": selectedTabProvider,
          [`x-${selectedTabProvider}-api-key`]: keyToTest,
        },
        body: JSON.stringify({
          provider: selectedTabProvider,
          apiKey: keyToTest,
          model: currentModel,
        }),
      });

      if (data.valid) {
        setTestResults((prev) => ({
          ...prev,
          [selectedTabProvider]: {
            success: true,
            message: data.message || t("Spojenie s {0} je funkčné!", currentProviderConfig.name),
          },
        }));
        // Auto-save the validated key
        onSaveProviderKey(selectedTabProvider, keyToTest);
      } else {
        setTestResults((prev) => ({
          ...prev,
          [selectedTabProvider]: {
            success: false,
            message: data.message || t("Overenie zlyhalo. Skontrolujte kľúč a oprávnenia."),
          },
        }));
      }
    } catch (err: any) {
      if (err.status === 404 || err.message?.includes("404")) {
        // Safe fallback for static deployments without backend endpoints
        setTestResults((prev) => ({
          ...prev,
          [selectedTabProvider]: {
            success: true,
            message: `API kľúč pre ${currentProviderConfig.name} bol úspešne uložený do lokálnej pamäte prehliadača.`,
          },
        }));
        onSaveProviderKey(selectedTabProvider, keyToTest);
      } else {
        setTestResults((prev) => ({
          ...prev,
          [selectedTabProvider]: {
            success: false,
            message: err.message || "Chyba pri komunikácii so serverom.",
          },
        }));
      }
      const errorMessage =
        err.status === 404
          ? t("Požadovaný koncový bod nebol nájdený (HTTP 404).")
          : err.message || t("Chyba pri komunikácii so serverom.");
      setTestResults((prev) => ({
        ...prev,
        [selectedTabProvider]: {
          success: false,
          message: errorMessage,
        },
      }));
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveAndActivate = () => {
    // Save current active tab key
    onSaveProviderKey(selectedTabProvider, currentKey.trim());
    onSelectActiveProvider(selectedTabProvider);
    onSelectProviderModel(selectedTabProvider, currentModel);

    // Save all keys in state
    Object.entries(localKeys).forEach(([prov, k]) => {
      onSaveProviderKey(prov as AIProviderId, (typeof k === "string" ? k : "").trim());
    });

    onClose();
  };

  return (
    <div data-testid="api-key-modal-div-1" className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div data-testid="api-key-modal"
        id="api-key-modal"
        className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-7 shadow-2xl border border-stone-200 relative overflow-hidden max-h-[94vh] flex flex-col"
      >
        {/* Header */}
        <div data-testid="api-key-modal-div-2" className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 shrink-0">
          <div data-testid="api-key-modal-div-3" className="flex items-center gap-2.5">
            <div data-testid="api-key-modal-div-4" className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-xs shrink-0">
              <Cpu className="w-5 h-5" />
            </div>
            <div data-testid="api-key-modal-div-5">
              <div data-testid="api-key-modal-div-6" className="flex items-center gap-2">
                <h3 data-testid="api-key-modal-h3-7" className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  {t("Výber a nastavenie AI Providerov")} </h3>
                <span data-testid="api-key-modal-span-8" className="text-[10px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full">
                  {t("7 Providerov")} </span>
              </div>
              <p data-testid="api-key-modal-p-9" className="text-[11px] sm:text-xs text-stone-500">
                {t("Podpora pre Anthropic, Perplexity, NVIDIA Nemotron, DeepSeek, OpenAI, Grok & Gemini")} </p>
            </div>
          </div>
          <button data-testid="api-key-modal-close-10"
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Provider Tabs Horizontal Slider */}
        <div data-testid="api-key-modal-div-11" className="pt-3 pb-2 border-b border-stone-100 shrink-0">
          <div data-testid="api-key-modal-div-12" className="text-[11px] font-bold uppercase tracking-wider text-stone-500 mb-2">
            {t("Vyberte providera pre konfiguráciu alebo aktiváciu:")} </div>
          <div data-testid="api-key-modal-div-13" className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
            {AI_PROVIDERS.map((prov) => {
              const isSelected = selectedTabProvider === prov.id;
              const isActive = activeProvider === prov.id;
              const hasKey = Boolean(localKeys[prov.id]?.trim()?.length > 5);

              return (
                <button data-testid={`api-key-modal-button-14-${prov.id}`}
                  key={prov.id}
                  type="button"
                  onClick={() => setSelectedTabProvider(prov.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all touch-manipulation border ${
                    isSelected
                      ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                      : "bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  <span data-testid={`api-key-modal-span-15-${prov.id}`}>{prov.name}</span>
                  {isActive && (
                    <span data-testid={`api-key-modal-span-16-${prov.id}`}
                      className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold ${
                        isSelected
                          ? "bg-emerald-400 text-stone-900"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {t("Aktívny")} </span>
                  )}
                  {hasKey && !isActive && (
                    <span data-testid={`api-key-modal-span-17-${prov.id}`} className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div data-testid="api-key-modal-div-18" className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {/* Provider Overview Card */}
          <div data-testid="api-key-modal-div-19" className="p-3.5 sm:p-4 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div data-testid="api-key-modal-div-20">
              <div data-testid="api-key-modal-div-21" className="flex items-center gap-2">
                <span data-testid="api-key-modal-span-22" className="text-sm font-bold text-stone-900">
                  {currentProviderConfig.name}
                </span>
                <span data-testid="api-key-modal-span-23" className="text-[11px] font-medium text-stone-500">
                  {t("od")} {currentProviderConfig.company}
                </span>
                <span data-testid="api-key-modal-span-24" className="text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                  {currentProviderConfig.supportsWebSearch ? (
                    <>
                      <Globe className="w-3 h-3 text-blue-600" />
                      <span data-testid="api-key-modal-span-25">Live Web Search</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3 h-3 text-amber-600" />
                      <span data-testid="api-key-modal-span-26">{t(currentProviderConfig.badgeText)}</span>
                    </>
                  )}
                </span>
              </div>
              <p data-testid="api-key-modal-p-27" className="text-xs text-stone-600 mt-1 leading-relaxed">
                {t(currentProviderConfig.description)}
              </p>
            </div>

            {activeProvider !== selectedTabProvider ? (
              <button data-testid="api-key-modal-button-28"
                type="button"
                onClick={() => onSelectActiveProvider(selectedTabProvider)}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shrink-0 shadow-xs touch-manipulation"
              >
                <Check className="w-4 h-4" />
                <span data-testid="api-key-modal-span-29">{t("Nastaviť ako aktívny")}</span>
              </button>
            ) : (
              <span data-testid="api-key-modal-span-30" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span data-testid="api-key-modal-span-31">{t("Aktuálne zvolený")}</span>
              </span>
            )}
          </div>

          {/* Model Selector */}
          <div data-testid="api-key-modal-div-32">
            <label data-testid="api-key-modal-label-33" className="text-xs font-bold uppercase tracking-wider text-stone-700 block mb-1.5">
              {t("Model pre")} {currentProviderConfig.name}
            </label>
            <select data-testid="api-key-modal-select-34"
              value={currentModel}
              onChange={(e) => handleModelChange(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs sm:text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
            >
              {currentProviderConfig.models.map((m) => (
                <option data-testid={`api-key-modal-option-35-${m}`} key={m} value={m}>
                  {m} {m === currentProviderConfig.defaultModel ? t("(Odporúčaný)") : ""}
                </option>
              ))}
            </select>
          </div>

          {/* API Key Input */}
          <div data-testid="api-key-modal-div-36">
            <div data-testid="api-key-modal-div-37" className="flex items-center justify-between mb-1.5">
              <label data-testid="api-key-modal-label-38"
                htmlFor="provider-api-key-input"
                className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5"
              >
                <span data-testid="api-key-modal-span-39">{t("API Kľúč (")}{currentProviderConfig.keyEnvName})</span>
                {currentKey ? (
                  <span data-testid="api-key-modal-span-40" className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                    {t("Zadaný")} </span>
                ) : (
                  <span data-testid="api-key-modal-span-41" className="text-[10px] font-medium text-stone-400">
                    {selectedTabProvider === "gemini" ? t("(voliteľné)") : t("(potrebné pre živé volanie)")}
                  </span>
                )}
              </label>
              <a data-testid="api-key-modal-a-42"
                href={currentProviderConfig.getKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span data-testid="api-key-modal-span-43">{t("Získať")} {currentProviderConfig.name} {t("kľúč")}</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div data-testid="api-key-modal-div-44" className="relative">
              <input data-testid="provider-api-key-input"
                id="provider-api-key-input"
                type={showKey[selectedTabProvider] ? "text" : "password"}
                value={currentKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder={currentProviderConfig.keyPlaceholder}
                className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <div data-testid="api-key-modal-div-45" className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button data-testid="api-key-modal-toggle-show-key-46"
                  type="button"
                  onClick={handleToggleShowKey}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
                  title={showKey[selectedTabProvider] ? t("Skryť") : t("Zobraziť")}
                >
                  {showKey[selectedTabProvider] ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {currentKey && (
                  <button data-testid="api-key-modal-clear-current-key-47"
                    type="button"
                    onClick={handleClearCurrentKey}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title={t("Odstrániť kľúč")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p data-testid="api-key-modal-p-48" className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
              {t("Zadaný kľúč sa bezpečne ukladá v pamäti vášho prehliadača a používa sa pri vyhľadávaní a auditoch firiem.")} </p>
          </div>

          {/* Test connection & validation button */}
          <div data-testid="api-key-modal-div-49" className="flex items-center gap-2">
            <button data-testid="test-provider-key-btn"
              id="test-provider-key-btn"
              type="button"
              disabled={isTesting || (!currentKey.trim() && selectedTabProvider !== "gemini")}
              onClick={handleTestConnection}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-stone-200"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-blue-600" : ""}`}
              />
              <span data-testid="api-key-modal-span-50">
                {isTesting
                  ? t("Testujem spojenie...")
                  : t("Otestovať spojenie s {0}", currentProviderConfig.name)}
              </span>
            </button>
          </div>

          {/* Test feedback status */}
          {currentTestResult && (
            <div data-testid="api-key-modal-div-51"
              className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                currentTestResult.success
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {currentTestResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span data-testid="provider-test-result" role="status">{t(currentTestResult.message)}</span>
            </div>
          )}

          {/* Info on Providers & Use Cases */}
          <div data-testid="api-key-modal-div-52" className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 space-y-2 text-xs text-stone-700">
            <div data-testid="api-key-modal-div-53" className="font-bold text-stone-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span data-testid="api-key-modal-span-54">{t("Kedy použiť jednotlivých providerov?")}</span>
            </div>
            <ul data-testid="api-key-modal-ul-55" className="space-y-1.5 text-[11px] text-stone-600 list-disc pl-4 leading-relaxed">
              <li data-testid="api-key-modal-li-56">
                <strong>Perplexity Sonar & Gemini:</strong> {t("Vynikajúce na live prehľadávanie slovenského internetu v reálnom čase (webov, sociálnych sietí, ORSR a FinStat).")} </li>
              <li data-testid="api-key-modal-li-57">
                <strong>Anthropic Claude (3.5/3.7 Sonnet):</strong> {t("Bezkonkurenčná kvalita B2B copywritingu a prirodzeného slovenského vykania pre cold outreach emaily.")} </li>
              <li data-testid="api-key-modal-li-58">
                <strong>NVIDIA Nemotron (70B):</strong> {t("Vysoká precíznosť štruktúrovaných inštrukcií a hĺbková analýza digitálnych bariér.")} </li>
              <li data-testid="api-key-modal-li-59">
                <strong>DeepSeek & OpenAI:</strong> {t("Rýchla dátová syntéza a spoľahlivá kategorizácia slovenských SMB subjektov.")} </li>
            </ul>
          </div>

          {/* Security note */}
          <div data-testid="api-key-modal-div-60" className="p-3 rounded-xl bg-blue-50/60 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span data-testid="api-key-modal-span-61" className="leading-relaxed">
              <strong>{t("Zabezpečenie:")}</strong> {t("Vaše kľúče zostávajú vo vašom zariadení (localStorage) a neprenášajú sa do žiadnych externých sledovacích systémov.")} </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div data-testid="api-key-modal-div-62" className="flex items-center justify-between pt-3 sm:pt-4 border-t border-stone-100 shrink-0">
          <div data-testid="api-key-modal-div-63" className="text-xs text-stone-500 hidden sm:block">
            {t("Aktívny:")} <strong className="text-stone-900">{currentProviderConfig.name}</strong> ({currentModel})
          </div>

          <div data-testid="api-key-modal-div-64" className="flex items-center gap-2.5 ml-auto">
            <button data-testid="api-key-modal-close-65"
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors touch-manipulation"
            >
              {t("Zatvoriť")} </button>
            <button data-testid="save-api-key-btn"
              id="save-api-key-btn"
              type="button"
              onClick={handleSaveAndActivate}
              className="px-5 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 touch-manipulation"
            >
              <Check className="w-4 h-4" />
              <span data-testid="api-key-modal-span-66">{t("Uložiť a aktivovať")} {currentProviderConfig.name}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
