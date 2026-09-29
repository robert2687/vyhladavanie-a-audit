import { useLanguage } from '../context/LanguageContext';
import React, { useState } from "react";
import {
  Building,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  CheckCircle2,
  Copy,
  Check,
  Terminal,
  Sparkles,
  Download,
  FileCode,
  Layers,
  Cpu
} from "lucide-react";
import { SLOVAK_REGISTERS_INFO, COMMON_WEB_SIGNALS } from "../data/slovakData";

const UNIVERSAL_SYSTEM_PROMPT_TEXT = `You are a specialized B2B Lead Generation & Web Audit Assistant tailored for the Slovak market. Your task is to identify small to medium-sized companies (3–50 employees) in designated regions and industries, analyze their online presence, and discover operational or digital gaps.

### Operational Workflow:
1. Search and identify companies within the given location and sector (strictly target SMBs, avoid large enterprises/corporations).
2. Inspect their official website, Google Business Profile, and public registers (e.g., ORSR, FinStat, Overit.sk, Infoma).
3. Look for actionable web signals (e.g., missing lead intake forms, pricing locked in PDFs, slow/outdated web design, unorganized service requests).
4. Map identified deficiencies to valuable solutions (e.g., automated intake forms, custom AI document assistants, client portals, interactive price calculators).
5. Identify the decision-maker (Owner, Founder, Executive Director, Operations Manager). Avoid generic info@ emails whenever possible.

### Output Schema for Every Prospect:

**Company Name:** [Official name + Business ID / IČO if available]
**Website:** [URL]
**Company Size / Industry:** [e.g., Construction SMB, ~10-25 employees]
**Target Decision-Maker:** [Name & Role, e.g., Ján Novák – Managing Director (sourced from ORSR/LinkedIn)]
**Direct Contact:** [Executive Email, Direct Phone, or LinkedIn profile]

**Identified Web Signals & Gaps:**
- [Specific issues observed on their website or workflow]

**Value Proposition & Solution:**
- [Tailored offer: e.g., Lead Form + Instant SMS/Slack notification setup]

**Cold Outreach Draft (Personalized Pitch):**
- Subject: [High-converting, non-spammy subject line]
- Body: [3-4 concise, value-focused sentences referencing their specific website flaw]
---`;

const PYTHON_MULTI_PROVIDER_CODE = `import os
from openai import OpenAI

# Configuration map for multiple providers
PROVIDERS = {
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "api_key_env": "DEEPSEEK_API_KEY",
        "default_model": "deepseek-chat" # or deepseek-reasoner
    },
    "nemotron": {
        "base_url": "https://integrate.api.nvidia.com/v1",
        "api_key_env": "NVIDIA_API_KEY",
        "default_model": "nvidia/llama-3.1-nemotron-70b-instruct"
    },
    "grok": {
        "base_url": "https://api.x.ai/v1",
        "api_key_env": "XAI_API_KEY",
        "default_model": "grok-2-latest"
    },
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "api_key_env": "OPENAI_API_KEY",
        "default_model": "gpt-4o"
    }
}

SYSTEM_INSTRUCTION = """${UNIVERSAL_SYSTEM_PROMPT_TEXT}"""

def run_lead_finder(provider_name: str, user_prompt: str):
    config = PROVIDERS.get(provider_name.lower())
    if not config:
        raise ValueError(f"Provider {provider_name} not supported.")

    api_key = os.getenv(config["api_key_env"])
    if not api_key:
        raise ValueError(f"Environment variable {config['api_key_env']} is not set.")

    client = OpenAI(
        api_key=api_key,
        base_url=config["base_url"]
    )

    response = client.chat.completions.create(
        model=config["default_model"],
        messages=[
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2
    )

    return response.choices[0].message.content

# Example usage:
if __name__ == "__main__":
    # Specify your target provider: "deepseek", "nemotron", "grok", or "openai"
    provider = os.getenv("DEFAULT_PROVIDER", "deepseek")
    query = "Find 5 accounting firms in Banská Bystrica with outdated websites."
    print(f"Running Slovak SMB lead discovery via {provider}...")
    try:
        results = run_lead_finder(provider, query)
        print("\\n--- Discovery Results ---\\n")
        print(results)
    except Exception as e:
        print(f"Notice: {e}")
`;

export const RegistersGuideModal: React.FC = () => {
  const { language: uiLanguage, t } = useLanguage();
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [copiedPython, setCopiedPython] = useState(false);

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(UNIVERSAL_SYSTEM_PROMPT_TEXT);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleCopyPython = async () => {
    try {
      await navigator.clipboard.writeText(PYTHON_MULTI_PROVIDER_CODE);
      setCopiedPython(true);
      setTimeout(() => setCopiedPython(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleDownloadPython = () => {
    const blob = new Blob([PYTHON_MULTI_PROVIDER_CODE], { type: "text/x-python;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "slovak_lead_finder.py";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div data-testid="registers-guide-modal-div-1" className="space-y-6 sm:space-y-8 max-w-5xl mx-auto">
      {/* Intro Hero */}
      <div data-testid="registers-guide-modal-div-2" className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-md">
        <div data-testid="registers-guide-modal-div-3" className="max-w-2xl">
          <span data-testid="registers-guide-modal-span-4" className="text-xs font-semibold uppercase tracking-widest text-blue-300">
            {t("Metodika B2B auditu & lead generation")} </span>
          <h2 data-testid="registers-guide-modal-h2-5" className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-1 leading-snug">
            {t("Ako vyhľadávať a oslovovať slovenské SMB (3–50 zamestnancov)")} </h2>
          <p data-testid="registers-guide-modal-p-6" className="text-xs sm:text-sm text-blue-100/90 mt-2 leading-relaxed">
            {t("Slovenský B2B trh si vyžaduje osobitý prístup: majitelia a konatelia menších firiem sú preťažení operatívou. Ignorujú generické šablóny, no reagujú na konkrétne poukázanie na nefunkčnosť na ich webe a priame riešenie šetriace čas.")} </p>
        </div>
      </div>

      {/* Universal System Instructions (English) Section */}
      <div data-testid="registers-guide-modal-div-7" className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-8 shadow-xs">
        <div data-testid="registers-guide-modal-div-8" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div data-testid="registers-guide-modal-div-9" className="flex items-center gap-2">
            <span data-testid="registers-guide-modal-span-10" className="p-1.5 rounded-lg bg-indigo-50 text-indigo-700 shrink-0">
              <Terminal className="w-5 h-5" />
            </span>
            <div data-testid="registers-guide-modal-div-11">
              <div data-testid="registers-guide-modal-div-12" className="flex items-center gap-2 flex-wrap">
                <h3 data-testid="registers-guide-modal-h3-13" className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  Universal System Instructions (English)
                </h3>
                <span data-testid="registers-guide-modal-span-14" className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {t("Aktívne v API parametroch")} </span>
              </div>
              <p data-testid="registers-guide-modal-p-15" className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                {t("Presný systémový prompt vložený do parametra")} <code className="text-stone-700 bg-stone-100 px-1 py-0.5 rounded text-[11px]">config.systemInstruction</code> {t("API volaní")} </p>
            </div>
          </div>

          <button data-testid="copy-system-prompt-btn"
            id="copy-system-prompt-btn"
            onClick={handleCopyPrompt}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all min-h-[40px] touch-manipulation w-full sm:w-auto ${
              copiedPrompt
                ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50 hover:text-stone-900"
            }`}
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span data-testid="registers-guide-modal-span-16">{t("Skopírované!")}</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span data-testid="registers-guide-modal-span-17">{t("Kopírovať systémový prompt")}</span>
              </>
            )}
          </button>
        </div>

        <div data-testid="registers-guide-modal-div-18" className="relative rounded-xl border border-stone-200 bg-stone-900 text-stone-100 p-3.5 sm:p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-80">
          <pre data-testid="registers-guide-modal-pre-19" className="whitespace-pre-wrap font-sans text-stone-200 text-xs sm:text-[13px] leading-relaxed">
            {UNIVERSAL_SYSTEM_PROMPT_TEXT}
          </pre>
        </div>
      </div>

      {/* Multi-Provider Python Integration Example Section */}
      <div data-testid="registers-guide-modal-div-20" className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-8 shadow-xs">
        <div data-testid="registers-guide-modal-div-21" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
          <div data-testid="registers-guide-modal-div-22" className="flex items-center gap-2">
            <span data-testid="registers-guide-modal-span-23" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 shrink-0">
              <FileCode className="w-5 h-5" />
            </span>
            <div data-testid="registers-guide-modal-div-24">
              <div data-testid="registers-guide-modal-div-25" className="flex items-center gap-2 flex-wrap">
                <h3 data-testid="registers-guide-modal-h3-26" className="text-base sm:text-lg font-bold text-stone-900 leading-tight">
                  Multi-Provider Python Integration Example
                </h3>
                <span data-testid="registers-guide-modal-span-27" className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-md">
                  <Layers className="w-3 h-3 text-blue-600" />
                  OpenAI-Compatible
                </span>
              </div>
              <p data-testid="registers-guide-modal-p-28" className="text-[11px] sm:text-xs text-stone-500 mt-0.5">
                {t("Jednotný setup s vopred vloženými inštrukciami pre DeepSeek, NVIDIA Nemotron, xAI Grok a OpenAI")} </p>
            </div>
          </div>

          <div data-testid="registers-guide-modal-div-29" className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto">
            <button data-testid="copy-python-code-btn"
              id="copy-python-code-btn"
              onClick={handleCopyPython}
              className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-all min-h-[40px] touch-manipulation ${
                copiedPython
                  ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                  : "bg-white text-stone-700 border-stone-300 hover:bg-stone-50 hover:text-stone-900"
              }`}
            >
              {copiedPython ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span data-testid="registers-guide-modal-span-30">{t("Skopírované!")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span data-testid="registers-guide-modal-span-31">{t("Kopírovať Python kód")}</span>
                </>
              )}
            </button>

            <button data-testid="download-python-btn"
              id="download-python-btn"
              onClick={handleDownloadPython}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-xs min-h-[40px] touch-manipulation"
            >
              <Download className="w-3.5 h-3.5" />
              <span data-testid="registers-guide-modal-span-32">{t("Stiahnuť .py skript")}</span>
            </button>
          </div>
        </div>

        {/* Supported providers list chips */}
        <div data-testid="registers-guide-modal-div-33" className="flex items-center gap-2 mb-3 flex-wrap text-xs">
          <span data-testid="registers-guide-modal-span-34" className="text-stone-500 font-medium">{t("Podporované modely:")}</span>
          <span data-testid="registers-guide-modal-span-35" className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono text-[11px] border border-stone-200">
            DeepSeek (deepseek-chat / deepseek-reasoner)
          </span>
          <span data-testid="registers-guide-modal-span-36" className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono text-[11px] border border-stone-200">
            NVIDIA Nemotron (llama-3.1-nemotron-70b)
          </span>
          <span data-testid="registers-guide-modal-span-37" className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono text-[11px] border border-stone-200">
            xAI Grok (grok-2-latest)
          </span>
          <span data-testid="registers-guide-modal-span-38" className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md font-mono text-[11px] border border-stone-200">
            OpenAI (gpt-4o)
          </span>
        </div>

        <div data-testid="registers-guide-modal-div-39" className="relative rounded-xl border border-stone-800 bg-stone-950 text-stone-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed max-h-96">
          <pre data-testid="registers-guide-modal-pre-40" className="text-stone-200 text-xs leading-relaxed font-mono whitespace-pre">
            {PYTHON_MULTI_PROVIDER_CODE}
          </pre>
        </div>

        <div data-testid="registers-guide-modal-div-41" className="mt-3 flex items-center justify-between text-xs text-stone-500 bg-stone-50 p-2.5 rounded-lg border border-stone-200/80">
          <span data-testid="registers-guide-modal-span-42">{t("Inštalácia knižnice:")} <code className="bg-white px-1.5 py-0.5 rounded border text-stone-800 font-mono">pip install openai</code></span>
          <span data-testid="registers-guide-modal-span-43" className="text-stone-400">Export: <code>/api/export/python-script</code></span>
        </div>
      </div>

      {/* Slovak Public Registers */}
      <div data-testid="registers-guide-modal-div-44" className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div data-testid="registers-guide-modal-div-45" className="flex items-center gap-2 mb-4">
          <span data-testid="registers-guide-modal-span-46" className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
            <Building className="w-5 h-5" />
          </span>
          <h3 data-testid="registers-guide-modal-h3-47" className="text-lg font-bold text-stone-900">
            {t("Kľúčové verejné registre SR a overovanie decision-makerov")} </h3>
        </div>

        <div data-testid="registers-guide-modal-div-48" className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {SLOVAK_REGISTERS_INFO.map((reg) => (
            <div data-testid={`registers-guide-modal-div-49-${reg.name}`}
              key={reg.name}
              className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition-colors"
            >
              <div data-testid={`registers-guide-modal-div-50-${reg.name}`} className="flex items-center justify-between gap-2 mb-1">
                <h4 data-testid={`registers-guide-modal-h4-51-${reg.name}`} className="text-sm font-bold text-stone-900">{t(reg.name)}</h4>
                <a data-testid={`registers-guide-modal-a-52-${reg.name}`}
                  href={reg.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-700 inline-flex items-center gap-1"
                >
                  <span data-testid={`registers-guide-modal-span-53-${reg.name}`}>{t("Otvoriť")}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <span data-testid={`registers-guide-modal-span-54-${reg.name}`} className="text-xs font-medium text-stone-500 block mb-2">{t(reg.role)}</span>
              <p data-testid={`registers-guide-modal-p-55-${reg.name}`} className="text-xs text-stone-700 leading-relaxed">{t(reg.useCase)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Typical Web Signals & Conversion Killers */}
      <div data-testid="registers-guide-modal-div-56" className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div data-testid="registers-guide-modal-div-57" className="flex items-center gap-2 mb-4">
          <span data-testid="registers-guide-modal-span-58" className="p-1.5 rounded-lg bg-amber-50 text-amber-700">
            <AlertTriangle className="w-5 h-5" />
          </span>
          <h3 data-testid="registers-guide-modal-h3-59" className="text-lg font-bold text-stone-900">
            {t("Typické digitálne medzery na weboch slovenských SMB")} </h3>
        </div>

        <div data-testid="registers-guide-modal-div-60" className="space-y-4 mt-4">
          {COMMON_WEB_SIGNALS.map((gap, idx) => (
            <div data-testid={`registers-guide-modal-div-61-${idx}`}
              key={idx}
              className="p-4 rounded-xl border border-stone-200/80 bg-stone-50/40 grid grid-cols-1 sm:grid-cols-2 gap-4"
            >
              <div data-testid={`registers-guide-modal-div-62-${idx}`}>
                <span data-testid={`registers-guide-modal-span-63-${idx}`} className="text-xs font-bold text-stone-900 block mb-1">
                  {t("Chyba:")} {t(gap.title)}
                </span>
                <p data-testid={`registers-guide-modal-p-64-${idx}`} className="text-xs text-stone-600 leading-relaxed">{t(gap.description)}</p>
              </div>
              <div data-testid={`registers-guide-modal-div-65-${idx}`} className="sm:border-l sm:border-stone-200 sm:pl-4">
                <span data-testid={`registers-guide-modal-span-66-${idx}`} className="text-xs font-bold text-blue-800 block mb-1">
                  {t("Hodnotová ponuka & Riešenie:")} </span>
                <p data-testid={`registers-guide-modal-p-67-${idx}`} className="text-xs text-stone-700 leading-relaxed font-medium">
                  {t(gap.solution)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rules for Cold Outreach in Slovakia */}
      <div data-testid="registers-guide-modal-div-68" className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <div data-testid="registers-guide-modal-div-69" className="flex items-center gap-2 mb-4">
          <span data-testid="registers-guide-modal-span-70" className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
            <CheckCircle2 className="w-5 h-5" />
          </span>
          <h3 data-testid="registers-guide-modal-h3-71" className="text-lg font-bold text-stone-900">
            {t("Zásady úspešného B2B oslovenia (Cold Outreach) na Slovensku")} </h3>
        </div>

        <ul data-testid="registers-guide-modal-ul-72" className="space-y-3 text-sm text-stone-700">
          <li data-testid="registers-guide-modal-li-73" className="flex items-start gap-2.5">
            <span data-testid="registers-guide-modal-span-74" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
            <span data-testid="registers-guide-modal-span-75">
              <strong>{t("Vyhýbajte sa všeobecnému info@")}</strong>{t(": V menšej firme info@ e-mail kontroluje asistentka alebo účtovníčka, ktorá predajné ponuky okamžite maže. Vždy hľadajte meno konateľa (ORSR) a jeho priamy mobil alebo menný e-mail (napr.")} <code>jan.novak@firma.sk</code>).
            </span>
          </li>
          <li data-testid="registers-guide-modal-li-76" className="flex items-start gap-2.5">
            <span data-testid="registers-guide-modal-span-77" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
            <span data-testid="registers-guide-modal-span-78">
              <strong>{t("Dĺžka tela správy: presne 3–4 vety")}</strong>{t(": Žiadne dlhé firemné predstavenia. Priamo poukážte na slabinu ich webu, povedzte čo ste vyriešili pre podobnú firmu v regióne, a požiadajte o 8–10 minútový nezáväzný hovor.")} </span>
          </li>
          <li data-testid="registers-guide-modal-li-79" className="flex items-start gap-2.5">
            <span data-testid="registers-guide-modal-span-80" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
            <span data-testid="registers-guide-modal-span-81">
              <strong>{t("Nekritizujte arogantne, poukážte na stratu tržieb")}</strong>{t(": Namiesto \"Máte zlý web\" použite \"Všimol som si, že vaši zákazníci musia dopyty písať do voľného e-mailu, čo podľa dát odradí až tretinu záujemcov o nacenenie.\"")} </span>
          </li>
          <li data-testid="registers-guide-modal-li-82" className="flex items-start gap-2.5">
            <span data-testid="registers-guide-modal-span-83" className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-2 shrink-0" />
            <span data-testid="registers-guide-modal-span-84">
              <strong>{t("Slušné vykanie s veľkým V")}</strong>{t(": Na slovenskom B2B trhu je tykanie v prvom e-maile vnímané neprofesionálne. Držte sa prirodzeného, priameho vykania.")} </span>
          </li>
        </ul>
      </div>
    </div>
  );
};
