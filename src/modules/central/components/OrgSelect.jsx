import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import OrgAvatar from '../../../shared/ui/OrgAvatar.jsx';

/** An organisation picker that shows each logo (a native select cannot). Keyboard: Escape closes, options are buttons. */
export default function OrgSelect({ organisations, value, onChange }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = organisations.find((o) => o.id === value);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const pick = (id) => {
    onChange(id);
    setOpen(false);
  };
  const item = 'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-fg transition-colors hover:bg-surface-2';

  return (
    <div className="relative" ref={ref} onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={open} aria-label={t('central.filterOrganisation', 'Filter by organisation')} className="field-input flex h-10 w-full cursor-pointer items-center gap-2 text-left">
        {current ? <OrgAvatar name={current.name} logoUrl={current.logoUrl} size="xs" /> : null}
        <span className="min-w-0 flex-1 truncate">{current ? current.name : t('central.allOrganisations', 'All organisations')}</span>
        <ChevronDown size={14} aria-hidden="true" className="shrink-0 text-fg-muted" />
      </button>
      {open && (
        <div role="listbox" className="surface-pop sa-pop absolute left-0 z-40 mt-2 max-h-72 w-72 max-w-[calc(100vw-2rem)] overflow-y-auto p-1">
          <button type="button" role="option" aria-selected={!value} onClick={() => pick('')} className={item}>
            {t('central.allOrganisations', 'All organisations')}
          </button>
          {organisations.map((o) => (
            <button key={o.id} type="button" role="option" aria-selected={o.id === value} onClick={() => pick(o.id)} className={item}>
              <OrgAvatar name={o.name} logoUrl={o.logoUrl} size="sm" />
              <span className="min-w-0 flex-1 truncate">{o.name}</span>
              {o.status !== 'active' && <span className="text-caption !text-[11px]">{t('central.suspended', 'suspended')}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
