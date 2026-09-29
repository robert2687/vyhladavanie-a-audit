import { en } from './en';
import { guideEn } from './guideEn';
export type Language = 'sk' | 'en';
export const LANGUAGE_KEY = 'slovak_b2b_language';
const dictionary = { ...en, ...guideEn };
export function readLanguage(): Language {
  try { return localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'sk'; }
  catch { return 'sk'; }
}
// Explicit locale keeps translation deterministic and safe for concurrent server requests.
export function translate(language: Language, key: string, ...values: unknown[]): string {
  const text = language === 'en' ? dictionary[key] ?? key : key;
  return text.replace(/\{(\d+)\}/g, (_, index) => String(values[Number(index)] ?? `{${index}}`));
}
export function translator(language: Language) {
  return (input: string | TemplateStringsArray, ...values: unknown[]) => {
    const key = typeof input === 'string' ? input : input.reduce((s, part, i) => s + (i ? `{${i - 1}}` : '') + part, '');
    return translate(language, key, ...values);
  };
}