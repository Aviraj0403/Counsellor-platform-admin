import { createContext, useContext } from 'react';
import en from './translations/en';

/**
 * Lightweight i18n (no dependency), same API as the ecommerce admin.
 *  t('nav.leads')                              -> translated string (falls back to English, then to the key / provided fallback)
 *  t('greeting', 'Hello, {name}', { name })    -> simple {placeholder} interpolation
 * Add a language: create translations/<code>.js, register it in LANGUAGES and in LanguageProvider's loaders.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English', locale: 'en-IN' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी', locale: 'hi-IN' },
];

export const STORAGE_KEY = 'admin_lang';

export const interpolate = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (vars[k] !== undefined ? String(vars[k]) : m)) : text);

export const LanguageContext = createContext(null);

export const useI18n = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    // Safe fallback so components never crash if rendered outside the provider
    return {
      lang: 'en',
      setLang: () => {},
      t: (key, fallback, vars) => interpolate(en[key] ?? fallback ?? key, vars),
      locale: 'en-IN',
      languages: LANGUAGES,
    };
  }
  return ctx;
};
