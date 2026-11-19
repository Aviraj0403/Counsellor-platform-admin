import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Languages } from "lucide-react";
import { useI18n } from "./languageContext.js";

/** Compact language dropdown for the top bar. Keyboard accessible (Esc closes, ↑/↓ to move). */
const LanguageSwitcher = ({ className = "" }) => {
  const { lang, setLang, languages, t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = languages.find((l) => l.code === lang) || languages[0];

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("header.language", "Language")}
        className="inline-flex h-10 w-10 sm:h-9 sm:w-auto cursor-pointer items-center justify-center gap-2 rounded-xl bg-surface px-0 sm:px-3 text-[13px] font-medium text-fg-secondary shadow-sm ring-1 ring-inset ring-line transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
      >
        <Languages size={16} />
        <span className="hidden sm:inline">{current.native}</span>
        <ChevronDown size={13} className={`hidden transition-transform sm:block ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("header.language", "Language")}
          className="surface-pop sa-pop absolute right-0 z-50 mt-2 w-44 max-w-[calc(100vw-2rem)] overflow-y-auto overscroll-contain p-1"
        >
          {languages.map((l) => (
            <li key={l.code} role="option" aria-selected={l.code === lang}>
              <button
                type="button"
                onClick={() => {
                  setLang(l.code);
                  setOpen(false);
                }}
                className={`flex h-10 sm:h-9 w-full items-center justify-between rounded-lg px-3 text-left text-[13px] transition-colors duration-150 ${
                  l.code === lang ? "bg-brand-50 font-medium text-fg dark:bg-brand-500/15" : "text-fg-secondary hover:bg-surface-2 hover:text-fg"
                }`}
              >
                <span>
                  {l.native}
                  <span className="t-muted ml-2 text-xs">{l.label}</span>
                </span>
                {l.code === lang && <Check size={14} />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default LanguageSwitcher;
