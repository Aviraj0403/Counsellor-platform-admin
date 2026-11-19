import { useCallback, useEffect, useMemo, useState } from 'react';
import { LANGUAGES, LanguageContext, STORAGE_KEY, interpolate } from './languageContext';
import en from './translations/en';

// English ships in the main bundle; other languages are separate chunks fetched only when selected.
const DICT_LOADERS = { hi: () => import('./translations/hi') };

const readStoredLang = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved;
  } catch {
    /* storage unavailable */
  }
  return 'en';
};

export default function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(readStoredLang);
  const [dicts, setDicts] = useState({ en });

  const setLang = useCallback((code) => {
    if (!LANGUAGES.some((l) => l.code === code)) return;
    setLangState(code);
    try {
      localStorage.setItem(STORAGE_KEY, code);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Fetch the selected language on demand. Until it arrives, keys fall back to English (never blank text).
  useEffect(() => {
    const load = DICT_LOADERS[lang];
    if (!load || dicts[lang]) return undefined;
    let alive = true;
    load()
      .then((m) => alive && setDicts((d) => ({ ...d, [lang]: m.default })))
      .catch(() => {
        /* offline / stale chunk: stay on English */
      });
    return () => {
      alive = false;
    };
  }, [lang, dicts]);

  const value = useMemo(() => {
    const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];
    const t = (key, fallback, vars) => interpolate((dicts[current.code] || en)[key] ?? en[key] ?? fallback ?? key, vars);
    return { lang, setLang, t, locale: current.locale, languages: LANGUAGES };
  }, [lang, setLang, dicts]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}
