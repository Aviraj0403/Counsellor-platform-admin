import React, { useEffect, useId, useRef, useState } from "react";
import { Check, Monitor, Moon, Palette, Sun } from "lucide-react";
import { useTheme, THEMES } from "../theme/themeContext.js";
import { useI18n } from "../i18n/languageContext.js";
import { cx } from "../lib/cx.js";

/** Roving-arrow-key handler for a radio group of buttons. */
const onArrows = (e) => {
  const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
  if (!keys.includes(e.key)) return;
  const items = Array.from(e.currentTarget.querySelectorAll('[role="radio"]'));
  const i = items.indexOf(document.activeElement);
  if (i < 0) return;
  e.preventDefault();
  const next = items[(i + (e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : -1) + items.length) % items.length];
  next.focus();
  next.click();
};

const Segmented = ({ label, value, options, onChange }) => (
  <div role="radiogroup" aria-label={label} onKeyDown={onArrows} className="flex gap-1 rounded-xl bg-surface-2 p-1 ring-1 ring-inset ring-line">
    {options.map((o) => {
      const on = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={on}
          tabIndex={on ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cx(
            "flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-brand-500",
            on ? "bg-surface text-fg shadow-sm ring-1 ring-inset ring-line" : "text-fg-secondary hover:text-fg"
          )}
        >
          {o.icon && <o.icon size={14} aria-hidden="true" />}
          {o.label}
        </button>
      );
    })}
  </div>
);

/** Compact header button + popover: colour theme swatches, light/dark/system, density. */
export default function ThemePicker({ className = "", buttonClassName = "" }) {
  const { colorTheme, setColorTheme, mode, setMode, density, setDensity } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const btnRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const title = t("theme.title", "Appearance");

  return (
    <div ref={ref} className={cx("relative", className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label={title}
        title={title}
        className={cx(
          "inline-flex h-10 w-10 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-xl bg-surface text-fg-secondary ring-1 ring-inset ring-line shadow-sm transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500",
          buttonClassName
        )}
      >
        <Palette size={16} />
      </button>

      {open && (
        <div
          id={id}
          role="dialog"
          aria-label={title}
          className="surface-pop sa-pop absolute right-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain p-4 max-sm:fixed max-sm:inset-x-4 max-sm:top-14 max-sm:mt-0 max-sm:w-auto max-sm:max-w-none"
        >
          <p className="text-card-title mb-3">{title}</p>

          <p className="text-eyebrow mb-2">{t("theme.colour", "Colour theme")}</p>
          <div role="radiogroup" aria-label={t("theme.colour", "Colour theme")} onKeyDown={onArrows} className="grid grid-cols-2 gap-2">
            {THEMES.map((th) => {
              const on = th.id === colorTheme;
              return (
                <button
                  key={th.id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setColorTheme(th.id)}
                  className={cx(
                    "flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-brand-500",
                    on ? "bg-brand-50 text-fg ring-2 ring-brand-500 dark:bg-brand-500/15" : "bg-surface-2 text-fg-secondary ring-1 ring-inset ring-line hover:text-fg"
                  )}
                >
                  <span className="flex shrink-0 -space-x-1" aria-hidden="true">
                    {th.dots.map((c) => (
                      <span key={c} className="h-3.5 w-3.5 rounded-full ring-2 ring-white dark:ring-slate-900" style={{ backgroundColor: c }} />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{t(th.labelKey, th.label)}</span>
                  {on && <Check size={14} className="shrink-0 text-brand-600 dark:text-brand-300" aria-hidden="true" />}
                </button>
              );
            })}
          </div>

          <p className="text-eyebrow mb-2 mt-4">{t("theme.mode", "Mode")}</p>
          <Segmented
            label={t("theme.mode", "Mode")}
            value={mode}
            onChange={setMode}
            options={[
              { value: "light", label: t("theme.light", "Light"), icon: Sun },
              { value: "dark", label: t("theme.dark", "Dark"), icon: Moon },
              { value: "system", label: t("theme.system", "System"), icon: Monitor },
            ]}
          />

          <p className="text-eyebrow mb-2 mt-4">{t("theme.density", "Density")}</p>
          <Segmented
            label={t("theme.density", "Density")}
            value={density}
            onChange={setDensity}
            options={[
              { value: "compact", label: t("theme.compact", "Compact") },
              { value: "comfortable", label: t("theme.comfortable", "Comfortable") },
            ]}
          />
        </div>
      )}
    </div>
  );
}
