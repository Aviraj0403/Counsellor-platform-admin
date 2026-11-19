import { LogOut, PanelLeftClose, PanelLeftOpen, Sparkles, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../modules/auth';
import useModalA11y from '../shared/hooks/useModalA11y.js';
import { useI18n } from '../shared/i18n/languageContext.js';
import { NAV_TONE } from '../shared/ui/tones.js';
import { useRailTip } from '../shared/ui/RailTip.jsx';
import useVisibleNav from './useVisibleNav';

// Each menu section gets its own accent (the colours follow the active colour theme).
const SECTION_STYLE = {
  Overview: { tone: 'rose', key: 'section.overview' },
  Platform: { tone: 'violet', key: 'section.platform' },
  'My organisation': { tone: 'emerald', key: 'section.organisation' },
  Account: { tone: 'teal', key: 'section.account' },
};

/** Floating, collapsible sidebar (icon rail on desktop, drawer on phones). Same look and behaviour as the ecommerce admin. */
export default function Sidebar({ collapsed = false, mobileOpen = false, toggleCollapsed, closeMobile }) {
  const { me, logout } = useAuth();
  const { t } = useI18n();
  const sections = useVisibleNav();
  const { bind, node: tipNode } = useRailTip(collapsed);
  const drawerRef = useModalA11y(mobileOpen, closeMobile); // phone drawer: Escape, focus trap + restore, scroll lock

  const initial = (me?.user?.name || 'A')[0].toUpperCase();
  const roleLabel = me?.user?.roleLabel || me?.user?.role || '';
  const collapseLabel = collapsed ? t('shell.expand', 'Expand sidebar') : t('nav.collapse', 'Collapse sidebar');
  const hide = collapsed ? 'lg:hidden' : '';

  return (
    <aside
      ref={drawerRef}
      role={mobileOpen ? 'dialog' : undefined}
      aria-modal={mobileOpen ? 'true' : undefined}
      tabIndex={-1}
      aria-label={t('shell.primary', 'Primary')}
      className={`fixed inset-y-3 left-3 z-40 flex w-[min(280px,calc(100vw-24px))] shrink-0 flex-col transition-[transform,width,visibility] duration-200 ease-out lg:static lg:inset-auto lg:my-3 lg:ml-3 lg:translate-x-0 lg:visible ${
        collapsed ? 'lg:w-[72px] snav-rail' : 'lg:w-[240px]'
      } ${mobileOpen ? 'translate-x-0 visible' : '-translate-x-[calc(100%+24px)] invisible'}`}
    >
      <div className="shell-panel rounded-shell flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Brand */}
        <div className={`flex shrink-0 items-center gap-3 px-4 pb-3 pt-4 ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}>
          <span className="brand-gradient flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ring-1 ring-inset ring-white/20">
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <div className={`min-w-0 flex-1 ${hide}`}>
            <p className="text-card-title truncate !text-sm leading-tight">{t('shell.brand', 'Counsellor Platform')}</p>
            <span className="tone-brand tone-chip mt-1 inline-flex max-w-full items-center truncate rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none">
              {roleLabel}
            </span>
          </div>
          <button type="button" onClick={closeMobile} aria-label={t('shell.closeMenu', 'Close menu')} className="snav-icon-btn lg:hidden">
            <X size={18} />
          </button>
        </div>
        <div className="mx-4 h-px bg-line" />

        {/* Menu */}
        <nav aria-label={t('shell.mainNav', 'Main navigation')} className="scrollbar-none scroll-hover flex-1 overflow-y-auto px-3 pb-3 pt-4">
          {sections.map((section) => {
            const style = SECTION_STYLE[section.section] || { tone: 'indigo', key: '' };
            const title = t(style.key, section.section);
            const nt = NAV_TONE[style.tone] || NAV_TONE.indigo;
            return (
              <div key={section.section} className="mb-4">
                <p className={`text-eyebrow mb-1.5 flex items-center gap-2 px-3 !text-[11px] !font-medium opacity-90 ${collapsed ? 'lg:hidden' : ''}`}>
                  <span className={`inline-block h-1.5 w-1.5 rounded-full ${nt.dot}`} style={{ backgroundColor: 'var(--t)' }} />
                  {title}
                </p>
                {collapsed && <div className="mx-auto mb-2 hidden h-px w-6 rounded-full bg-line lg:block" />}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const label = t(item.labelKey, item.label);
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.end}
                        onClick={closeMobile}
                        aria-label={label}
                        {...bind(label, title)}
                        className={({ isActive }) => `snav-item group tone-${style.tone} ${isActive ? 'is-active' : ''}`}
                      >
                        <span className="snav-well">
                          <Icon size={18} />
                        </span>
                        <span className="snav-label truncate">{label}</span>
                        <span className="snav-dot" aria-hidden="true" />
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* User card + sign out */}
        <div className="shrink-0 p-3">
          <div className={`flex items-center gap-3 rounded-2xl bg-surface-2 p-2 ring-1 ring-inset ring-line ${collapsed ? 'lg:justify-center lg:bg-transparent lg:p-0 lg:ring-0' : ''}`}>
            <span
              className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white ring-2 ring-[var(--surface-solid)]"
              title={collapsed ? me?.user?.name : undefined}
            >
              {initial}
            </span>
            <div className={`min-w-0 flex-1 ${hide}`}>
              <p className="truncate text-[13px] font-semibold text-fg" title={me?.user?.name}>
                {me?.user?.name}
              </p>
              <p className="text-caption truncate !text-[11px]" title={me?.user?.email}>
                {me?.user?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={logout}
            aria-label={t('nav.logout', 'Sign out')}
            {...bind(t('nav.logout', 'Sign out'))}
            className={`snav-icon-btn snav-logout mt-2 w-full gap-2 bg-surface-2/60 px-4 text-[13px] font-medium ring-1 ring-inset ring-line ${collapsed ? 'lg:mx-auto lg:w-11 lg:px-0' : ''}`}
          >
            <LogOut size={18} />
            <span className={hide}>{t('nav.logout', 'Sign out')}</span>
          </button>
        </div>
      </div>

      <button type="button" onClick={toggleCollapsed} aria-label={collapseLabel} aria-expanded={!collapsed} title={collapseLabel} className="rail-toggle hidden lg:flex">
        {collapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
      </button>
      {tipNode}
    </aside>
  );
}
