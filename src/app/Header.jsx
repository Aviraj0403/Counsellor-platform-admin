import { ChevronDown, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../modules/auth';
import { useI18n } from '../shared/i18n/languageContext.js';
import LanguageSwitcher from '../shared/i18n/LanguageSwitcher.jsx';
import ThemePicker from '../shared/ui/ThemePicker.jsx';
import OrganisationSwitcher from './OrganisationSwitcher';
import QuickNav from './QuickNav';

const iconBtn =
  'flex h-10 w-10 sm:h-9 sm:w-9 cursor-pointer items-center justify-center rounded-xl bg-surface text-fg-secondary shadow-sm ring-1 ring-inset ring-line transition-colors duration-150 hover:bg-surface-2 hover:text-fg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500';

/** Sticky top bar: menu / collapse, page search, then (right) organisation switch, language, appearance, profile. */
export default function Header({ toggleMobile, mobileOpen, collapsed, toggleCollapsed }) {
  const { me, can, logout } = useAuth();
  const { t, lang, setLang, languages } = useI18n();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const onDown = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const name = me?.user?.name || '';
  const collapseLabel = collapsed ? t('shell.expand', 'Expand sidebar') : t('nav.collapse', 'Collapse sidebar');

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-line bg-[var(--sidebar-bg)] px-4 backdrop-blur lg:px-6">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <button type="button" onClick={toggleMobile} className={`${iconBtn} lg:hidden`} aria-label={t('shell.openMenu', 'Open navigation menu')} aria-expanded={!!mobileOpen}>
            <Menu size={16} />
          </button>
          <button type="button" onClick={toggleCollapsed} className={`${iconBtn} hidden lg:flex`} aria-label={collapseLabel} title={collapseLabel}>
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <QuickNav />
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {me?.scope === 'platform' && can('platform:tenants:manage') && <OrganisationSwitcher />}
          <LanguageSwitcher className="max-sm:hidden" />
          <ThemePicker />

          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setProfileOpen((o) => !o)}
              aria-haspopup="menu"
              aria-expanded={profileOpen}
              aria-label={t('shell.account', 'Account menu')}
              className="flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-surface pl-1 pr-2 text-[13px] font-medium text-fg shadow-sm ring-1 ring-inset ring-line transition-colors duration-150 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 max-sm:w-10 max-sm:justify-center max-sm:px-0 sm:h-9"
            >
              <span className="brand-gradient flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold text-white">{(name || 'A')[0].toUpperCase()}</span>
              <span className="hidden max-w-[8rem] truncate md:inline">{name}</span>
              <ChevronDown size={14} className="hidden text-fg-muted sm:block" />
            </button>

            {profileOpen && (
              <div role="menu" className="surface-pop sa-pop absolute right-0 z-50 mt-2 max-h-[calc(100dvh-4.5rem)] w-56 overflow-y-auto overscroll-contain p-1 max-sm:fixed max-sm:inset-x-4 max-sm:top-14 max-sm:mt-0 max-sm:w-auto">
                <div className="px-3 py-2">
                  <div className="truncate text-sm font-medium text-fg" title={name}>{name}</div>
                  <div className="text-caption mt-1 truncate" title={me?.user?.email}>{me?.user?.email}</div>
                  <div className="text-caption truncate">{me?.user?.roleLabel}</div>
                </div>
                {/* rarely used controls live here on phones so the top bar never overflows */}
                <div className="sm:hidden">
                  <div className="my-1 h-px bg-line" />
                  <p className="text-eyebrow px-3 pb-1 pt-1">{t('header.language', 'Language')}</p>
                  <div className="flex flex-wrap gap-1 px-2 pb-1">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        role="menuitemradio"
                        aria-checked={l.code === lang}
                        onClick={() => setLang(l.code)}
                        className={`h-10 flex-1 cursor-pointer rounded-lg px-3 text-[13px] font-medium transition-colors ${l.code === lang ? 'bg-brand-50 text-fg dark:bg-brand-500/15' : 'bg-surface-2 text-fg-secondary hover:text-fg'}`}
                      >
                        {l.native}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="my-1 h-px bg-line" />
                <button
                  type="button"
                  role="menuitem"
                  onClick={logout}
                  className="flex h-10 w-full cursor-pointer items-center gap-2 rounded-lg px-3 text-left text-[13px] font-medium text-rose-600 transition-colors hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10 sm:h-9"
                >
                  <LogOut size={16} />
                  <span>{t('shell.logout', 'Logout')}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
