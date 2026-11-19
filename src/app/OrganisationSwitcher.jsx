import { Building2, ChevronDown, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCatalog } from '../modules/catalog';
import { listTenants } from '../modules/organisations/api';
import { readRecent, sortByRecent } from '../modules/organisations/lib/recent';
import { TAB_KEYS } from '../modules/organisations/lib/workspaceMeta';
import { useI18n } from '../shared/i18n/languageContext.js';
import { toastError } from '../shared/lib/AxiosToastError';

/**
 * "Switch organisation" for platform staff (the counterpart of the ecommerce admin's "Switch project").
 * Pick an organisation and its workspace opens on the SAME tab you were on (modules, integrations, billing, team, activity).
 * It deliberately does NOT open the organisation's students or leads: platform staff never browse student data from here.
 * Keyboard: Arrow Up/Down, Home/End, Enter to open, Escape to close.
 */
export default function OrganisationSwitcher() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const catalog = useCatalog();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const ref = useRef(null);
  const listRef = useRef(null);

  const match = location.pathname.match(/^\/organisations\/([a-f0-9]{24})(?:\/([a-z]+))?/i) || [];
  const currentId = match[1] || '';
  const currentTab = TAB_KEYS.includes(match[2]) ? match[2] : 'overview';

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
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
    setQ('');
    setActive(0);
    setOpen((o) => !o);
  };

  const addOnsOn = (x) => (catalog ? catalog.modules.filter((m) => !m.core && x.modules?.[m.key]).length : null);

  /** "All organisations" is row 0, then the organisations: recently opened first, then by name. */
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const orgs = sortByRecent(list || [], readRecent()).filter((x) => !needle || `${x.name} ${x.slug}`.toLowerCase().includes(needle));
    return [{ id: '', all: true }, ...orgs];
  }, [list, q, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (row) => {
    setOpen(false);
    setQ('');
    navigate(row.all ? '/organisations' : `/organisations/${row.id}/${currentTab}`);
  };

  useEffect(() => {
    setActive((a) => Math.min(a, rows.length - 1));
  }, [rows.length]);

  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (a + 1) % rows.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (a - 1 + rows.length) % rows.length);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(rows.length - 1);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (rows[active]) choose(rows[active]);
    }
  };

  const itemClass = 'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-fg transition-colors hover:bg-surface-2';
  const recent = readRecent();

  return (
    <div className="relative max-sm:hidden" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t('header.switchOrganisation', 'Switch organisation')}
        className="tone-violet tone-chip flex h-10 cursor-pointer items-center gap-2 rounded-xl px-3 text-[13px] font-medium shadow-sm ring-1 ring-inset ring-line transition-colors duration-150 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:h-9"
      >
        <Building2 size={15} aria-hidden="true" />
        <span className="hidden sm:inline">{t('header.switchOrganisation', 'Switch organisation')}</span>
        <ChevronDown size={14} aria-hidden="true" className="hidden sm:block" />
      </button>

      {open && (
        <div className="surface-pop sa-pop absolute right-0 z-50 mt-2 flex max-h-[28rem] w-80 flex-col overflow-hidden p-1" onKeyDown={onKeyDown}>
          <div className="text-eyebrow border-b border-line px-2 pb-2 pt-1">{t('header.activeOrganisations', 'Organisations')}</div>
          <div className="relative p-1">
            <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setActive(0);
              }}
              placeholder={t('header.searchOrganisations', 'Search organisations…')}
              aria-label={t('header.searchOrganisations', 'Search organisations…')}
              role="combobox"
              aria-expanded="true"
              aria-controls="org-switcher-list"
              aria-activedescendant={`org-opt-${active}`}
              className="field-input h-9 pl-8 text-[13px]"
            />
          </div>
          <div ref={listRef} id="org-switcher-list" role="listbox" aria-label={t('header.activeOrganisations', 'Organisations')} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {list === null && <div className="px-3 py-3 text-xs text-fg-muted">Loading…</div>}
            {rows.map((row, i) => {
              const isActive = i === active;
              if (row.all) {
                return (
                  <div key="all" id="org-opt-0" role="option" aria-selected={isActive} data-active={isActive} tabIndex={-1} onMouseEnter={() => setActive(i)} onClick={() => choose(row)} className={`${itemClass} ${isActive ? 'bg-surface-2' : ''}`}>
                    <span className="truncate">{t('header.allOrganisations', 'All organisations')}</span>
                  </div>
                );
              }
              const isCurrent = row.id === currentId;
              const isRecent = recent.includes(row.id);
              const count = addOnsOn(row);
              const suspended = row.status !== 'active';
              return (
                <div
                  key={row.id}
                  id={`org-opt-${i}`}
                  role="option"
                  aria-selected={isCurrent}
                  data-active={isActive}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(row)}
                  className={`${itemClass} ${isActive ? 'bg-surface-2' : ''} ${isCurrent ? 'ring-1 ring-inset ring-line' : ''}`}
                >
                  <span className={`tone-chip h-2 w-2 shrink-0 rounded-full ${suspended ? 'tone-rose' : 'tone-emerald'}`} style={{ backgroundColor: 'var(--t)' }} title={suspended ? 'Suspended' : 'Active'} aria-label={suspended ? 'Suspended' : 'Active'} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{row.name}</span>
                    <span className="text-caption truncate !text-[11px] font-normal">
                      {row.slug}
                      {suspended ? ' · suspended' : ''}
                      {isRecent && !isCurrent ? ' · recent' : ''}
                      {isCurrent ? ' · open now' : ''}
                    </span>
                  </span>
                  {count !== null && <span className="text-caption shrink-0 !text-[11px]" title="Add-on modules switched on">{count} on</span>}
                </div>
              );
            })}
            {list !== null && rows.length === 1 && <div className="px-3 py-3 text-xs text-fg-muted">{list.length === 0 ? 'No organisations yet.' : t('common.noResults', 'No results')}</div>}
          </div>
        </div>
      )}
    </div>
  );
}
