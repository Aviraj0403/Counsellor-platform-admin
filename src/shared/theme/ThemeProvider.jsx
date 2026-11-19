import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { DEFAULT_COLOR_THEME, DENSITIES, THEMES, ThemeContext } from './themeContext';

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable: the choice just will not be remembered */
  }
};
const systemDark = () => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch {
    return false;
  }
};

const readMode = () => {
  const v = read('theme');
  return v === 'dark' || v === 'light' || v === 'system' ? v : 'light';
};
const readColorTheme = () => {
  const v = read('color_theme');
  return THEMES.some((t) => t.id === v) ? v : DEFAULT_COLOR_THEME;
};
const readDensity = () => {
  const v = read('density');
  return DENSITIES.includes(v) ? v : 'compact';
};

export default function ThemeProvider({ children }) {
  const [mode, setModeState] = useState(readMode);
  const [sysDark, setSysDark] = useState(systemDark);
  const [colorTheme, setColorThemeState] = useState(readColorTheme);
  const [density, setDensityState] = useState(readDensity);

  const isDark = mode === 'dark' || (mode === 'system' && sysDark);

  // Follow the OS preference while in "system" mode
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia('(prefers-color-scheme: dark)');
    } catch {
      return undefined;
    }
    const on = (e) => setSysDark(e.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);

  // Layout effects so children (for example chart palette reads) see the new attributes straight away
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = colorTheme;
  }, [colorTheme]);

  const setMode = useCallback((m) => {
    setModeState(m);
    write('theme', m);
  }, []);
  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const wasDark = prev === 'dark' || (prev === 'system' && systemDark());
      const next = wasDark ? 'light' : 'dark';
      write('theme', next);
      return next;
    });
  }, []);
  const setColorTheme = useCallback((id) => {
    if (!THEMES.some((t) => t.id === id)) return;
    setColorThemeState(id);
    write('color_theme', id);
  }, []);
  const setDensity = useCallback((d) => {
    if (!DENSITIES.includes(d)) return;
    setDensityState(d);
    write('density', d);
  }, []);

  const value = useMemo(
    () => ({ isDark, toggleTheme, mode, setMode, colorTheme, setColorTheme, density, setDensity, themes: THEMES }),
    [isDark, toggleTheme, mode, setMode, colorTheme, setColorTheme, density, setDensity],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
