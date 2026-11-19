import { Building2, ChevronDown, LayoutDashboard, Search, Settings2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth';
import { useCatalog } from '../modules/catalog';
import { listTenants } from '../modules/organisations/api';
import { readRecent, rememberOrganisation, sortByRecent } from '../modules/organisations/lib/recent';
import { useI18n } from '../shared/i18n/languageContext.js';
import { toastError } from '../shared/lib/AxiosToastError';
import OrgAvatar from '../shared/ui/OrgAvatar.jsx';

/**
 * "Switch organisation" for platform staff (the counterpart of the ecommerce admin's "Switch project").
 * Choosing an organisation starts ACTING AS it: the whole admin (sidebar, dashboard, every page) becomes that organisation's,
 * and a banner keeps you aware of it. "Platform console" leaves the organisation; the small "Manage" action opens the
 * platform workspace (modules, billing, team) for that organisation while you stay in console mode.
 * Keyboard: Arrow Up/Down, Home/End, Enter to switch, Shift+Enter to manage, Escape to close.
 */
export default function OrganisationSwitcher() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const catalog = useCatalog();
  const { acting, organisation, startActing, stopActing } = useAuth();
  const [open, setOpen] = useState(false);
  const [list, setList] = useState(null);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const [busyId, setBusyId] = useState('');
  const ref = useRef(null);
  const listRef = useRef(null);

  const currentId = acting?.tenantId || '';

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

  /** Row 0 is "Platform console", then the organisations: recently used first, then by name. */
  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const orgs = sortByRecent(list || [], readRecent()).filter((x) => !needle || `${x.name} ${x.slug}`.toLowerCase().includes(needle));
    return [{ id: '', console: true }, ...orgs];
  }, [list, q, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    setOpen(false);
    setQ('');
  };

  const choose = async (row) => {
    if (busyId) return;
    if (row.console) {
      close();
      if (!acting) {
        navigate('/');
        return;
      }
      setBusyId('console');
      try {
        await stopActing();
        navigate('/');
      } catch (e) {
        toastError(e);
      } finally {
        setBusyId('');
      }
      return;
    }
    if (row.id === currentId) {
      close();
      navigate('/');
      return;
    }
    setBusyId(row.id);
    try {
      await startActing(row);
      rememberOrganisation(row.id);
      close();
      navigate('/');
    } catch (e) {
      toastError(e);
    } finally {
      setBusyId('');
    }
  };

  // Platform housekeeping (modules, billing, team) lives in console mode, so leave the organisation first if we are in one.
  const manage = async (row) => {
    close();
    try {
      if (acting) await stopActing();
      rememberOrganisation(row.id);
      navigate(`/organisations/${row.id}/overview`);
    } catch (e) {
      toastError(e);
    }
  };

  useEffect(() => {
    setActive((a) => Math.min(a, rows.length - 1));
  }, [rows.length]);

  useEffect(() => {
    if (open) listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active, open]);

  const onKeyDown = (e) => {
    if (e.key === 'Escape') {
      close();
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
      const row = rows[active];
      if (!row) return;
      if (e.shiftKey && !row.console) manage(row);
      else choose(row);
    }
  };

  const itemClass = 'flex min-h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] font-medium text-fg transition-colors hover:bg-surface-2';
  const recent = readRecent();
  const currentName = organisation?.name || acting?.tenantName || '';

  return (
    <div className="relative max-sm:hidden" ref={ref}>
      <button
        type="button"
        onClick={toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t('header.switchOrganisation', 'Switch organisation')}
        className="tone-violet tone-chip flex h-10 max-w-[16rem] cursor-pointer items-center gap-2 rounded-xl px-3 text-[13px] font-medium shadow-sm ring-1 ring-inset ring-line transition-colors duration-150 hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 sm:h-9"
      >
        {acting ? <OrgAvatar name={currentName} logoUrl={organisation?.logoUrl} brandColor={organisation?.brandColor} size="xs" /> : <Building2 size={15} aria-hidden="true" />}
        <span className="hidden truncate sm:inline">{acting ? currentName : t('header.switchOrganisation', 'Switch organisation')}</span>
        <ChevronDown size={14} aria-hidden="true" className="hidden shrink-0 sm:block" />
      </button>

      {open && (
        <div className="surface-pop sa-pop absolute right-0 z-50 mt-2 flex max-h-[30rem] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden p-1" onKeyDown={onKeyDown}>
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
              if (row.console) {
                return (
                  <div key="console" id="org-opt-0" role="option" aria-selected={!acting} data-active={isActive} tabIndex={-1} onMouseEnter={() => setActive(i)} onClick={() => choose(row)} className={`${itemClass} ${isActive ? 'bg-surface-2' : ''} ${!acting ? 'ring-1 ring-inset ring-line' : ''}`}>
                    <span className="tone-brand tone-chip flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                      <LayoutDashboard size={15} aria-hidden="true" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate">{t('header.platformConsole', 'Platform console')}</span>
                      <span className="text-caption truncate !text-[11px] font-normal">{acting ? t('header.leaveOrganisation', 'Leave this organisation') : t('header.consoleNow', 'Organisations, billing and platform settings')}</span>
                    </span>
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
                  aria-busy={busyId === row.id}
                  data-active={isActive}
                  tabIndex={-1}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => choose(row)}
                  className={`${itemClass} group ${isActive ? 'bg-surface-2' : ''} ${isCurrent ? 'ring-1 ring-inset ring-line' : ''} ${busyId === row.id ? 'opacity-60' : ''}`}
                >
                  <span className="relative shrink-0">
                    <OrgAvatar name={row.name} logoUrl={row.logoUrl} brandColor={row.brandColor} size="sm" />
                    <span
                      className={`tone-chip absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--surface-solid)] ${suspended ? 'tone-rose' : 'tone-emerald'}`}
                      style={{ backgroundColor: 'var(--t)' }}
                      title={suspended ? 'Suspended' : 'Active'}
                      aria-label={suspended ? 'Suspended' : 'Active'}
                    />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{row.name}</span>
                    <span className="text-caption truncate !text-[11px] font-normal">
                      {row.slug}
                      {suspended ? ' · suspended' : ''}
                      {isRecent && !isCurrent ? ' · recent' : ''}
                      {isCurrent ? ' · open now' : ''}
                      {count !== null ? ` · ${count} add-on${count === 1 ? '' : 's'}` : ''}
                    </span>
                  </span>
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={(e) => {
                      e.stopPropagation();
                      manage(row);
                    }}
                    title={t('header.manageOrganisation', 'Manage this organisation in the platform console')}
                    className="flex h-7 shrink-0 cursor-pointer items-center gap-1 rounded-md px-2 text-[11px] font-medium text-fg-secondary ring-1 ring-inset ring-line transition-colors hover:bg-surface hover:text-fg focus-visible:outline-2 focus-visible:outline-brand-500"
                  >
                    <Settings2 size={12} aria-hidden="true" />
                    {t('header.manage', 'Manage')}
                  </button>
                </div>
              );
            })}
            {list !== null && rows.length === 1 && <div className="px-3 py-3 text-xs text-fg-muted">{list.length === 0 ? 'No organisations yet.' : t('common.noResults', 'No results')}</div>}
          </div>
          <div className="text-caption border-t border-line px-3 pb-1 pt-2 !text-[11px]">{t('header.switchHint', 'Enter opens the organisation admin. Shift+Enter opens its platform workspace.')}</div>
        </div>
      )}
    </div>
  );
}
