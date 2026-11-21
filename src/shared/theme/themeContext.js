import { createContext, useContext, useLayoutEffect } from 'react';

/**
 * Theme engine (same behaviour and storage keys as the ecommerce admin).
 *  - light / dark / system  -> `class="dark"` on <html>   (localStorage key: `theme`)
 *  - colour theme           -> `data-theme` on <html>      (localStorage key: `color_theme`)
 *  - density                -> `data-density` on <html>    (localStorage key: `density`), applied by the app layout only
 * public/theme-init.js applies the first two before first paint so there is no flash.
 */
export const THEMES = [
  { id: 'fast', labelKey: 'theme.fast', label: 'FastAdmission', dots: ['#0a96d0', '#0b3f8f', '#f5a623'] },
  { id: 'classic', labelKey: 'theme.classic', label: 'Classic', dots: ['#4f46e5', '#7c3aed', '#10b981'] },
  { id: 'beauty', labelKey: 'theme.beauty', label: 'Beauty', dots: ['#b94f55', '#c9993b', '#8b6fd1'] },
  { id: 'ocean', labelKey: 'theme.ocean', label: 'Ocean', dots: ['#0284c7', '#06b6d4', '#14b8a6'] },
  { id: 'emerald', labelKey: 'theme.emerald', label: 'Emerald', dots: ['#059669', '#14b8a6', '#84cc16'] },
  { id: 'slate', labelKey: 'theme.slate', label: 'Slate', dots: ['#2563eb', '#52525b', '#a1a1aa'] },
];
export const DEFAULT_COLOR_THEME = 'fast';
export const DENSITIES = ['compact', 'comfortable'];

export const ThemeContext = createContext({
  isDark: false,
  toggleTheme: () => {},
  mode: 'light',
  setMode: () => {},
  colorTheme: DEFAULT_COLOR_THEME,
  setColorTheme: () => {},
  density: 'compact',
  setDensity: () => {},
  themes: THEMES,
});

export const useTheme = () => useContext(ThemeContext);

/** Call from the app layout ONLY: sets <html data-density> while it is mounted, so the sign-in screen keeps default sizing. */
export const useDensityAttribute = () => {
  const { density } = useContext(ThemeContext);
  useLayoutEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);
  useLayoutEffect(
    () => () => {
      delete document.documentElement.dataset.density;
    },
    [],
  );
};
