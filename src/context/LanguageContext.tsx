import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Language, LANGUAGE_KEY, readLanguage, translator } from '../i18n';

const LanguageContext = createContext({ language: 'sk' as Language, setLanguage: (_: Language) => {}, t: translator('sk') });
export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, updateLanguage] = useState<Language>(readLanguage);
  const setLanguage = (value: Language) => {
    updateLanguage(value);
    try { localStorage.setItem(LANGUAGE_KEY, value); } catch { /* Still works without browser storage. */ }
  };
  useEffect(() => {
    document.documentElement.lang = language;
    document.title = language === 'en' ? 'Slovak B2B · Leads & Web Audit' : 'Slovak B2B · Prospekty a audit webov';
  }, [language]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === LANGUAGE_KEY) updateLanguage(readLanguage()); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  const value = useMemo(() => ({ language, setLanguage, t: translator(language) }), [language]);
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
export const useLanguage = () => useContext(LanguageContext);