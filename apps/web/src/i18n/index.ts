import { create } from 'zustand';
import { LANGUAGES, type Language, type TranslationKey } from './translations';

export type { Language, TranslationKey } from './translations';

const STORAGE_KEY = 'mjd.lang';
export const LANGUAGE_CODES = Object.keys(LANGUAGES) as Language[];

const isLanguage = (value: unknown): value is Language =>
  typeof value === 'string' && value in LANGUAGES;

function detectLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // storage unavailable - fall back to the browser language
  }
  const browser = typeof navigator === 'undefined' ? '' : navigator.language.toLowerCase();
  return browser.startsWith('zh') ? 'zh' : 'en';
}

interface LanguageState {
  lang: Language;
  setLang: (lang: Language) => void;
}

const applyDocumentLanguage = (lang: Language) => {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
  }
};

export const useLanguage = create<LanguageState>((set) => {
  const lang = detectLanguage();
  applyDocumentLanguage(lang);
  return {
    lang,
    setLang: (next) => {
      set({ lang: next });
      applyDocumentLanguage(next);
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        // ignore
      }
    },
  };
});

export type TranslateFn = (key: TranslationKey, params?: Record<string, string | number>) => string;

/** Looks up `key` in the language, filling `{placeholders}`. Falls back to English, then the key. */
export function translate(
  lang: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string {
  const text = LANGUAGES[lang][key] ?? LANGUAGES.en[key] ?? key;
  if (!params) return text;
  return text.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}

/** React hook: `const t = useT(); t('hud.spin')`. Re-renders when the language changes. */
export function useT(): TranslateFn {
  const lang = useLanguage((state) => state.lang);
  return (key, params) => translate(lang, key, params);
}
