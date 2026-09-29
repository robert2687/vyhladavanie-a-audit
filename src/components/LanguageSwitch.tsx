import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LanguageSwitch = () => {
  const { language, setLanguage, t } = useLanguage();
  return (
    <label className="inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-stone-200 bg-white px-2 text-stone-700 min-h-[42px]" data-testid="language-switch">
      <Languages className="w-4 h-4" aria-hidden="true" />
      <select data-testid="language-select" aria-label={t('Jazyk')} value={language}
        onChange={e => setLanguage(e.target.value === 'en' ? 'en' : 'sk')}
        className="bg-transparent text-xs font-semibold py-2 focus:outline-blue-600 cursor-pointer max-w-[100px]">
        <option value="sk" data-testid="language-option-sk">Slovenčina</option>
        <option value="en" data-testid="language-option-en">English</option>
      </select>
    </label>
  );
};