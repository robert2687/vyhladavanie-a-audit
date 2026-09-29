import React from 'react';
import { Download, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const CopyFallback = ({ text, format, onClose }: { text: string; format: 'md' | 'tsv'; onClose: () => void }) => {
  const { t } = useLanguage();
  const download = () => {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `slovak_b2b_leads.${format}`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return <section data-testid="copy-fallback" className="space-y-3 border-l-4 border-amber-400 bg-amber-50 p-4">
    <div className="flex items-start justify-between gap-3">
      <p role="status" data-testid="copy-fallback-notice" className="text-sm text-amber-900">{t('Prehliadač zablokoval schránku. Text môžete skopírovať ručne alebo stiahnuť.')}</p>
      <button data-testid="copy-fallback-close" type="button" onClick={onClose} aria-label={t('Zatvoriť')} className="p-1 text-stone-600 hover:text-stone-900"><X className="w-4 h-4" /></button>
    </div>
    <textarea data-testid="copy-fallback-text" readOnly value={text} rows={5} aria-label={t('Text exportu')} onFocus={e => e.target.select()}
      className="w-full rounded-lg border border-amber-200 bg-white p-3 font-mono text-xs text-stone-800" />
    <button data-testid="copy-fallback-download" type="button" onClick={download} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-amber-200 text-sm font-semibold hover:bg-amber-100">
      <Download className="w-4 h-4" />{t('Stiahnuť export')}
    </button>
  </section>;
};