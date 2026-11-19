import { Building2, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { listTenants } from '../modules/organisations/api';
import { useI18n } from '../shared/i18n/languageContext.js';
import { toastError } from '../shared/lib/AxiosToastError';

/**
 * "Switch organisation" for platform staff (the counterpart of the ecommerce admin's "Switch project").
 * Pick an organisation and its management page opens: modules, plan and billing, status and recent changes.
 * It deliberately does NOT open the organisation's students or leads: platform staff never browse student data from here.
 */
export default function OrganisationSwitcher() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const ref = useRef(null);

  const currentId = (location.pathname.match(/^\/organisations\/([a-f0-9]{24})/i) || [])[1] || '';

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = async () => {
    if (!open && list === null) {
      try {
        const { data } = await listTenants({ page: 1, limit: 100 });
        setList(data.tenants);
      } catch (e) {
        toastError(e);
        setList([]);
      }
    }
    setOpen((o) => !o);
  };

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (list || []).filter((x) => !needle || `${x.name} ${x.slug}`.toLowerCase().includes(needle));
  }, [list, q]);

  const choose = (to) => {
    setOpen(false);
    setQ('');
    navigate(to);
  };

  const itemClass = 'flex min-h-10 w-full cursor-pointer flex-col justify-center rounded-lg px-3 py-2 text-left text-[13px] font-medium text-fg transition-colors hover:bg-surface-2';

  return (
    <div className="relative max-sm:hidden" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="menu"
        aria-expanded={open}
        title={t('header.switchOrganisation', 'Switch organisation')}
        className="tone-violet tone-chip flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-[13px] font-medium shadow-sm ring-1 ring-inset ring-line transition-colors duration-150 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:h-9"
      >
        <Building2 size={15} aria-hidden="true" />
        <span className="hidden sm:inline">{t('header.switchOrganisation', 'Switch organisation')}</span>
        <ChevronDown size={14} aria-hidden="true" className="hidden sm:block" />
      </button>

      {open && (
        <div role="menu" className="surface-pop sa-pop absolute right-0 z-50 mt-2 flex max-h-[26rem] w-72 flex-col overflow-hidden p-1">
          <div className="text-eyebrow border-b border-line px-2 pb-2 pt-1">{t('header.activeOrganisations', 'Organisations')}</div>
          <div className="relative p-1">
            <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('header.searchOrganisations', 'Search organisations…')} aria-label={t('header.searchOrganisations', 'Search organisations…')} className="field-input h-9 pl-8 text-[13px]" />
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <button type="button" role="menuitem" onClick={() => choose('/organisations')} className={itemClass}>
              <span className="truncate">{t('header.allOrganisations', 'All organisations')}</span>
            </button>
            {filtered.length === 0 && list !== null && <div className="px-3 py-3 text-xs text-fg-muted">{t('common.noResults', 'No results')}</div>}
            {filtered.map((x) => (
              <button key={x.id} type="button" role="menuitem" onClick={() => choose(`/organisations/${x.id}`)} className={`${itemClass} ${x.id === currentId ? 'bg-surface-2 ring-1 ring-inset ring-line' : ''}`}>
                <span className="truncate">{x.name}</span>
                <span className="text-caption truncate !text-[11px] font-normal">
                  {x.slug}
                  {x.status !== 'active' ? ' · suspended' : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
