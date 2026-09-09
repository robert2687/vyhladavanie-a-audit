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
  Layers,
  Check
} from "lucide-react";

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGeminiKey: (key: string) => void;
  currentGeminiKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onSaveGeminiKey,
  currentGeminiKey,
}) => {
  const [geminiKey, setGeminiKey] = useState(currentGeminiKey);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Multi-provider keys for Python script export & configuration
  const [deepseekKey, setDeepseekKey] = useState("");
  const [grokKey, setGrokKey] = useState("");
  const [openaiKey, setOpenaiKey] = useState("");
  const [showMultiProvider, setShowMultiProvider] = useState(false);

  useEffect(() => {
    setGeminiKey(currentGeminiKey);
  }, [currentGeminiKey]);

  useEffect(() => {
    try {
      setDeepseekKey(localStorage.getItem("slovak_leadgen_deepseek_key") || "");
      setGrokKey(localStorage.getItem("slovak_leadgen_grok_key") || "");
      setOpenaiKey(localStorage.getItem("slovak_leadgen_openai_key") || "");
    } catch {
      // Ignore
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveGeminiKey(geminiKey.trim());
    try {
      if (deepseekKey.trim()) {
        localStorage.setItem("slovak_leadgen_deepseek_key", deepseekKey.trim());
      } else {
        localStorage.removeItem("slovak_leadgen_deepseek_key");
      }
      if (grokKey.trim()) {
        localStorage.setItem("slovak_leadgen_grok_key", grokKey.trim());
      } else {
        localStorage.removeItem("slovak_leadgen_grok_key");
      }
      if (openaiKey.trim()) {
        localStorage.setItem("slovak_leadgen_openai_key", openaiKey.trim());
      } else {
        localStorage.removeItem("slovak_leadgen_openai_key");
      }
    } catch {
      // Ignore
    }
    setTestResult({
      success: true,
      message: "Nastavenia API kľúča boli úspešne uložené do vášho prehliadača.",
    });
    setTimeout(() => {
      onClose();
    }, 900);
  };

  const handleTestKey = async () => {
    if (!geminiKey.trim()) {
      setTestResult({
        success: false,
        message: "Prosím zadajte najprv váš Gemini API kľúč.",
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await fetch("/api/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-gemini-api-key": geminiKey.trim(),
        },
        body: JSON.stringify({ apiKey: geminiKey.trim() }),
      });

      const data = await response.json();
      if (response.ok && data.valid) {
        setTestResult({
          success: true,
          message: data.message || "API kľúč je platný a pripojený k modelu Gemini 3.8 Flash!",
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || "Neplatný API kľúč. Skontrolujte formát a oprávnenia kľúča.",
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Chyba pri overovaní spojenia so serverom.",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearKey = () => {
    setGeminiKey("");
    onSaveGeminiKey("");
    setTestResult({
      success: true,
      message: "Vlastný kľúč bol odstránený. Aplikácia bude používať predvolený engine.",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        id="api-key-modal"
        className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-7 shadow-2xl border border-stone-200 relative overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-stone-100 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                Nastavenia API kľúča
              </h3>
              <p className="text-[11px] sm:text-xs text-stone-500">
                Priame pripojenie na Google Gemini modely
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors touch-manipulation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="gemini-api-key-input"
                className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-1.5"
              >
                <span>Google Gemini API Kľúč</span>
                {geminiKey ? (
                  <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                    Nastavený
                  </span>
                ) : (
                  <span className="text-[10px] font-medium text-stone-400">
                    (voliteľné)
                  </span>
                )}
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
              >
                <span>Získať kľúč zadarmo</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                id="gemini-api-key-input"
                type={showGeminiKey ? "text" : "password"}
                value={geminiKey}
                onChange={(e) => {
                  setGeminiKey(e.target.value);
                  setTestResult(null);
                }}
                placeholder="AIzaSy..."
                className="w-full pl-3.5 pr-20 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-mono text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setShowGeminiKey(!showGeminiKey)}
                  className="p-1.5 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200/60 transition-colors"
                  title={showGeminiKey ? "Skryť" : "Zobraziť"}
                >
                  {showGeminiKey ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
                {geminiKey && (
                  <button
                    type="button"
                    onClick={handleClearKey}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                    title="Odstrániť kľúč"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
              Zadaný kľúč sa ukladá iba vo vašom prehliadači a posiela sa priamo modelu cez zabezpečenú požiadavku.
            </p>
          </div>

          {/* Test connection button */}
          <div className="flex items-center gap-2">
            <button
              id="test-gemini-key-btn"
              type="button"
              disabled={isTesting || !geminiKey.trim()}
              onClick={handleTestKey}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 hover:text-stone-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-stone-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? "animate-spin text-blue-600" : ""}`} />
              <span>{isTesting ? "Overujem pripojenie..." : "Otestovať pripojenie"}</span>
            </button>
          </div>

          {/* Test feedback status */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs leading-relaxed flex items-start gap-2 ${
                testResult.success
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Optional Multi-provider section */}
          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              onClick={() => setShowMultiProvider(!showMultiProvider)}
              className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center justify-between w-full py-1"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-stone-400" />
                <span>Kľúče pre ďalších providerov (DeepSeek, Grok, OpenAI)</span>
              </span>
              <span className="text-[11px] text-blue-600">
                {showMultiProvider ? "Skryť" : "Zobraziť"}
              </span>
            </button>

            {showMultiProvider && (
              <div className="space-y-3 mt-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    DeepSeek API Key (DEEPSEEK_API_KEY)
                  </label>
                  <input
                    type="password"
                    value={deepseekKey}
                    onChange={(e) => setDeepseekKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    xAI Grok API Key (XAI_API_KEY)
                  </label>
                  <input
                    type="password"
                    value={grokKey}
                    onChange={(e) => setGrokKey(e.target.value)}
                    placeholder="xai-..."
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-stone-600 block mb-1">
                    OpenAI API Key (OPENAI_API_KEY)
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder="sk-proj-..."
                    className="w-full px-2.5 py-1.5 bg-white border border-stone-200 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-xl bg-blue-50/50 border border-blue-100 flex items-start gap-2.5 text-xs text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Zabezpečenie:</strong> Váš API kľúč zostáva bezpečne vo vašom prehliadači. Neposiela sa žiadnym tretím stranám ani analytickým nástrojom.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 sm:pt-4 border-t border-stone-100 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 min-h-[42px] text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-xl transition-colors touch-manipulation"
          >
            Zatvoriť
          </button>
          <button
            id="save-api-key-btn"
            type="button"
            onClick={handleSave}
            className="px-5 py-2.5 min-h-[42px] text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 touch-manipulation"
          >
            <Check className="w-4 h-4" />
            <span>Uložiť kľúč</span>
          </button>
        </div>
      </div>
    </div>
  );
};
