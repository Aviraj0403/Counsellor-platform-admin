import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth';
import useModalA11y from '../shared/hooks/useModalA11y.js';
import { useI18n } from '../shared/i18n/languageContext.js';
import { BrandMark } from '../shared/ui/BrandLogo.jsx';
import OrgAvatar from '../shared/ui/OrgAvatar.jsx';
import { NAV_TONE } from '../shared/ui/tones.js';
import { useRailTip } from '../shared/ui/RailTip.jsx';
import useVisibleNav from './useVisibleNav';

// Each menu section gets its own accent (the colours follow the active colour theme).
const SECTION_STYLE = {
  Overview: { tone: 'rose', key: 'section.overview' },
  Organisations: { tone: 'violet', key: 'section.organisations' },
  'Revenue and billing': { tone: 'emerald', key: 'section.revenue' },
  'Research and insights': { tone: 'sky', key: 'section.researchInsights' },
  'Platform settings': { tone: 'amber', key: 'section.platformSettings' },
  'Lead Engine & Outreach': { tone: 'orange', key: 'section.leadEngine' },
  'Admissions & Counselling': { tone: 'violet', key: 'section.admissions' },
  'Growth & Channels': { tone: 'rose', key: 'section.marketing' },
  'Finance & Settlements': { tone: 'emerald', key: 'section.finance' },
  'Developers & Integrations': { tone: 'sky', key: 'section.developers' },
  'My organisation': { tone: 'teal', key: 'section.organisation' },
  Account: { tone: 'teal', key: 'section.account' },
};

/** Floating, collapsible sidebar (icon rail on desktop, drawer on phones). Same look and behaviour as the ecommerce admin. */
export default function Sidebar({ collapsed = false, mobileOpen = false, toggleCollapsed, closeMobile }) {
  const { me, staff, acting, organisation, logout } = useAuth();
  const { t } = useI18n();
  const sections = useVisibleNav();
  const { pathname } = useLocation();
  // Highlight only the most specific menu entry for this URL (so /organisations/onboard does not also light up /organisations).
  const activeTo = sections
    .flatMap((sec) => sec.items)
    .filter((i) => (i.end ? pathname === i.to : pathname === i.to || pathname.startsWith(`${i.to}/`)))
    .sort((a, b) => b.to.length - a.to.length)[0]?.to;
  const { bind, node: tipNode } = useRailTip(collapsed);
  const drawerRef = useModalA11y(mobileOpen, closeMobile); // phone drawer: Escape, focus trap + restore, scroll lock

  const initial = (staff?.name || 'A')[0].toUpperCase();
  // Inside an organisation (its own user, or platform staff acting as it) the block shows THAT organisation, like the ecommerce store block.
  const orgName = organisation?.name || acting?.tenantName || '';
  const roleLabel = acting ? t('acting.support', 'Platform support') : me?.user?.roleLabel || me?.user?.role || '';
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
          {orgName ? (
            <OrgAvatar name={orgName} logoUrl={organisation?.logoUrl} brandColor={organisation?.brandColor} size="md" />
          ) : (
            <BrandMark size="md" />
          )}
          <div className={`min-w-0 flex-1 ${hide}`}>
            {orgName ? (
              <p className="text-card-title line-clamp-2 break-words !text-sm leading-tight" title={orgName}>{orgName}</p>
            ) : (
              <p className="truncate text-[15px] leading-none tracking-tight text-fg" style={{ fontWeight: 800 }}>
                FAST<span className="text-brand-500">ADMISSION</span>
              </p>
            )}
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
        <nav aria-label={t('shell.mainNav', 'Main navigation')} className="scrollbar-none scroll-hover nav-fade flex-1 overflow-y-auto px-3 pb-3 pt-4">
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
                        className={() => `snav-item group tone-${style.tone} ${item.to === activeTo ? 'is-active' : ''}`}
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
              title={collapsed ? staff?.name : undefined}
            >
              {initial}
            </span>
            <div className={`min-w-0 flex-1 ${hide}`}>
              <p className="truncate text-[13px] font-semibold text-fg" title={staff?.name}>
                {staff?.name}
              </p>
              <p className="text-caption truncate !text-[11px]" title={staff?.email}>
                {staff?.email}
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
