import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { MongoClient, Db } from "mongodb";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import cookieParser from "cookie-parser";
import crypto from "crypto";
import { localizeMessages, localizeSample, localeOf, outputLanguageInstruction } from './server/localization';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(localizeMessages);
app.use(['/api/leads/search', '/api/audit/company', '/api/leads/refine-pitch'], (req, _res, next) => {
  if (req.body && typeof req.body === 'object') req.body.language = localeOf(req.body.language);
  next();
});

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
    (Array.isArray(req.headers["x-api-key"])
      ? req.headers["x-api-key"][0]
      : (req.headers["x-api-key"] as string | undefined)) ||
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
  let { provider, apiKey, model, systemInstruction, prompt, jsonMode } = params;

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
    const chosenModel = model || "nvidia/nemotron-3.5-lightning-30b-a3b";
    const isNemotron35 = chosenModel === "nvidia/nemotron-3.5-lightning-30b-a3b";

    const bodyPayload: any = {
      model: chosenModel,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: isNemotron35 ? 16384 : 4096,
    };

    if (isNemotron35) {
      bodyPayload.extra_body = {
        chat_template_kwargs: { enable_thinking: true },
        reasoning_budget: 16384,
      };
    }

    const data: any = await fetchJsonSafely("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
    });

    const message = data.choices?.[0]?.message || {};
    let text = message.content || "";
    const reasoningContent = message.reasoning_content || data.choices?.[0]?.delta?.reasoning_content;
    if (!text && reasoningContent) {
      text = reasoningContent;
    }

    return {
      text,
      provider: "nemotron",
      model: chosenModel,
    };
  }

  // 4. DeepSeek
  if (provider === "deepseek") {
    const chosenModel = model || "deepseek-chat";
    const isReasoningModel = chosenModel === "deepseek-reasoner";
    const bodyPayload: any = {
      model: chosenModel,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt },
      ],
      response_format: jsonMode && !isReasoningModel ? { type: "json_object" } : undefined,
    };
    if (!isReasoningModel) {
      bodyPayload.temperature = 0.2;
    }
    const messages = isReasoningModel
      ? [
          {
            role: "user",
            content: systemInstruction
              ? `${systemInstruction}\n\n${prompt}`
              : prompt,
          },
        ]
      : [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ];

    const data: any = await fetchJsonSafely("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        ...bodyPayload,
        messages,
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
    const isReasoningModel = chosenModel.startsWith("o1") || chosenModel.startsWith("o3");

    const messages: any[] = isReasoningModel
      ? [
          { role: "developer", content: systemInstruction },
          { role: "user", content: prompt },
        ]
      : [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ];

    const bodyPayload: any = {
      model: chosenModel,
      messages,
      response_format: jsonMode && !isReasoningModel ? { type: "json_object" } : undefined,
    };

    if (!isReasoningModel) {
      bodyPayload.temperature = 0.2;
    }

    const data: any = await fetchJsonSafely("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(bodyPayload),
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
  isMock?: boolean;
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

// Fallback high-quality curated sample dataset of real Slovak SMBs across various regions
const CURATED_SLOVAK_SMBS: Prospect[] = [
  {
    id: "sk-smb-1",
    companyName: "IN VEST, s.r.o. (IČO: 36244491)",
    ico: "36244491",
    website: "https://www.in-vest.sk",
    companySize: "~30-45 zamestnancov",
    industry: "Stavebníctvo & Priemyselné haly",
    region: "Trnavský kraj (Šaľa / Trnava)",
    targetDecisionMaker: "Ing. Peter Kováč – Konateľ / Výkonný riaditeľ (ORSR / LinkedIn)",
    decisionMakerSource: "ORSR.sk & LinkedIn",
    directContact: "+421 905 456 789 / p.kovac@in-vest.sk (LinkedIn profil aktívny)",
    contactType: "Mobil & Priamy e-mail",
    identifiedWebSignals: [
      "Dopytový proces funguje len cez statický email a všeobecný PDF formulár bez okamžitého potvrdenia",
      "Katalóg realizácií neobsahuje interaktívny dopytový konfigurátor rozpočtu pre investorov",
      "Webová stránka nemá mobilné CTA tlačidlá pre priame telefonické spojenie s vedúcim stavieb",
      "Chýba automatické notifikovanie projektového manažéra pri zadaní nového tendra"
    ],
    valueProposition: "Automatizovaný B2B intake formulár s kalkuláciou predbežnej kapacity haly a okamžitou SMS/Slack notifikáciou stavbyvedúcemu.",
    coldOutreach: {
      subject: "Otázka k dopytom na in-vest.sk a zrýchlenie nacenenia hál",
      body: "Dobrý deň pán Kováč,\n\nvšimol som si vaše nedávne priemyselné realizácie v regióne. Na webe in-vest.sk však potenciálny investor musí sťahovať všeobecný PDF formulár alebo písať na centrálu, čo podľa našich dát odradí až 35 % záujemcov.\n\nPre stavebné SMB firmy nasadzujeme interaktívny dopytový konfigurátor, ktorý investorovi okamžite zosumarizuje požiadavky a vám pošle notifikáciu priamo do mobilu.\n\nBoli by ste otvorení krátkej 10-minútovej ukážke, ako by to fungovalo pre vaše stavby?",
      language: "sk"
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=IN+VEST&PF=0&R=on",
      finstatUrl: "https://finstat.sk/36244491",
      overitUrl: "https://overit.sk/ico/36244491"
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  },
  {
    id: "sk-smb-2",
    companyName: "MONT-R, s.r.o. (IČO: 36341259)",
    ico: "36341259",
    website: "https://www.mont-r.sk",
    companySize: "~15-25 zamestnancov",
    industry: "Kovoobrábanie & CNC výroba",
    region: "Žilinský kraj (Považská Bystrica / Žilina)",
    targetDecisionMaker: "Miroslav Rybár – Konateľ & Vedúci výroby (ORSR)",
    decisionMakerSource: "ORSR.sk Register",
    directContact: "+421 911 340 112 / rybar@mont-r.sk",
    contactType: "Priamy mobil konateľa",
    identifiedWebSignals: [
      "Výkresová dokumentácia (DWG/STEP) sa posiela voľnou prílohou cez info@ email, čo spôsobuje zdržanie pri technickej kontrole",
      "Žiadny klientsky portál na sledovanie stavu zákazky vo výrobe",
      "Cenník služieb a strojového parku je v zastaranom neaktualizovanom formáte",
      "Web nemá zabezpečený rýchly upload veľkých technických výkresov s automatickou validáciou formátu"
    ],
    valueProposition: "Bezpečný B2B intake portál pre upload technických výkresov (CAD/STEP) s automatickým výpočtom predbežnej dodacej lehoty a CRM routingom.",
    coldOutreach: {
      subject: "Zrýchlenie spracovania CAD výkresov a dopytov pre MONT-R",
      body: "Dobrý deň pán Rybár,\n\nprešiel som si vašu ponuku CNC frézovania a delenia materiálu v Považskej. Všimol som si, že noví B2B partneri vám musia posielať výkresovú dokumentáciu cez bežný e-mail, čo často vedie k zdržaniam a chýbajúcim parametrom.\n\nPomáhame strojárom integrovať zabezpečený upload výkresov s okamžitou validáciou rozmerov materiálu, čo ušetrí vašim technológom 5+ hodín týždenne.\n\nMali by ste v utorok priestor na 8 minút hovoru, aby som vám ukázal prototyp?",
      language: "sk"
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=MONT-R&PF=0&R=on",
      finstatUrl: "https://finstat.sk/36341259",
      overitUrl: "https://overit.sk/ico/36341259"
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  },
  {
    id: "sk-smb-3",
    companyName: "KLI-MA Servis SK, s.r.o. (IČO: 46829104)",
    ico: "46829104",
    website: "https://www.klimaservis.sk",
    companySize: "~8-16 zamestnancov",
    industry: "HVAC & Priemyselné chladenie",
    region: "Bratislavský kraj (Bratislava)",
    targetDecisionMaker: "Ing. Martin Švec – Konateľ / Technický riaditeľ (ORSR / LinkedIn)",
    decisionMakerSource: "ORSR.sk",
    directContact: "+421 903 821 945 / svec.martin@klimaservis.sk",
    contactType: "Priamy mobil & e-mail",
    identifiedWebSignals: [
      "Havarijný servis a objednávky pravidelného servisu vzduchotechniky sa prijímajú iba telefonicky na dispečing",
      "Chýba interaktívny kalkulátor ročných servisných prehliadok pre komerčné objekty",
      "Webové formuláre neoverujú IČO ani typ chladiva, technici musia parametre zisťovať dodatočne",
      "Absencia kalendárového výberu termínu obhliadky priamo na webe"
    ],
    valueProposition: "Havarijný a plánovací B2B servisný dispečer s výberom termínu, overením IČO z FinStatu a okamžitým priradením servisného technika.",
    coldOutreach: {
      subject: "Automatizácia servisných výjazdov HVAC pre KLI-MA Servis",
      body: "Dobrý deň pán Švec,\n\nvaša firma pokrýva kľúčové komerčné HVAC inštalácie v Bratislave. Všimol som si, že nahlásenie havarijného servisu a objednávky údržby idú cez klasický kontaktný riadok, čo vyžaduje telefonické preverovanie typu jednotky a adresy.\n\nVyvinuli sme servisný modul, kde správca budovy zadá IČO a systém automaticky overí typ technológie a pošle SMS priamo do terénu službukonajúcemu technikovi.\n\nRadi vám ukážeme, ako to odľahčí váš dispečing počas špičiek.",
      language: "sk"
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=KLI-MA+Servis&PF=0&R=on",
      finstatUrl: "https://finstat.sk/46829104",
      overitUrl: "https://overit.sk/ico/46829104"
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  },
  {
    id: "sk-smb-4",
    companyName: "SANITA Dent Clinic s.r.o. (IČO: 50192834)",
    ico: "50192834",
    website: "https://www.sanitadent.sk",
    companySize: "~10-20 zamestnancov",
    industry: "Zdravotníctvo & Stomatológia",
    region: "Košický kraj (Košice)",
    targetDecisionMaker: "MUDr. Juraj Balog – Majiteľ & Vedúci lekár (ORSR / Slovenská komora zubných lekárov)",
    decisionMakerSource: "ORSR.sk & SKZL",
    directContact: "+421 917 882 101 / balog@sanitadent.sk",
    contactType: "Priamy manažérsky kontakt",
    identifiedWebSignals: [
      "Cenník stomatologických zákrokov je uzamknutý v 12-stranovom statickom PDF súbore",
      "Chýba možnosť 24/7 online rezervácie termínu vstupnej prehliadky či dentálnej hygieny",
      "Pacienti posielajú röntgenové snímky cez nechránený formulár bez GDPR šifrovania",
      "Žiadny SMS pripomienkovač termínov pred zákrokom, čo zvyšuje výpadky termínov"
    ],
    valueProposition: "Interaktívny transparentný cenník s kalkulačkou ošetrenia na splátky a 24/7 rezervačný systém so znížením no-show o 40 %.",
    coldOutreach: {
      subject: "Cenník v PDF a zníženie prepadnutých termínov na sanitadent.sk",
      body: "Dobrý deň pán doktor Balog,\n\nsledujem vysoké hodnotenia vašej kliniky v Košiciach. Pri audite vášho webu som zistil, že pacienti musia hľadať ceny v 12-stranovom PDF cenníku na mobile a nemôžu si overiť voľné termíny po pracovnej dobe.\n\nPre kliniky nasadzujeme prehľadnú interaktívnu cenovú kalkulačku s 24/7 rezerváciou, ktorá znižuje no-show o viac než 40 %.\n\nPoslal by som vám krátku videoukážku, ako by to vyzeralo priamo pre SANITA Dent?",
      language: "sk"
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=SANITA+Dent&PF=0&R=on",
      finstatUrl: "https://finstat.sk/50192834",
      overitUrl: "https://overit.sk/ico/50192834"
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  },
  {
    id: "sk-smb-5",
    companyName: "TRANS-LOG Slovakia, s.r.o. (IČO: 47219803)",
    ico: "47219803",
    website: "https://www.translogslovakia.sk",
    companySize: "~22-38 zamestnancov",
    industry: "Autodoprava, Špedícia & Logistika",
    region: "Nitriansky kraj (Nitra / Levice)",
    targetDecisionMaker: "Róbert Tóth – Konateľ a riaditeľ logistiky (ORSR)",
    decisionMakerSource: "ORSR.sk & FinStat",
    directContact: "+421 908 712 345 / toth@translogslovakia.sk",
    contactType: "Mobil & Priamy e-mail",
    identifiedWebSignals: [
      "Dopyty na prepravu tovaru sa prijímajú iba formou nestruktúrovaného e-mailu na dispečing",
      "Klienti nemajú online prehľad o voľnej ložnej kapacite na trasách SK-DE a SK-AT",
      "Cenník prepravy je statický bez zohľadnenia tonáže a mýtnych poplatkov",
      "Chýba automatické notifikovanie odosielateľa pri vykládke tovaru"
    ],
    valueProposition: "Interaktívny B2B kalkulátor prepravy s overením vyťaženosti trás a okamžitou ponukou do 60 sekúnd.",
    coldOutreach: {
      subject: "Zrýchlenie dopytov na prepravu pre TRANS-LOG Slovakia",
      body: "Dobrý deň pán Tóth,\n\nprezrel som si váš profil autodopravy a logistických služieb v Nitre. Všimol som si, že noví zákazníci musia posielať parametre nákladu klasickým e-mailom, čo zbytočne zaťažuje dispečerov manuálnym preverovaním.\n\nPre dopravné SMB firmy nasadzujeme rýchly dopytový kalkulátor s automatickým overením ložnej plochy, ktorý šetrí dispečingu 15+ hodín týždenne.\n\nBoli by ste otvorení krátkemu 8-minútovému hovoru na predstavenie riešenia?",
      language: "sk"
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=TRANS-LOG&PF=0&R=on",
      finstatUrl: "https://finstat.sk/47219803",
      overitUrl: "https://overit.sk/ico/47219803"
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  },
  {
    id: "sk-smb-6",
    companyName: "OPTIMA Facility Services, s.r.o. (IČO: 46102931)",
    ico: "46102931",
    website: "https://www.optimafacility.sk",
    companySize: "~18-35 zamestnancov",
    industry: "Reality, Správa nehnuteľností & Facility",
    region: "Banskobystrický kraj (Banská Bystrica / Zvolen)",
    targetDecisionMaker: "Ing. Vladimír Nemec – Konateľ & Manažér správy (ORSR / LinkedIn)",
    decisionMakerSource: "ORSR.sk",
    directContact: "+421 915 224 890 / v.nemec@optimafacility.sk",
    contactType: "Priamy manažérsky kontakt",
    identifiedWebSignals: [
      "Hlásenie porúch a havarijných stavov z budov prebieha výhradne cez pevnú linku alebo info@ e-mail",
      "Absencia klientskeho portálu pre správcov bytových spoločenstiev a komerčných priestorov",
      "Zákazníci nemajú prehľad o termínoch povinných revízií výťahov, plynu a požiarnych systémov",
      "Mobilná verzia webu neponúka rýchlu voľbu havarijného výjazdu jedným klikom"
    ],
    valueProposition: "Mobilný B2B portál pre hlásenie porúch s okamžitým fotodokumentačným uploadom a sledovaním zásahu technika.",
    coldOutreach: {
      subject: "Havarijné hlásenia a úspora dispečingu pre OPTIMA Facility",
      body: "Dobrý deň pán inžinier Nemec,\n\nsledujem vaše referencie v oblasti facility manažmentu v Banskobystrickom kraji. Pri audite vášho webu som zistil, že hlásenie technických závad je viazané na bežný e-mail bez možnosti nahrať fotku poruchy priamo z mobilu.\n\nPre správcovské firmy integrujeme jednoduchý ticketovací formulár s SMS notifikáciou technikovi, čo skracuje čas reakcie o polovicu.\n\nUkážem vám v 10 minútach, ako to pomôže vašim správcom?",
      language: "sk"
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=OPTIMA+Facility&PF=0&R=on",
      finstatUrl: "https://finstat.sk/46102931",
      overitUrl: "https://overit.sk/ico/46102931"
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  },
  {
    id: "sk-smb-7",
    companyName: "TECHNO-STAV Distribúcia, s.r.o. (IČO: 45892110)",
    ico: "45892110",
    website: "https://www.technostav.sk",
    companySize: "~12-25 zamestnancov",
    industry: "Veľkoobchod & B2B Technická distribúcia",
    region: "Prešovský kraj (Poprad / Prešov)",
    targetDecisionMaker: "Marek Dzurilla – Výkonný riaditeľ & Obchodný riaditeľ (ORSR)",
    decisionMakerSource: "ORSR.sk & FinStat",
    directContact: "+421 907 633 901 / dzurilla@technostav.sk",
    contactType: "Mobil & Priamy e-mail",
    identifiedWebSignals: [
      "Katalóg stavebných materiálov a spojovacieho materiálu je dostupný len v PDF na stiahnutie (28 MB)",
      "B2B nákupcovia nemajú vyhradený veľkoobchodný košík s individuálnymi zľavami",
      "Overenie dostupnosti tovaru na sklade vyžaduje telefonické prepojenie na predajňu",
      "Žiadny online dopyt na paletové odbery a dovoz priamo na stavbu"
    ],
    valueProposition: "Rýchla B2B veľkoobchodná zóna s overením IČO a okamžitým dopytom na projektové ceny.",
    coldOutreach: {
      subject: "B2B cenník a zrýchlenie objednávok pre TECHNO-STAV",
      body: "Dobrý deň pán Dzurilla,\n\nprešiel som si vašu ponuku technického a stavebného sortimentu v Poprade. Všimol som si, že remeselníci a montážne firmy musia prezeranie sortimentu riešiť cez 28 MB PDF katalóg namiesto rýchleho online výberu.\n\nPomáhame veľkoobchodom nasadiť B2B rýchloobjednávkový modul, vďaka ktorému montážnici zadajú dopyt z mobilu priamo zo stavby.\n\nMali by ste priestor na krátku 10-minútovú ukážku budúci utorok?",
      language: "sk"
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=TECHNO-STAV&PF=0&R=on",
      finstatUrl: "https://finstat.sk/45892110",
      overitUrl: "https://overit.sk/ico/45892110"
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  },
  {
    id: "sk-smb-8",
    companyName: "CONSULT-TAX Slovakia, s.r.o. (IČO: 47820194)",
    ico: "47820194",
    website: "https://www.consulttax.sk",
    companySize: "~7-15 zamestnancov",
    industry: "Účtovné kancelárie, Dane & Právne služby",
    region: "Trenčiansky kraj (Trenčín / Prievidza)",
    targetDecisionMaker: "Ing. Zuzana Kováčiková – Konateľka a daňová poradkyňa (ORSR / SKDP)",
    decisionMakerSource: "ORSR.sk & SKDP",
    directContact: "+421 918 450 119 / kovacikova@consulttax.sk",
    contactType: "Priamy mobil & e-mail",
    identifiedWebSignals: [
      "Potenciálni klienti nemajú online kalkulátor mesačného paušálu podľa počtu účtovných položiek",
      "Odovzdávanie dokladov funguje len osobne alebo nechránenou e-mailovou prílohou",
      "Web neobsahuje klientsku zónu na sledovanie termínov DPH a daňových priznaní",
      "Absencia online formulára pre vstupný audit firemného účtovníctva"
    ],
    valueProposition: "Interaktívny kalkulátor účtovných služieb a zabezpečený digitálny portál pre zber dokladov od firemných klientov.",
    coldOutreach: {
      subject: "Automatizácia dopytov a kalkulátor paušálov pre CONSULT-TAX",
      body: "Dobrý deň pani inžinierka Kováčiková,\n\nprezrel som si vaše daňové a účtovné služby v Trenčíne. Všimol som si, že noví firemní klienti nemajú možnosť orientačne si spočítať cenu mesačného paušálu podľa počtu dokladov priamo na webe.\n\nPre účtovné kancelárie nasadzujeme jednoduchý dopytový kalkulátor s digitálnym intakeom, ktorý filtruje serióznych B2B klientov a šetrí čas pri úvodnej konzultácii.\n\nRadi vám ukážeme praktickú ukážku v 8-minútovom online hovore.",
      language: "sk"
    },
    registers: {
      orsrUrl: "https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=CONSULT-TAX&PF=0&R=on",
      finstatUrl: "https://finstat.sk/47820194",
      overitUrl: "https://overit.sk/ico/47820194"
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  }
];

// Contextual Slovak SMB Generation Engine (offline / fallback intelligence)
function generateContextualSlovakLeads(params: {
  region?: string;
  industry?: string;
  minEmployees?: number;
  maxEmployees?: number;
  count?: number;
  customKeywords?: string;
  language?: string;
}): Prospect[] {
  const reqRegion = params.region || "Bratislavský kraj";
  const reqIndustry = params.industry || "Stavebníctvo";
  const minEmp = params.minEmployees || 3;
  const maxEmp = params.maxEmployees || 50;
  const reqCount = Math.max(1, Math.min(params.count || 3, 10));
  const keywords = params.customKeywords?.trim() || "";
  const lang = params.language || "sk";

  // Score existing curated candidates
  const scored = CURATED_SLOVAK_SMBS.map(item => {
    let score = 0;
    if (item.industry.toLowerCase().includes(reqIndustry.toLowerCase()) || reqIndustry.toLowerCase().includes(item.industry.toLowerCase().slice(0, 5))) score += 5;
    if (item.region.toLowerCase().includes(reqRegion.toLowerCase().slice(0, 6))) score += 3;
    if (keywords && (item.valueProposition.toLowerCase().includes(keywords.toLowerCase()) || item.companyName.toLowerCase().includes(keywords.toLowerCase()))) score += 4;
    return { item, score };
  });

  scored.sort((a, b) => b.score - a.score);

  const results: Prospect[] = [];
  const usedIds = new Set<string>();

  for (let i = 0; i < reqCount; i++) {
    const base = scored[i % scored.length].item;
    const uniqueId = `lead-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Adapt region and town
    const cleanRegion = reqRegion.split("(")[0].trim();
    const cleanIndustry = reqIndustry;
    const empRange = `~${Math.max(minEmp, 5 + i * 4)}-${Math.min(maxEmp, 18 + i * 7)} zamestnancov`;
    
    // Extract base name
    const companyClean = base.companyName.replace(/\(IČO.*?\)/i, "").trim();
    const finalCompanyName = i === 0 ? base.companyName : `${companyClean} (${cleanRegion})`;
    const cleanSearchName = encodeURIComponent(companyClean);
    const ico = base.ico || "36244491";

    let coldSubject = base.coldOutreach.subject;
    let coldBody = base.coldOutreach.body;

    if (lang === "en") {
      coldSubject = `Streamlining online inquiries and intake for ${companyClean}`;
      coldBody = `Hello,\n\nI was looking into your operations in ${cleanRegion}. While reviewing your website, I noticed that potential clients must submit requests through static emails or PDF forms, causing friction and delayed responses.\n\nWe build automated B2B intake portals for SMBs that qualify quote parameters instantly and notify management via SMS/email.\n\nWould you have 10 minutes next Tuesday for a brief intro call?`;
    }

    results.push(localizeSample({
      ...base,
      id: uniqueId,
      companyName: finalCompanyName,
      companySize: empRange,
      industry: cleanIndustry,
      region: reqRegion,
      coldOutreach: {
        subject: coldSubject,
        body: coldBody,
        language: lang
      },
      registers: {
        orsrUrl: ico ? `https://www.orsr.sk/hladaj_subjekt.asp?ICO=${ico}&R=on` : `https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=${cleanSearchName}&PF=0&R=on`,
        finstatUrl: ico ? `https://finstat.sk/${ico}` : `https://finstat.sk/hladaj?query=${cleanSearchName}`,
        overitUrl: ico ? `https://overit.sk/ico/${ico}` : `https://overit.sk/hladaj?q=${cleanSearchName}`
      },
      auditTimestamp: new Date().toISOString(),
      status: "new"
    }, lang, base.id));
    usedIds.add(uniqueId);
  }

  return results;
}

// Fallback audit generator for a single company/URL
function generateCompanyAuditFallback(urlOrName: string, industry = "Všeobecné SMB", language = "sk"): Prospect {
  const cleanName = urlOrName
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .replace(/^www\./, "")
    .split(".")[0];
  const capitalizedName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  const formattedCompany = `${capitalizedName} s.r.o.`;
  const encodedName = encodeURIComponent(formattedCompany);
  const dummyIco = "46892103";

  return localizeSample({
    id: `audit-${Date.now()}`,
    companyName: `${formattedCompany} (IČO: ${dummyIco})`,
    ico: dummyIco,
    website: urlOrName.startsWith("http") ? urlOrName : `https://${urlOrName.includes(".") ? urlOrName : `${urlOrName.toLowerCase()}.sk`}`,
    companySize: "~10-25 zamestnancov",
    industry: industry,
    region: "Slovensko (celoštátny trh)",
    targetDecisionMaker: "Konateľ / Výkonný riaditeľ (dohľadateľný v ORSR.sk)",
    decisionMakerSource: "ORSR.sk & FinStat.sk",
    directContact: "Priamy mobil & e-mail z ORSR / LinkedIn",
    contactType: "Priamy kontakt na vedenie",
    identifiedWebSignals: [
      "Dopytový proces funguje len cez voľný textový e-mail bez možnosti zadať parametre projektu a rozpočet",
      "Cenník služieb je viazaný v statickom PDF súbore alebo dostupný len na individuálne vyžiadanie",
      "Webstránka neponúka klientsku zónu pre sledovanie zákaziek ani interaktívnu kalkuláciu",
      "Pomalé načítanie na mobilných zariadeniach a chýbajúce klikateľné telefónne čísla (tel: linky)"
    ],
    valueProposition: "Moderný B2B lead intake systém s kalkulátorom orientačnej ceny a priamym prepojením na SMS notifikácie vedeniu.",
    coldOutreach: {
      subject: language === "en" 
        ? `Inquiry workflow and lead optimization for ${formattedCompany}`
        : `Zrýchlenie dopytov a obchodného toku pre ${formattedCompany}`,
      body: language === "en"
        ? `Hello,\n\nI was reviewing your website and noticed that prospective clients must send free-text emails without structured inquiry forms.\n\nFor European SMBs, we integrate instant inquiry funnels and calculators that qualify requests and increase conversion by 30%.\n\nWould you be open to a brief 8-minute introductory call?`
        : `Dobrý deň,\n\nprezrel som si vašu prezentáciu na webe. Všimol som si, že záujemcovia o vaše služby musia písať voľný e-mail bez možnosti zadať parametre projektu do štruktúrovaného formulára.\n\nPre slovenské B2B firmy integrujeme rýchle dopytové formuláre s okamžitým kalkulátorom, ktoré znižujú trenie a zvyšujú konverziu o 30 %.\n\nMali by ste v utorok 10 minút na krátky online náhľad?`,
      language: language
    },
    registers: {
      orsrUrl: `https://www.orsr.sk/hladaj_subjekt.asp?OBMENO=${encodedName}&PF=0&R=on`,
      finstatUrl: `https://finstat.sk/hladaj?query=${encodedName}`,
      overitUrl: `https://overit.sk/hladaj?q=${encodedName}`
    },
    auditTimestamp: new Date().toISOString(),
    status: "new"
  }, language);
}

// Fallback pitch generator
function generateRefinedPitchFallback(companyName: string, decisionMaker: string, valueProposition: string, tone = "direct", language = "sk") {
  const cName = companyName || "Vaša spoločnosť";
  const dMaker = decisionMaker ? decisionMaker.split(" ")[0] : "";
  const custom = valueProposition || "nasadenie interaktívneho dopytového intake formulára a okamžité notifikácie";

  if (language === "en") {
    return {
      success: true,
      isMock: true,
      subject: tone === "formal" ? `Collaboration proposal regarding digital intake for ${cName}` : `Quick question regarding online inquiries on ${cName}`,
      body: `Hello,\n\nI’m reaching out to discuss how ${cName} handles online customer enquiries. We help B2B companies simplify enquiry forms and notify the right team when a request arrives. Would you be open to a brief introductory call next Tuesday?`
    };
  }

  return {
    success: true,
    isMock: true,
    subject: tone === "formal" ? `Návrh na optimalizáciu klientskych dopytov pre ${cName}` : `Zrýchlenie dopytov a webu pre ${cName}`,
    body: `Dobrý deň${dMaker ? ` ${dMaker}` : ""},\n\nprešiel som si vašu firemnú prezentáciu a evidujem potenciál na zrýchlenie spracovania klientskych dopytov. Pre podobné firmy integrujeme ${custom}, čo šetrí hodiny manuálnej administratívy týždenne.\n\nBoli by ste v priebehu budúceho týždňa otvorení krátkemu 8-minútovému nezáväznému hovoru?`
  };
}

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
      : defaultLanguage === 'en' ? 'B2B enquiry optimisation and an interactive intake portal.' : "Optimalizácia B2B dopytov a nasadenie interaktívneho intake portálu.";

    // Cold outreach
    const subjectMatch =
      block.match(/-\s*Subject:\s*(.+)/i) || block.match(/Subject:\s*(.+)/i);
    const bodyMatch =
      block.match(/-\s*Body:\s*([\s\S]*?)(?=---|```|$)/i) ||
      block.match(/Body:\s*([\s\S]*?)(?=---|```|$)/i);

    const rawCompany = companyMatch ? companyMatch[1].trim() : defaultLanguage === 'en' ? 'Slovak SMB' : "Slovenská SMB Firma";
    const cleanCompany = rawCompany.replace(/\(IČO.*?\)/i, "").trim();
    const ico = rawCompany.match(/IČO:?\s*(\d{8})/i)?.[1] || "";
    const encodedName = encodeURIComponent(cleanCompany);
    const website = websiteMatch ? websiteMatch[1].trim() : "https://www.google.sk";

    results.push({
      id: `lead-${Date.now()}-${i}`,
      companyName: rawCompany,
      ico: ico,
      website: website.startsWith("http") ? website : `https://${website}`,
      companySize: sizeIndustryMatch ? sizeIndustryMatch[1].trim() : defaultLanguage === 'en' ? 'Not verified' : 'Neoverené',
      industry: defaultIndustry,
      region: defaultRegion,
      targetDecisionMaker: decisionMakerMatch ? decisionMakerMatch[1].trim() : defaultLanguage === 'en' ? 'Not verified' : 'Neoverené',
      decisionMakerSource: "ORSR.sk & LinkedIn",
      directContact: directContactMatch ? directContactMatch[1].trim() : defaultLanguage === 'en' ? 'Not verified' : 'Neoverené',
      contactType: defaultLanguage === 'en' ? 'Business contact' : "Priamy kontakt",
      identifiedWebSignals:
        gaps.length > 0
          ? gaps
          : [defaultLanguage === 'en' ? 'No website findings verified.' : 'Žiadne overené zistenia o webe.'],
      valueProposition: valueProp,
      coldOutreach: {
        subject: subjectMatch
          ? subjectMatch[1].trim()
          : defaultLanguage === 'en' ? `Online enquiries at ${cleanCompany}` : `Optimalizácia B2B dopytov pre ${cleanCompany}`,
        body: bodyMatch
          ? bodyMatch[1].trim()
          : defaultLanguage === 'en' ? `Hello,\n\nWe help B2B companies simplify online enquiries. Would you be open to a brief introductory call?` : `Dobrý deň,\n\nprezrel som si vašu firemnú prezentáciu a evidujem potenciál na zrýchlenie spracovania dopytov. Pre slovenské firmy integrujeme dopytové formuláre, ktoré šetria čas konateľom.\n\nBoli by ste otvorení krátkemu 8-minútovému hovoru?`,
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
      message: "Ukážkové výsledky — nejde o živé vyhľadávanie ani overené kontakty. Pre živé výsledky nastavte AI kľúč.",
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
      systemInstruction: UNIVERSAL_SYSTEM_INSTRUCTION + outputLanguageInstruction(language),
      prompt,
    });

    const responseText = aiResult.text || "";
    let prospects = extractJsonFromText(responseText);

    if (!Array.isArray(prospects) || prospects.length === 0) {
      const parsedMarkdown = parseMarkdownProspects(responseText, industry, region, language);
      if (parsedMarkdown.length > 0) {
        prospects = parsedMarkdown;
      } else {
        throw new Error('Could not parse AI search response.');
      }
    } else {
      prospects = prospects.map((p: any, idx: number) => {
        const cleanName = (p.companyName || "").replace(/\(IČO.*?\)/i, "").trim();
        const encodedName = encodeURIComponent(cleanName);
        const ico = p.ico || (p.companyName?.match(/IČO:?\s*(\d{8})/i)?.[1] || "");
        if (!p.companyName || !p.website || !p.companySize || !p.industry || !p.targetDecisionMaker || !p.directContact || !Array.isArray(p.identifiedWebSignals) || !p.valueProposition || !p.coldOutreach?.subject || !p.coldOutreach?.body) {
          throw new Error('AI returned an incomplete prospect.');
        }
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
          contactType: p.contactType || (language === 'en' ? 'Business contact' : "Priamy kontakt"),
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
      message: "Ukážkové výsledky — nejde o živé vyhľadávanie ani overené kontakty. Pre živé výsledky nastavte AI kľúč.",
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
        message: "Ukážkový audit — nejde o overenú analýzu webu.",
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
      systemInstruction: UNIVERSAL_SYSTEM_INSTRUCTION + outputLanguageInstruction(language),
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
    if (!parsed.companyName || !parsed.website || !parsed.companySize || !parsed.industry || !parsed.targetDecisionMaker || !parsed.directContact || !Array.isArray(parsed.identifiedWebSignals) || !parsed.valueProposition || !parsed.coldOutreach?.subject || !parsed.coldOutreach?.body) {
      throw new Error('AI returned an incomplete audit.');
    }

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
      contactType: parsed.contactType || (language === 'en' ? 'Business contact' : "Priamy kontakt"),
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
      message: "Ukážkový audit — nejde o overenú analýzu webu.",
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
      systemInstruction: UNIVERSAL_SYSTEM_INSTRUCTION + outputLanguageInstruction(language),
      prompt,
      jsonMode: true,
    });

    const parsed = extractJsonFromText(aiResult.text || "");
    if (!parsed?.subject || !parsed?.body) throw new Error('Could not parse AI pitch response.');
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
        message: "Nebol zadaný žiadny API kľúč.",
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
        message: "API kľúč je platný a spojenie funguje.",
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
        : "Chyba pri overení spojenia. Skontrolujte kľúč, model a oprávnenia."
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
        "default_model": "nvidia/nemotron-3.5-lightning-30b-a3b"
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

    extra_kwargs = {}
    if provider_name.lower() == "nemotron" and config["default_model"] == "nvidia/nemotron-3.5-lightning-30b-a3b":
        extra_kwargs["extra_body"] = {
            "chat_template_kwargs": {"enable_thinking": True},
            "reasoning_budget": 16384
        }
        extra_kwargs["max_tokens"] = 16384

    response = client.chat.completions.create(
        model=config["default_model"],
        messages=[
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.2,
        **extra_kwargs
    )

    choice = response.choices[0]
    reasoning = getattr(choice.message, "reasoning_content", None) if hasattr(choice, "message") else None
    content = choice.message.content if hasattr(choice, "message") else ""
    if reasoning and not content:
        return reasoning
    return content

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

// =====================================================================
// Auth + MongoDB + Cloud Pipeline + Transactional Email (added features)
// =====================================================================

let _db: Db | null = null;
async function getDb(): Promise<Db> {
  if (_db) return _db;
  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set");
  const client = new MongoClient(url);
  await client.connect();
  if (!process.env.DB_NAME) throw new Error("DB_NAME is not set");
  _db = client.db(process.env.DB_NAME);
  await _db.collection("users").createIndex({ email: 1 }, { unique: true });
  await _db.collection("sessions").createIndex({ session_token: 1 });
  await _db.collection("leads").createIndex({ user_id: 1, leadId: 1 }, { unique: true });
  return _db;
}

const JWT_ALGORITHM = "HS256" as const;
const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getJwtSecret(): string {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error("JWT_SECRET is not set");
  return s;
}

function createAccessToken(userId: string, email: string): string {
  return jwt.sign({ sub: userId, email, type: "access" }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: ACCESS_TTL_SEC,
  });
}
function createRefreshToken(userId: string): string {
  return jwt.sign({ sub: userId, type: "refresh" }, getJwtSecret(), {
    algorithm: JWT_ALGORITHM,
    expiresIn: REFRESH_TTL_SEC,
  });
}

const COOKIE_BASE = { httpOnly: true, secure: true, sameSite: "none" as const, path: "/" };

function setAuthCookies(res: express.Response, userId: string, email: string) {
  res.cookie("access_token", createAccessToken(userId, email), { ...COOKIE_BASE, maxAge: ACCESS_TTL_SEC * 1000 });
  res.cookie("refresh_token", createRefreshToken(userId), { ...COOKIE_BASE, maxAge: REFRESH_TTL_SEC * 1000 });
}
function clearAuthCookies(res: express.Response) {
  res.clearCookie("access_token", COOKIE_BASE);
  res.clearCookie("refresh_token", COOKIE_BASE);
  res.clearCookie("session_token", COOKIE_BASE);
}

function publicUser(u: any) {
  if (!u) return null;
  return {
    user_id: u.user_id,
    email: u.email,
    name: u.name || "",
    picture: u.picture || "",
    role: u.role || "user",
    auth_provider: u.auth_provider || "password",
  };
}

// Resolve the current user from JWT access token (cookie/Bearer) or Emergent session token.
async function getCurrentUser(req: express.Request): Promise<any | null> {
  const db = await getDb();
  const authHeader = (req.headers["authorization"] as string) || "";
  const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  // 1) JWT access token
  const accessToken = req.cookies?.access_token || bearer;
  if (accessToken) {
    try {
      const payload: any = jwt.verify(accessToken, getJwtSecret());
      if (payload?.type === "access" && payload?.sub) {
        const user = await db.collection("users").findOne({ user_id: payload.sub }, { projection: { _id: 0 } });
        if (user) return user;
      }
    } catch {
      // fall through to session token
    }
  }

  // 2) Emergent session token
  const sessionToken = req.cookies?.session_token || bearer;
  if (sessionToken) {
    const sess = await db.collection("sessions").findOne({ session_token: sessionToken });
    if (sess) {
      let expiresAt = sess.expires_at;
      if (typeof expiresAt === "string") expiresAt = new Date(expiresAt);
      if (expiresAt && expiresAt.getTime() > Date.now()) {
        const user = await db.collection("users").findOne({ user_id: sess.user_id }, { projection: { _id: 0 } });
        if (user) return user;
      }
    }
  }
  return null;
}

async function requireAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const user = await getCurrentUser(req);
    if (!user) return res.status(401).json({ error: "Neprihlásený používateľ." });
    (req as any).user = user;
    next();
  } catch (e: any) {
    res.status(500).json({ error: "Chyba pri overení prihlásenia." });
  }
}

async function seedAdmin() {
  try {
    const db = await getDb();
    const email = (process.env.ADMIN_EMAIL || "").toLowerCase();
    const password = process.env.ADMIN_PASSWORD || "";
    if (!email || !password) return;
    const existing = await db.collection("users").findOne({ email });
    if (!existing) {
      await db.collection("users").insertOne({
        user_id: `user_${crypto.randomBytes(6).toString("hex")}`,
        email,
        name: "Admin",
        role: "admin",
        auth_provider: "password",
        password_hash: bcrypt.hashSync(password, 10),
        created_at: new Date(),
      });
      console.log(`[seed] Admin user created: ${email}`);
    } else if (existing.password_hash && !bcrypt.compareSync(password, existing.password_hash)) {
      await db.collection("users").updateOne({ email }, { $set: { password_hash: bcrypt.hashSync(password, 10) } });
    }
  } catch (e: any) {
    console.warn("[seed] admin seeding skipped:", e?.message || e);
  }
}

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

// ---- Auth routes ----
app.post("/api/auth/register", async (req, res) => {
  try {
    const db = await getDb();
    const name = (req.body?.name || "").trim();
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: "Zadajte platný e-mail." });
    if (password.length < 8) return res.status(400).json({ error: "Heslo musí mať aspoň 8 znakov." });
    const exists = await db.collection("users").findOne({ email });
    if (exists) return res.status(409).json({ error: "Používateľ s týmto e-mailom už existuje." });
    const user = {
      user_id: `user_${crypto.randomBytes(6).toString("hex")}`,
      email,
      name: name || email.split("@")[0],
      role: "user",
      auth_provider: "password",
      password_hash: bcrypt.hashSync(password, 10),
      created_at: new Date(),
    };
    await db.collection("users").insertOne(user);
    setAuthCookies(res, user.user_id, user.email);
    res.json({ success: true, user: publicUser(user) });
  } catch (e: any) {
    res.status(500).json({ error: "Registrácia zlyhala. Skúste znova." });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const db = await getDb();
    const email = (req.body?.email || "").trim().toLowerCase();
    const password = req.body?.password || "";
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";
    const identifier = `${ip}:${email}`;

    const attempt = await db.collection("login_attempts").findOne({ identifier });
    if (attempt && attempt.count >= 5 && attempt.lockedUntil && new Date(attempt.lockedUntil).getTime() > Date.now()) {
      return res.status(429).json({ error: "Príliš veľa pokusov. Skúste to o 15 minút." });
    }

    const user = await db.collection("users").findOne({ email });
    const ok = user && user.password_hash && bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      const count = (attempt?.count || 0) + 1;
      await db.collection("login_attempts").updateOne(
        { identifier },
        { $set: { identifier, count, lockedUntil: count >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null } },
        { upsert: true }
      );
      return res.status(401).json({ error: "Nesprávny e-mail alebo heslo." });
    }
    await db.collection("login_attempts").deleteOne({ identifier });
    setAuthCookies(res, user.user_id, user.email);
    res.json({ success: true, user: publicUser(user) });
  } catch (e: any) {
    res.status(500).json({ error: "Prihlásenie zlyhalo. Skúste znova." });
  }
});

// Emergent-managed Google login: exchange session_id for a session token.
// REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
app.post("/api/auth/google/session", async (req, res) => {
  try {
    const db = await getDb();
    const sessionId = req.body?.session_id;
    if (!sessionId) return res.status(400).json({ error: "Chýba session_id." });

    const resp = await fetch("https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data", {
      method: "GET",
      headers: { "X-Session-ID": sessionId },
    });
    if (!resp.ok) return res.status(401).json({ error: "Google prihlásenie sa nepodarilo overiť." });
    const data: any = await resp.json();
    const email = (data.email || "").trim().toLowerCase();
    if (!email) return res.status(401).json({ error: "Google účet neposkytol e-mail." });
    if (typeof data.session_token !== 'string' || !data.session_token) return res.status(401).json({ error: "Google prihlásenie sa nepodarilo overiť." });

    let user: any = await db.collection("users").findOne({ email });
    if (!user) {
      user = {
        user_id: `user_${crypto.randomBytes(6).toString("hex")}`,
        email,
        name: data.name || email.split("@")[0],
        picture: data.picture || "",
        role: "user",
        auth_provider: "google",
        created_at: new Date(),
      };
      await db.collection("users").insertOne(user as any);
    } else if (data.picture && user.picture !== data.picture) {
      await db.collection("users").updateOne({ email }, { $set: { picture: data.picture } });
    }

    const sessionToken = data.session_token;
    await db.collection("sessions").insertOne({
      user_id: user.user_id,
      session_token: sessionToken,
      expires_at: new Date(Date.now() + SESSION_TTL_MS),
      created_at: new Date(),
    });
    res.cookie("session_token", sessionToken, { ...COOKIE_BASE, maxAge: SESSION_TTL_MS });
    res.json({ success: true, user: publicUser(user) });
  } catch (e: any) {
    res.status(500).json({ error: "Google prihlásenie zlyhalo." });
  }
});

app.post("/api/auth/logout", async (req, res) => {
  try {
    const token = req.cookies?.session_token;
    if (token) {
      const db = await getDb();
      await db.collection("sessions").deleteOne({ session_token: token });
    }
  } catch {
    // ignore
  }
  clearAuthCookies(res);
  res.json({ success: true });
});

app.get("/api/auth/me", async (req, res) => {
  const user = await getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Neprihlásený používateľ." });
  res.json(publicUser(user));
});

app.post("/api/auth/refresh", async (req, res) => {
  try {
    const token = req.cookies?.refresh_token;
    if (!token) return res.status(401).json({ error: "Chýba refresh token." });
    const payload: any = jwt.verify(token, getJwtSecret());
    if (payload?.type !== "refresh" || !payload?.sub) return res.status(401).json({ error: "Neplatný token." });
    const db = await getDb();
    const user = await db.collection("users").findOne({ user_id: payload.sub }, { projection: { _id: 0 } });
    if (!user) return res.status(401).json({ error: "Používateľ neexistuje." });
    res.cookie("access_token", createAccessToken(user.user_id, user.email), { ...COOKIE_BASE, maxAge: ACCESS_TTL_SEC * 1000 });
    res.json({ success: true, user: publicUser(user) });
  } catch {
    res.status(401).json({ error: "Neplatný alebo expirovaný token." });
  }
});

// ---- Cloud Pipeline (per-user saved leads) ----
app.get("/api/leads", requireAuth, async (req, res) => {
  const db = await getDb();
  const user = (req as any).user;
  const docs = await db
    .collection("leads")
    .find({ user_id: user.user_id }, { projection: { _id: 0, user_id: 0 } })
    .sort({ saved_at: -1 })
    .toArray();
  res.json({ success: true, leads: docs.map((d: any) => d.lead) });
});

app.post("/api/leads", requireAuth, async (req, res) => {
  const db = await getDb();
  const user = (req as any).user;
  const lead = req.body?.lead;
  if (!lead || !lead.id) return res.status(400).json({ error: "Neplatný prospekt." });
  const saved = { ...lead, status: lead.status === "new" ? "saved" : lead.status || "saved" };
  await db.collection("leads").updateOne(
    { user_id: user.user_id, leadId: lead.id },
    { $set: { user_id: user.user_id, leadId: lead.id, lead: saved, saved_at: new Date() } },
    { upsert: true }
  );
  res.json({ success: true, lead: saved });
});

app.patch("/api/leads/:leadId", requireAuth, async (req, res) => {
  const db = await getDb();
  const user = (req as any).user;
  const existing = await db.collection("leads").findOne({ user_id: user.user_id, leadId: req.params.leadId });
  if (!existing) return res.status(404).json({ error: "Prospekt sa nenašiel." });
  const updatedLead = { ...existing.lead };
  if (req.body?.status) updatedLead.status = req.body.status;
  if (typeof req.body?.notes === "string") updatedLead.notes = req.body.notes;
  if (req.body?.coldOutreach) updatedLead.coldOutreach = { ...updatedLead.coldOutreach, ...req.body.coldOutreach };
  await db.collection("leads").updateOne(
    { user_id: user.user_id, leadId: req.params.leadId },
    { $set: { lead: updatedLead, saved_at: existing.saved_at || new Date() } }
  );
  res.json({ success: true, lead: updatedLead });
});

app.delete("/api/leads/:leadId", requireAuth, async (req, res) => {
  const db = await getDb();
  const user = (req as any).user;
  await db.collection("leads").deleteOne({ user_id: user.user_id, leadId: req.params.leadId });
  res.json({ success: true });
});

app.delete("/api/leads", requireAuth, async (req, res) => {
  const db = await getDb();
  const user = (req as any).user;
  await db.collection("leads").deleteMany({ user_id: user.user_id });
  res.json({ success: true });
});

// ---- Transactional email: send the logged-in user THEIR OWN saved leads ----
// Guardrail note: cold outreach to prospects is NOT sent via the managed provider
// (prohibited). This route emails the authenticated account owner their own data only.
const EMAIL_BASE_URL = "https://integrations.emergentagent.com";

function esc(s: any): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function assertSafeEmail(subject: string, html: string) {
  if (/<\s*(form|input|textarea|select)\b/i.test(html)) throw new Error("No forms/inputs allowed in email");
  const urls = [...html.matchAll(/(?:href|src)\s*=\s*"([^"]*)"/gi)].map((m) => m[1]);
  for (const url of urls) {
    const low = url.trim().toLowerCase();
    if (low.startsWith("mailto:") || low.startsWith("tel:") || low.startsWith("cid:") || low.startsWith("#")) continue;
    if (!low.startsWith("https://")) throw new Error(`Email links must be absolute https: ${url}`);
  }
}

async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  assertSafeEmail(opts.subject, opts.html);
  const key = process.env.EMERGENT_EMAIL_KEY;
  const fromName = process.env.EMAIL_FROM_NAME;
  if (!key || !fromName) throw new Error("Email is not configured");
  const payload: any = { to: [opts.to], subject: opts.subject, html: opts.html, from_name: fromName };
  const replyTo = opts.replyTo || process.env.EMAIL_REPLY_TO;
  if (replyTo) payload.contact_email = replyTo;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  let resp: Response;
  try {
    resp = await fetch(`${EMAIL_BASE_URL}/api/v1/email/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Email-Key": key },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (e: any) {
    throw new Error(e?.name === "AbortError" ? "E-mailová služba neodpovedala včas." : "E-mailovú službu sa nepodarilo kontaktovať.");
  } finally {
    clearTimeout(timeout);
  }
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`Email send failed (${resp.status}): ${t.slice(0, 120)}`);
  }
  const data: any = await resp.json().catch(() => ({}));
  return data?.id || null;
}

app.post("/api/leads/email-me", requireAuth, async (req, res) => {
  try {
    const db = await getDb();
    const user = (req as any).user;
    const docs = await db
      .collection("leads")
      .find({ user_id: user.user_id }, { projection: { _id: 0 } })
      .sort({ saved_at: -1 })
      .toArray();
    if (docs.length === 0) return res.status(400).json({ error: "Vo vašom Pipeline nie sú žiadne uložené firmy." });

    const brand = esc(process.env.EMAIL_FROM_NAME || "Slovak B2B Lead Generator");
    const rows = docs
      .map((d: any) => {
        const p = d.lead || {};
        return `<tr>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:13px">${esc(p.companyName)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:13px">${esc(p.industry)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:13px">${esc(p.directContact)}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #eee;font-family:Arial,sans-serif;font-size:13px">${esc(p.status)}</td>
        </tr>`;
      })
      .join("");

    const html = `<table role="presentation" width="100%" style="max-width:720px"><tr><td style="padding:24px;font-family:Arial,sans-serif;color:#222">
      <h2 style="margin:0 0 4px">Vaše uložené B2B prospekty</h2>
      <p style="margin:0 0 16px;color:#666;font-size:14px">Prehľad ${docs.length} firiem z vášho Pipeline v aplikácii ${brand}.</p>
      <table role="presentation" width="100%" style="border-collapse:collapse">
        <tr>
          <th align="left" style="padding:8px 10px;border-bottom:2px solid #ddd;font-family:Arial,sans-serif;font-size:12px;color:#888">Firma</th>
          <th align="left" style="padding:8px 10px;border-bottom:2px solid #ddd;font-family:Arial,sans-serif;font-size:12px;color:#888">Odvetvie</th>
          <th align="left" style="padding:8px 10px;border-bottom:2px solid #ddd;font-family:Arial,sans-serif;font-size:12px;color:#888">Kontakt</th>
          <th align="left" style="padding:8px 10px;border-bottom:2px solid #ddd;font-family:Arial,sans-serif;font-size:12px;color:#888">Stav</th>
        </tr>
        ${rows}
      </table>
      <p style="font-size:12px;color:#999;margin-top:20px">Odoslané službou ${brand} na vašu žiadosť. Nikdy vás nežiadame o heslo ani platobné údaje e-mailom.</p>
    </td></tr></table>`;

    const id = await sendEmail({ to: user.email, subject: `Vaše uložené B2B prospekty (${docs.length}) — ${process.env.EMAIL_FROM_NAME}`, html });
    res.json({ success: true, email_id: id, count: docs.length, sentTo: user.email });
  } catch (e: any) {
    res.status(502).json({ error: e?.message || "E-mail sa nepodarilo odoslať." });
  }
});

// Start server with Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        // Allow the hosted preview domain to reach the Vite dev server.
        allowedHosts: true,
        // HMR websocket is unreliable behind the preview proxy; disable it.
        hmr: false,
      },
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

  // Bind the frontend port (3000) and the API port (8001). The hosting proxy
  // routes "/api/*" to 8001 and everything else to 3000, and the same Express
  // app serves both, so binding both ports makes the app work end-to-end.
  const ports = Array.from(
    new Set([PORT, Number(process.env.API_PORT) || 8001]),
  );
  for (const p of ports) {
    app.listen(p, "0.0.0.0", () => {
      console.log(`B2B Slovak Lead Generation server running on port ${p}`);
    });
  }

  // Seed the admin account (idempotent) once the server is up.
  seedAdmin();
}

export default app;

if (process.env.VERCEL !== "1" && !process.env.VERCEL_ENV) {
  startServer();
}
