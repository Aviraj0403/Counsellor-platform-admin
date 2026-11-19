import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../shared/i18n/languageContext.js';
import useVisibleNav from './useVisibleNav';

/** Header "search pages" box: type a few letters, Enter (or click) jumps to the page. Only shows pages this person may open. */
export default function QuickNav() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const sections = useVisibleNav();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const needle = q.trim().toLowerCase();
  const results = needle
    ? sections.flatMap((s) => s.items).map((i) => ({ ...i, text: t(i.labelKey, i.label) })).filter((i) => i.text.toLowerCase().includes(needle))
    : [];

  const go = (to) => {
    setQ('');
    setOpen(false);
    navigate(to);
  };

  return (
    <div ref={ref} className="relative hidden w-full max-w-xs md:block">
      <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
      <input
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) go(results[0].to);
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={t('header.search', 'Search pages…')}
        aria-label={t('header.search', 'Search pages…')}
        className="field-input h-9 pl-8 text-[13px]"
      />
      {open && needle && (
        <ul role="listbox" className="surface-pop sa-pop absolute left-0 z-50 mt-2 w-full overflow-hidden p-1">
          {results.length === 0 && <li className="px-3 py-2 text-xs text-fg-muted">{t('common.noResults', 'No results')}</li>}
          {results.map((i) => (
            <li key={i.to} role="option" aria-selected="false">
              <button type="button" onClick={() => go(i.to)} className="flex h-9 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-[13px] text-fg-secondary transition-colors hover:bg-surface-2 hover:text-fg">
                <i.icon size={15} aria-hidden="true" />
                {i.text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
