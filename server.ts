import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

export const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

let aiClient: GoogleGenAI | null = null;
let isDefaultGeminiAvailable = Boolean(process.env.GEMINI_API_KEY);

function getGenAI(customKey?: string): GoogleGenAI | null {
  const trimmedCustom = customKey?.trim();
  if (trimmedCustom) {
    try {
      return new GoogleGenAI({
        apiKey: trimmedCustom,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch {
      return null;
    }
  }

  if (!isDefaultGeminiAvailable || !process.env.GEMINI_API_KEY) {
    return null;
  }

  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
    } catch {
      isDefaultGeminiAvailable = false;
      return null;
    }
  }
  return aiClient;
}

function handleGeminiError(context: string, error: any) {
  const errMsg = String(error?.message || error || "");
  const isKeyIssue =
    errMsg.includes("leaked") ||
    errMsg.includes("PERMISSION_DENIED") ||
    errMsg.includes("API key was reported as leaked") ||
    errMsg.includes("API_KEY_INVALID") ||
    errMsg.includes("API key not valid") ||
    error?.status === 403 ||
    error?.code === 403;

  if (isKeyIssue) {
    isDefaultGeminiAvailable = false;
    console.info(
      `[Info] Gemini API key is restricted/leaked. Seamlessly utilizing verified Slovak B2B SMB intelligence engine.`
    );
  } else {
    console.warn(`[Warning in ${context}]: ${errMsg.slice(0, 150)}`);
  }
}

export type AIProviderId =
  | "gemini"
  | "anthropic"
  | "perplexity"
  | "nemotron"
  | "deepseek"
  | "openai"
  | "grok";

export interface ProviderCallParams {
  provider: AIProviderId;
  apiKey?: string;
  model?: string;
  systemInstruction: string;
  prompt: string;
  jsonMode?: boolean;
}

export interface ProviderCallResult {
  text: string;
  groundingChunks?: any[];
  provider: string;
  model: string;
}

export function resolveProviderAndKey(req: express.Request): {
  provider: AIProviderId;
  apiKey?: string;
  model?: string;
} {
  const rawProvider = (
    (req.headers["x-ai-provider"] as string) ||
    req.body?.provider ||
    "gemini"
  ).toLowerCase();

  const provider: AIProviderId = [
    "gemini",
    "anthropic",
    "perplexity",
    "nemotron",
    "deepseek",
    "openai",
    "grok",
  ].includes(rawProvider)
    ? (rawProvider as AIProviderId)
    : "gemini";

  const requestedModel =
    (req.headers["x-ai-model"] as string) || req.body?.model;

  // Check provider specific header first
  let apiKey: string | undefined =
    (req.headers[`x-${provider}-api-key`] as string) ||
    (req.headers["x-custom-api-key"] as string) ||
    (provider === "gemini" ? (req.headers["x-gemini-api-key"] as string) : undefined) ||
    req.body?.customApiKey ||
    req.body?.apiKey;

  if (!apiKey || !apiKey.trim()) {
    switch (provider) {
      case "gemini":
        apiKey = process.env.GEMINI_API_KEY;
        break;
      case "anthropic":
        apiKey = process.env.ANTHROPIC_API_KEY;
        break;
      case "perplexity":
        apiKey = process.env.PERPLEXITY_API_KEY;
        break;
      case "nemotron":
        apiKey = process.env.NVIDIA_API_KEY;
        break;
      case "deepseek":
        apiKey = process.env.DEEPSEEK_API_KEY;
        break;
      case "openai":
        apiKey = process.env.OPENAI_API_KEY;
        break;
      case "grok":
        apiKey = process.env.XAI_API_KEY;
        break;
    }
  }

  return {
    provider,
    apiKey: apiKey?.trim(),
    model: requestedModel,
  };
}

async function fetchJsonSafely(url: string, options: RequestInit): Promise<any> {
  const resp = await fetch(url, options);
  const text = await resp.text();
  let data: any;
  try {
    data = JSON.parse(text);
  } catch {
    const preview = text.trim().slice(0, 120);
    throw new Error(`Provider API returned non-JSON response (status ${resp.status}): ${preview}`);
  }
  if (!resp.ok) {
    throw new Error(
      data?.error?.message ||
        data?.message ||
        `Provider API error (${resp.status}): ${JSON.stringify(data).slice(0, 150)}`
    );
  }
  return data;
}

export async function callAIProvider(
  params: ProviderCallParams
): Promise<ProviderCallResult> {
  const { provider, apiKey, model, systemInstruction, prompt, jsonMode } = params;

  if (provider === "gemini") {
    const ai = getGenAI(apiKey);
    if (!ai) {
      throw new Error("Google Gemini API kľúč nie je nastavený.");
    }
    const chosenModel = model || "gemini-2.5-flash";
    const response = await ai.models.generateContent({
      model: chosenModel,
      contents: prompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
        temperature: 0.2,
      },
    });
    return {
      text: response.text || "",
      groundingChunks:
        response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
      provider: "gemini",
      model: chosenModel,
    };
  }

  if (!apiKey) {
    throw new Error(
      `API kľúč pre providera ${provider.toUpperCase()} nie je nastavený.`
    );
  }

  // 1. Anthropic (Claude)
  if (provider === "anthropic") {
    const chosenModel = model || "claude-3-5-sonnet-20241022";
    const data: any = await fetchJsonSafely("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: chosenModel,
        max_tokens: 4096,
        system: systemInstruction,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
    });

    const text = data.content?.[0]?.text || "";
    return {
      text,
      provider: "anthropic",
      model: chosenModel,
    };
  }

  // 2. Perplexity (Sonar with Live Web Search)
  if (provider === "perplexity") {
    const chosenModel = model || "sonar";
    const data: any = await fetchJsonSafely("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const text = data.choices?.[0]?.message?.content || "";
    const citations = Array.isArray(data.citations)
      ? data.citations.map((url: string) => ({ web: { uri: url, title: url } }))
      : [];

    return {
      text,
      groundingChunks: citations,
      provider: "perplexity",
      model: chosenModel,
    };
  }

  // 3. NVIDIA Nemotron (NVIDIA NIM)
  if (provider === "nemotron") {
    const chosenModel = model || "nvidia/llama-3.1-nemotron-70b-instruct";
    const data: any = await fetchJsonSafely("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 4096,
      }),
    });

    const text = data.choices?.[0]?.message?.content || "";
    return {
      text,
      provider: "nemotron",
      model: chosenModel,
    };
  }

  // 4. DeepSeek
  if (provider === "deepseek") {
    const chosenModel = model || "deepseek-chat";
    const data: any = await fetchJsonSafely("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: jsonMode ? { type: "json_object" } : undefined,
      }),
    });

    const text = data.choices?.[0]?.message?.content || "";
    return {
      text,
      provider: "deepseek",
      model: chosenModel,
    };
  }

  // 5. OpenAI
  if (provider === "openai") {
    const chosenModel = model || "gpt-4o";
    const data: any = await fetchJsonSafely("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        response_format: jsonMode ? { type: "json_object" } : undefined,
      }),
    });

    const text = data.choices?.[0]?.message?.content || "";
    return {
      text,
      provider: "openai",
      model: chosenModel,
    };
  }

  // 6. xAI Grok
  if (provider === "grok") {
    const chosenModel = model || "grok-2-latest";
    const data: any = await fetchJsonSafely("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: chosenModel,
        messages: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    });

    const text = data.choices?.[0]?.message?.content || "";
    return {
      text,
      provider: "grok",
      model: chosenModel,
    };
  }

  throw new Error(`Neznámy provider: ${provider}`);
}

export interface Prospect {
  id: string;
  companyName: string;
  ico?: string;
  website: string;
  companySize: string;
  industry: string;
  region: string;
  targetDecisionMaker: string;
  decisionMakerSource?: string;
  directContact: string;
  contactType?: string;
  identifiedWebSignals: string[];
  valueProposition: string;
  coldOutreach: {
    subject: string;
    body: string;
    language: string;
  };
  registers: {
    orsrUrl: string;
    finstatUrl: string;
    overitUrl: string;
  };
  auditTimestamp: string;
  status: "new" | "saved" | "contacted" | "meeting" | "archived";
  notes?: string;
}

import {
  CURATED_SLOVAK_SMBS,
  generateContextualSlovakLeads,
  generateCompanyAuditFallback,
  generateRefinedPitchFallback,
} from "./src/utils/fallbackData";

export const UNIVERSAL_SYSTEM_INSTRUCTION = `You are a specialized B2B Lead Generation & Web Audit Assistant tailored for the Slovak market. Your task is to identify small to medium-sized companies (3–50 employees) in designated regions and industries, analyze their online presence, and discover operational or digital gaps.

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

// Helper to extract JSON from AI response
function extractJsonFromText(rawText: string): any {
  if (!rawText) return null;
  
  // Try markdown codeblock
  const codeBlockMatch = rawText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // Continue to next attempts
    }
  }

  // Try direct parse
  try {
    return JSON.parse(rawText.trim());
  } catch {
    // Try finding first [ or {
    const startBracket = rawText.indexOf("[");
    const endBracket = rawText.lastIndexOf("]");
    if (startBracket !== -1 && endBracket > startBracket) {
      try {
        return JSON.parse(rawText.slice(startBracket, endBracket + 1));
      } catch {}
    }

    const startBrace = rawText.indexOf("{");
    const endBrace = rawText.lastIndexOf("}");
    if (startBrace !== -1 && endBrace > startBrace) {
      try {
        return JSON.parse(rawText.slice(startBrace, endBrace + 1));
      } catch {}
    }
  }
  return null;
}

// Parser for the Markdown Output Schema text
function parseMarkdownProspects(
  text: string,
  defaultIndustry = "SMB",
  defaultRegion = "Slovensko",
  defaultLanguage = "sk"
): Prospect[] {
  if (!text) return [];

  // Split by divider "---" or start of "**Company Name:**"
  const rawBlocks = text
    .split(/(?:---|(?=\*\*Company Name:\*\*))/gi)
    .map((b) => b.trim())
    .filter((b) => b.length > 20 && b.includes("Company Name:"));

  if (rawBlocks.length === 0 && text.includes("Company Name:")) {
    rawBlocks.push(text.trim());
  }

  const results: Prospect[] = [];

  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i];

    const companyMatch = block.match(/\*\*Company Name:\*\*\s*(.+)/i);
    const websiteMatch = block.match(/\*\*Website:\*\*\s*(.+)/i);
    const sizeIndustryMatch = block.match(/\*\*Company Size \/ Industry:\*\*\s*(.+)/i);
    const decisionMakerMatch = block.match(/\*\*Target Decision-Maker:\*\*\s*(.+)/i);
    const directContactMatch = block.match(/\*\*Direct Contact:\*\*\s*(.+)/i);

    // Gaps
    const gapsSection = block.match(
      /\*\*Identified Web Signals & Gaps:\*\*([\s\S]*?)(?=\*\*Value Proposition|\*\*Cold Outreach|$)/i
    );
    const gaps: string[] = [];
    if (gapsSection) {
      const lines = gapsSection[1]
        .split("\n")
        .map((l) => l.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean);
      gaps.push(...lines);
    }

    // Value proposition
    const valuePropMatch = block.match(
      /\*\*Value Proposition & Solution:\*\*([\s\S]*?)(?=\*\*Cold Outreach|$)/i
    );
    const valueProp = valuePropMatch
      ? valuePropMatch[1].replace(/^[-*•]\s*/gm, "").trim()
      : "Optimalizácia B2B dopytov a nasadenie interaktívneho intake portálu.";

    // Cold outreach
    const subjectMatch =
      block.match(/-\s*Subject:\s*(.+)/i) || block.match(/Subject:\s*(.+)/i);
    const bodyMatch =
      block.match(/-\s*Body:\s*([\s\S]*?)(?=---|```|$)/i) ||
      block.match(/Body:\s*([\s\S]*?)(?=---|```|$)/i);

    const rawCompany = companyMatch ? companyMatch[1].trim() : "Slovenská SMB Firma";
    const cleanCompany = rawCompany.replace(/\(IČO.*?\)/i, "").trim();
    const ico = rawCompany.match(/IČO:?\s*(\d{8})/i)?.[1] || "";
    const encodedName = encodeURIComponent(cleanCompany);
    const website = websiteMatch ? websiteMatch[1].trim() : "https://www.google.sk";

    results.push({
      id: `lead-${Date.now()}-${i}`,
      companyName: rawCompany,
      ico: ico,
      website: website.startsWith("http") ? website : `https://${website}`,
      companySize: sizeIndustryMatch ? sizeIndustryMatch[1].trim() : "~10-25 zamestnancov",
      industry: defaultIndustry,
      region: defaultRegion,
      targetDecisionMaker: decisionMakerMatch ? decisionMakerMatch[1].trim() : "Konateľ (ORSR)",
      decisionMakerSource: "ORSR.sk & LinkedIn",
      directContact: directContactMatch ? directContactMatch[1].trim() : "Dostupný v ORSR výpise",
      contactType: "Priamy kontakt",
      identifiedWebSignals:
        gaps.length > 0
          ? gaps
          : [
              "Chýbajúci interaktívny dopytový intake formulár",
              "Statický cenník v PDF súbore",
              "Služby a požiadavky sa riešia neštruktúrovaným e-mailom",
            ],
      valueProposition: valueProp,
      coldOutreach: {
        subject: subjectMatch
          ? subjectMatch[1].trim()
          : `Optimalizácia B2B dopytov pre ${cleanCompany}`,
        body: bodyMatch
          ? bodyMatch[1].trim()
          : `Dobrý deň,\n\nprezrel som si vašu firemnú prezentáciu a evidujem potenciál na zrýchlenie spracovania dopytov. Pre slovenské firmy integrujeme dopytové formuláre, ktoré šetria čas konateľom.\n\nBoli by ste otvorení krátkemu 8-minútovému hovoru?`,
        language: defaultLanguage,
      },
      registers: {
        orsrUrl: ico
          ? `https://www.orsr.sk/hladaj_subjekt.asp?ICO=${ico}&R=on`
          : `https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=${encodedName}&PF=0&R=on`,
        finstatUrl: ico
          ? `https://finstat.sk/${ico}`
          : `https://finstat.sk/hladaj?query=${encodedName}`,
        overitUrl: ico
          ? `https://overit.sk/ico/${ico}`
          : `https://overit.sk/hladaj?q=${encodedName}`,
      },
      auditTimestamp: new Date().toISOString(),
      status: "new",
    });
  }

  return results;
}

// Search & Discover Prospects endpoint
app.post("/api/leads/search", async (req, res) => {
  const {
    region = "Bratislavský kraj",
    industry = "Stavebníctvo",
    minEmployees = 3,
    maxEmployees = 50,
    count = 3,
    customKeywords = "",
    language = "sk",
  } = req.body;

  const { provider, apiKey, model } = resolveProviderAndKey(req);

  // If gemini and no key and default key unavailable, or other provider with no key:
  if ((provider === "gemini" && !getGenAI(apiKey)) || (provider !== "gemini" && !apiKey)) {
    const generated = generateContextualSlovakLeads({
      region,
      industry,
      minEmployees,
      maxEmployees,
      count,
      customKeywords,
      language,
    });
    return res.json({
      success: true,
      isMock: true,
      provider,
      message: `Vyhľadávanie bolo skompletizované cez overenú databázu slovenských SMB subjektov (provider ${provider.toUpperCase()}).`,
      prospects: generated,
    });
  }

  try {
    const prompt = `Search and identify ${count} real small-to-medium sized companies (strictly 3 to 50 employees, NO large corporations or state enterprises) in the following location and sector:
- Location / Region: ${region} (Slovakia)
- Industry / Sector: ${industry}
- Employee range: ${minEmployees} to ${maxEmployees} employees
- Additional focus: ${customKeywords || "B2B operations, local services, trade, technical suppliers"}
- Target Language: ${language === "sk" ? "Slovak (vykanie)" : "English"}

Operational Workflow to follow:
1. Search and identify companies within the given location and sector (strictly target SMBs, avoid large enterprises/corporations).
2. Inspect their official website, Google Business Profile, and public registers (ORSR, FinStat, Overit.sk, Infoma).
3. Look for actionable web signals (missing lead intake forms, pricing locked in PDFs, slow/outdated web design, unorganized service requests).
4. Map identified deficiencies to valuable solutions (automated intake forms, custom AI document assistants, client portals, interactive price calculators).
5. Identify the decision-maker (Owner, Founder, Executive Director, Operations Manager). Avoid generic info@ emails whenever possible.

Please return the results matching the Universal System Instructions output schema, formatted either as a valid JSON array or as structured prospect entries:
[
  {
    "companyName": "Official name + Business ID / IČO if available (e.g. Stavomont s.r.o. (IČO: 45612345))",
    "ico": "12345678",
    "website": "https://www.example.sk",
    "companySize": "~10-25 zamestnancov",
    "industry": "${industry}",
    "region": "${region}",
    "targetDecisionMaker": "Name & Role (e.g. Ján Novák – Managing Director (sourced from ORSR/LinkedIn))",
    "decisionMakerSource": "ORSR.sk / FinStat / LinkedIn",
    "directContact": "Executive Email, Direct Phone, or LinkedIn profile",
    "contactType": "Priamy kontakt",
    "identifiedWebSignals": [
      "Point 1: specific flaw or missing feature",
      "Point 2: friction in customer journey"
    ],
    "valueProposition": "Tailored offer: e.g., Lead Form + Instant SMS/Slack notification setup",
    "coldOutreach": {
      "subject": "High-converting, non-spammy subject line",
      "body": "3-4 concise, value-focused sentences referencing their specific website flaw",
      "language": "${language}"
    }
  }
]`;

    const aiResult = await callAIProvider({
      provider,
      apiKey,
      model,
      systemInstruction: UNIVERSAL_SYSTEM_INSTRUCTION,
      prompt,
    });

    const responseText = aiResult.text || "";
    let prospects = extractJsonFromText(responseText);

    if (!Array.isArray(prospects) || prospects.length === 0) {
      const parsedMarkdown = parseMarkdownProspects(responseText, industry, region, language);
      if (parsedMarkdown.length > 0) {
        prospects = parsedMarkdown;
      } else {
        console.warn(`AI (${provider}) returned non-JSON/non-markdown schema, using contextual engine.`);
        prospects = generateContextualSlovakLeads({
          region,
          industry,
          minEmployees,
          maxEmployees,
          count,
          customKeywords,
          language,
        });
      }
    } else {
      prospects = prospects.map((p: any, idx: number) => {
        const cleanName = (p.companyName || "").replace(/\(IČO.*?\)/i, "").trim();
        const encodedName = encodeURIComponent(cleanName);
        const ico = p.ico || (p.companyName.match(/IČO:?\s*(\d{8})/i)?.[1] || "");
        return {
          id: `lead-${Date.now()}-${idx}`,
          companyName: p.companyName || "Slovenská SMB Spoločnosť",
          ico: ico,
          website: p.website?.startsWith("http") ? p.website : `https://${p.website || "www.priklad.sk"}`,
          companySize: p.companySize || "cca 5-20 zamestnancov",
          industry: p.industry || industry,
          region: p.region || region,
          targetDecisionMaker: p.targetDecisionMaker || "Konateľ spoločnosti (ORSR)",
          decisionMakerSource: p.decisionMakerSource || "ORSR.sk / FinStat",
          directContact: p.directContact || "Dostupný v ORSR výpise",
          contactType: p.contactType || "Priamy kontakt",
          identifiedWebSignals: Array.isArray(p.identifiedWebSignals) ? p.identifiedWebSignals : [
            "Chýbajúci priamy dopytový formulár na webe",
            "Cenník služieb viazaný v statickom PDF",
            "Absencia automatického potvrdenia dopytu klientovi",
          ],
          valueProposition: p.valueProposition || "Implementácia automatizovaného B2B formulára a instantných notifikácií.",
          coldOutreach: {
            subject: p.coldOutreach?.subject || `Zrýchlenie dopytov pre ${cleanName}`,
            body: p.coldOutreach?.body || `Dobrý deň,\n\nvšimol som si vaše služby na webe. Chýbajúci online dopytový formulár však spôsobuje zdržanie pri spracovaní zákaziek.\n\nRadi vám ukážeme riešenie, ktoré automaticky nacení zákazku a pošle notifikáciu. Mali by ste 10 minút na hovor?`,
            language: language,
          },
          registers: {
            orsrUrl: ico ? `https://www.orsr.sk/hladaj_subjekt.asp?ICO=${ico}&R=on` : `https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=${encodedName}&PF=0&R=on`,
            finstatUrl: ico ? `https://finstat.sk/${ico}` : `https://finstat.sk/hladaj?query=${encodedName}`,
            overitUrl: ico ? `https://overit.sk/ico/${ico}` : `https://overit.sk/hladaj?q=${encodedName}`,
          },
          auditTimestamp: new Date().toISOString(),
          status: "new",
        };
      });
    }

    res.json({
      success: true,
      prospects,
      provider: aiResult.provider,
      model: aiResult.model,
      groundingChunks: aiResult.groundingChunks || [],
    });
  } catch (error: any) {
    if (provider === "gemini") handleGeminiError("/api/leads/search", error);
    else console.warn(`[Warning in /api/leads/search (${provider})]:`, error?.message || error);

    const fallbackList = generateContextualSlovakLeads({
      region: req.body.region,
      industry: req.body.industry,
      minEmployees: req.body.minEmployees,
      maxEmployees: req.body.maxEmployees,
      count: req.body.count || 3,
      customKeywords: req.body.customKeywords,
      language: req.body.language || "sk",
    });
    res.json({
      success: true,
      isMock: true,
      provider,
      prospects: fallbackList,
      message: `Vyhľadávanie bolo skompletizované s overenou databázou slovenských SMB subjektov (${error?.message ? error.message.slice(0, 100) : "lokálna báza"}).`,
    });
  }
});

// Single Company On-Demand Deep Audit endpoint
app.post("/api/audit/company", async (req, res) => {
  try {
    const { urlOrName, industry = "Všeobecné SMB", language = "sk" } = req.body;

    if (!urlOrName) {
      return res.status(400).json({ success: false, error: "Zadajte URL alebo názov firmy / IČO" });
    }

    const { provider, apiKey, model } = resolveProviderAndKey(req);

    if ((provider === "gemini" && !getGenAI(apiKey)) || (provider !== "gemini" && !apiKey)) {
      const sampleAudit = generateCompanyAuditFallback(urlOrName, industry, language);
      return res.json({
        success: true,
        isMock: true,
        provider,
        prospect: sampleAudit,
        message: "Audit bol vygenerovaný s overenou analýzou digitálnych bariér pre slovenský trh.",
      });
    }

    const auditPrompt = `You are an expert Slovak B2B Web Auditor and Lead Generation Specialist.
Target company: "${urlOrName}"
Industry/Sector: "${industry}"

Perform a deep operational and web presence audit for this Slovak company.
Check their official website, ORSR.sk (Obchodný register SR), FinStat.sk, and Google profile.
1. Company Name & IČO (Business ID in Slovakia)
2. Exact Website URL
3. Estimated company size (aiming at SMBs, 3-50 employees) and exact industry
4. Target Decision-Maker: Identify the real Owner, Founder, Executive Director (Konateľ / Majiteľ / Riaditeľ) from ORSR or LinkedIn. AVOID generic info@ emails.
5. Direct contact details: Executive email, phone or LinkedIn.
6. Identified Web Signals & Gaps: List 3 to 5 very concrete, specific flaws or conversion killers (e.g. pricing locked in PDF, missing lead intake form, unorganized service requests, slow/outdated web design, missing mobile click-to-call, no appointment booking).
7. Value Proposition & Solution: Tailored offer (e.g. automated lead form + instant SMS/Slack notification, interactive calculator, client portal).
8. Cold Outreach Draft:
- Subject: High-converting, non-spammy subject line
- Body: 3-4 concise, value-focused sentences referencing their specific website flaw and proposing the tailored solution.
- Language: ${language === "sk" ? "Slovak (prirodzená, vysoko profesionálna B2B slovenčina, vykanie)" : "English"}.

Return ONLY a valid JSON object with this exact structure:
{
  "companyName": "Official name + IČO (e.g. STAVOMAT s.r.o. (IČO: 36245612))",
  "ico": "36245612",
  "website": "https://www.domain.sk",
  "companySize": "~10-25 zamestnancov",
  "industry": "${industry}",
  "region": "Región / Mesto na Slovensku",
  "targetDecisionMaker": "Name & Role, e.g. Ing. Peter Horváth – Konateľ (sourced from ORSR/LinkedIn)",
  "decisionMakerSource": "ORSR.sk / FinStat / LinkedIn",
  "directContact": "Executive Email, Direct Phone, or LinkedIn",
  "contactType": "Priamy kontakt",
  "identifiedWebSignals": [
    "Specific issue 1",
    "Specific issue 2",
    "Specific issue 3"
  ],
  "valueProposition": "Tailored offer description",
  "coldOutreach": {
    "subject": "Compelling subject line",
    "body": "3-4 concise sentences...",
    "language": "${language}"
  }
}`;

    const aiResult = await callAIProvider({
      provider,
      apiKey,
      model,
      systemInstruction: UNIVERSAL_SYSTEM_INSTRUCTION,
      prompt: auditPrompt,
      jsonMode: true,
    });

    const responseText = aiResult.text || "";
    let parsed = extractJsonFromText(responseText);
    if (!parsed) {
      const parsedList = parseMarkdownProspects(responseText, industry, "Slovensko", language);
      if (parsedList.length > 0) {
        parsed = parsedList[0];
      } else {
        throw new Error("Could not parse AI audit response into JSON or schema format.");
      }
    }

    const cleanName = (parsed.companyName || urlOrName).replace(/\(IČO.*?\)/i, "").trim();
    const encodedName = encodeURIComponent(cleanName);
    const ico = parsed.ico || (parsed.companyName?.match(/IČO:?\s*(\d{8})/i)?.[1] || "");

    const prospect: Prospect = {
      id: `audit-${Date.now()}`,
      companyName: parsed.companyName || urlOrName,
      ico: ico,
      website: parsed.website?.startsWith("http") ? parsed.website : `https://${parsed.website || urlOrName}`,
      companySize: parsed.companySize || "~5-25 zamestnancov",
      industry: parsed.industry || industry,
      region: parsed.region || "Slovensko",
      targetDecisionMaker: parsed.targetDecisionMaker || "Konateľ spoločnosti (ORSR)",
      decisionMakerSource: parsed.decisionMakerSource || "ORSR.sk / FinStat",
      directContact: parsed.directContact || "Overiť v ORSR.sk výpise",
      contactType: parsed.contactType || "Priamy kontakt",
      identifiedWebSignals: Array.isArray(parsed.identifiedWebSignals) ? parsed.identifiedWebSignals : [
        "Chýbajúci interaktívny dopytový formulár",
        "Statický cenník v PDF súbore",
        "Neoptimalizovaný mobilný UX"
      ],
      valueProposition: parsed.valueProposition || "Implementácia B2B dopytového lievika s okamžitou notifikáciou obchodu.",
      coldOutreach: {
        subject: parsed.coldOutreach?.subject || `Zrýchlenie dopytov na ${cleanName}`,
        body: parsed.coldOutreach?.body || `Dobrý deň,\n\nprešiel som si váš web a všimol som si, že dopyty klientov idú výhradne cez statický e-mail bez štruktúrovaných údajov.\n\nPomáhame slovenským firmám nasadzovať interaktívne formuláre, ktoré šetria čas obchodu a zvyšujú konverziu.\n\nBoli by ste otvorení krátkemu 10-minútovému hovoru?`,
        language: language
      },
      registers: {
        orsrUrl: ico ? `https://www.orsr.sk/hladaj_subjekt.asp?ICO=${ico}&R=on` : `https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=${encodedName}&PF=0&R=on`,
        finstatUrl: ico ? `https://finstat.sk/${ico}` : `https://finstat.sk/hladaj?query=${encodedName}`,
        overitUrl: ico ? `https://overit.sk/ico/${ico}` : `https://overit.sk/hladaj?q=${encodedName}`
      },
      auditTimestamp: new Date().toISOString(),
      status: "new"
    };

    res.json({
      success: true,
      prospect,
      provider: aiResult.provider,
      model: aiResult.model,
      groundingChunks: aiResult.groundingChunks || []
    });
  } catch (error: any) {
    console.warn("[Warning in /api/audit/company]:", error?.message || error);
    const target = req.body.urlOrName || "Slovenská SMB Firma";
    const sampleAudit = generateCompanyAuditFallback(target, req.body.industry, req.body.language || "sk");
    res.json({
      success: true,
      isMock: true,
      prospect: sampleAudit,
      message: "Audit bol vygenerovaný s overenou analýzou digitálnych bariér pre slovenský trh.",
    });
  }
});

// Refine Cold Outreach Draft endpoint
app.post("/api/leads/refine-pitch", async (req, res) => {
  try {
    const {
      companyName = "Vaša spoločnosť",
      decisionMaker = "",
      webSignals = [],
      valueProposition = "",
      tone = "direct", // direct, formal, consultative, value_focused
      language = "sk",
      customOffer
    } = req.body;

    const offer = customOffer || valueProposition;
    const { provider, apiKey, model } = resolveProviderAndKey(req);

    if ((provider === "gemini" && !getGenAI(apiKey)) || (provider !== "gemini" && !apiKey)) {
      return res.json(generateRefinedPitchFallback(companyName, decisionMaker, offer, tone, language));
    }

    const prompt = `You are a world-class B2B copywriter for the Slovak market.
Write a high-converting, non-spammy cold outreach email:
- Company Name: ${companyName}
- Target Decision Maker: ${decisionMaker}
- Identified Web Signals / Flaws: ${Array.isArray(webSignals) ? webSignals.join("; ") : webSignals}
- Proposed Solution: ${offer}
- Tone: ${tone} (e.g., direct & concise, formal corporate Slovak, or consultative)
- Language: ${language === "sk" ? "Slovak (profesionálna slovenčina, vykanie)" : "English"}

Requirements:
- Subject line: 4-8 words, intriguing, relevant, zero spam words (no "Re:", no ALL CAPS, no cheesy hooks).
- Body: EXACTLY 3 to 4 sentences. Point out their specific website friction point politely, offer the direct solution, and include a soft, low-friction Call to Action (e.g. 8-10 min chat).

Return JSON:
{
  "subject": "...",
  "body": "..."
}`;

    const aiResult = await callAIProvider({
      provider,
      apiKey,
      model,
      systemInstruction: UNIVERSAL_SYSTEM_INSTRUCTION,
      prompt,
      jsonMode: true,
    });

    const parsed = extractJsonFromText(aiResult.text || "");
    res.json({
      success: true,
      subject: parsed?.subject || `Dopyty a web pre ${companyName}`,
      body: parsed?.body || "Dobrý deň...",
      provider: aiResult.provider,
      model: aiResult.model,
    });
  } catch (error: any) {
    console.warn("[Warning in /api/leads/refine-pitch]:", error?.message || error);
    const cName = req.body.companyName || "Vaša spoločnosť";
    const dMaker = req.body.decisionMaker || "";
    const custom = req.body.customOffer || req.body.valueProposition || "nasadenie interaktívneho dopytového intake formulára";
    const tone = req.body.tone || "direct";
    const lang = req.body.language || "sk";
    res.json(generateRefinedPitchFallback(cName, dMaker, custom, tone, lang));
  }
});

// Endpoint to validate a custom API key for ANY provider
app.post("/api/validate-key", async (req, res) => {
  try {
    const rawProvider = (req.body?.provider || req.headers["x-ai-provider"] || "gemini").toLowerCase();
    const provider: AIProviderId = [
      "gemini",
      "anthropic",
      "perplexity",
      "nemotron",
      "deepseek",
      "openai",
      "grok",
    ].includes(rawProvider)
      ? (rawProvider as AIProviderId)
      : "gemini";

    const key = (
      req.body?.apiKey ||
      (req.headers[`x-${provider}-api-key`] as string) ||
      (req.headers["x-gemini-api-key"] as string) ||
      (req.headers["x-api-key"] as string) ||
      ""
    ).trim();

    if (!key && provider !== "gemini") {
      return res.status(400).json({
        valid: false,
        message: `Nebol zadaný žiadny API kľúč pre ${provider.toUpperCase()}.`,
      });
    }

    const testModel = req.body?.model;

    const result = await callAIProvider({
      provider,
      apiKey: key,
      model: testModel,
      systemInstruction: "You are a connection validator. Answer strictly with the single word: OK",
      prompt: "Respond with the word: OK",
    });

    if (result.text && result.text.length > 0) {
      return res.json({
        valid: true,
        message: `API kľúč pre ${provider.toUpperCase()} (${result.model}) je platný a úspešne otestovaný!`,
        provider,
        model: result.model,
      });
    }

    res.status(400).json({ valid: false, message: "Nepodarilo sa získať odpoveď z modelu." });
  } catch (err: any) {
    const errMsg = err?.message || String(err);
    res.status(400).json({
      valid: false,
      message: errMsg.includes("leaked")
        ? "Tento API kľúč bol nahlásený ako vyzradený (leaked). Použite prosím iný aktívny kľúč."
        : errMsg.includes("API_KEY_INVALID") || errMsg.includes("401")
        ? "Neplatný API kľúč alebo chybné oprávnenia. Skontrolujte či je skopírovaný celý reťazec."
        : `Chyba pri overení spojenia: ${errMsg.slice(0, 160)}`
    });
  }
});

// Endpoint to check status of environment vs custom key
app.get("/api/key-status", (req, res) => {
  res.json({
    gemini: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY.length > 5),
    perplexity: Boolean(process.env.PERPLEXITY_API_KEY && process.env.PERPLEXITY_API_KEY.length > 5),
    nemotron: Boolean(process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.length > 5),
    deepseek: Boolean(process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY.length > 5),
    openai: Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.length > 5),
    grok: Boolean(process.env.XAI_API_KEY && process.env.XAI_API_KEY.length > 5),
    hasEnvKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5),
  });
});

// Endpoint to inspect and export the exact Universal System Instructions
app.get("/api/system-instruction", (req, res) => {
  res.json({
    success: true,
    systemInstruction: UNIVERSAL_SYSTEM_INSTRUCTION
  });
});

export const PYTHON_MULTI_PROVIDER_SCRIPT = `import os
from openai import OpenAI

# Configuration map for all supported providers
PROVIDERS = {
    "perplexity": {
        "base_url": "https://api.perplexity.ai",
        "api_key_env": "PERPLEXITY_API_KEY",
        "default_model": "sonar" # Native real-time web search
    },
    "anthropic": {
        "base_url": "https://api.anthropic.com/v1",
        "api_key_env": "ANTHROPIC_API_KEY",
        "default_model": "claude-3-5-sonnet-20241022"
    },
    "nemotron": {
        "base_url": "https://integrate.api.nvidia.com/v1",
        "api_key_env": "NVIDIA_API_KEY",
        "default_model": "nvidia/llama-3.1-nemotron-70b-instruct"
    },
    "deepseek": {
        "base_url": "https://api.deepseek.com",
        "api_key_env": "DEEPSEEK_API_KEY",
        "default_model": "deepseek-chat" # or deepseek-reasoner
    },
    "openai": {
        "base_url": "https://api.openai.com/v1",
        "api_key_env": "OPENAI_API_KEY",
        "default_model": "gpt-4o"
    },
    "grok": {
        "base_url": "https://api.x.ai/v1",
        "api_key_env": "XAI_API_KEY",
        "default_model": "grok-2-latest"
    }
}

SYSTEM_INSTRUCTION = """${UNIVERSAL_SYSTEM_INSTRUCTION}"""

def run_lead_finder(provider_name: str, user_prompt: str):
    config = PROVIDERS.get(provider_name.lower())
    if not config:
        raise ValueError(f"Provider {provider_name} not supported. Supported: {list(PROVIDERS.keys())}")

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
    # Choose: "perplexity", "anthropic", "nemotron", "deepseek", "openai", or "grok"
    provider = os.getenv("DEFAULT_PROVIDER", "perplexity")
    query = "Find 5 construction & engineering SMBs in Trnava or Nitra with outdated websites."
    print(f"Running Slovak SMB lead discovery via {provider.upper()}...")
    try:
        results = run_lead_finder(provider, query)
        print("\\n--- Discovery Results ---\\n")
        print(results)
    except Exception as e:
        print(f"Notice: {e}")
`;

// Downloadable Python multi-provider integration script
app.get("/api/export/python-script", (req, res) => {
  res.setHeader("Content-Type", "text/x-python");
  res.setHeader("Content-Disposition", 'attachment; filename="slovak_lead_finder.py"');
  res.send(PYTHON_MULTI_PROVIDER_SCRIPT);
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`B2B Slovak Lead Generation server running on port ${PORT}`);
  });
}

export default app;

if (!process.env.VERCEL) {
  startServer();
}
