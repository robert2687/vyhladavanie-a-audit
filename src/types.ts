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

export interface SearchFilterState {
  region: string;
  industry: string;
  minEmployees: number;
  maxEmployees: number;
  count: number;
  customKeywords: string;
  language: "sk" | "en";
}

export interface SearchHistoryItem {
  id: string;
  timestamp: number;
  type: "market_discovery" | "company_audit";
  title: string;
  subtitle: string;
  filters?: SearchFilterState;
  auditTarget?: {
    urlOrName: string;
    industry: string;
    language: "sk" | "en";
  };
  resultsCount?: number;
}

export type TabType = "discover" | "audit" | "pipeline" | "guide";

export type AIProviderId =
  | "gemini"
  | "anthropic"
  | "perplexity"
  | "nemotron"
  | "deepseek"
  | "openai"
  | "grok";

export interface AIProviderConfig {
  id: AIProviderId;
  name: string;
  company: string;
  defaultModel: string;
  models: string[];
  description: string;
  keyPlaceholder: string;
  keyEnvName: string;
  getKeyUrl: string;
  badgeText: string;
  supportsWebSearch: boolean;
}

export interface AIProviderSettings {
  activeProvider: AIProviderId;
  selectedModels: Partial<Record<AIProviderId, string>>;
  keys: Partial<Record<AIProviderId, string>>;
}
