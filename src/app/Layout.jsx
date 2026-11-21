import { useEffect, useMemo, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth';
import { useI18n } from '../shared/i18n/languageContext.js';
import { useDensityAttribute } from '../shared/theme/themeContext.js';
import Ambient from '../shared/ui/Ambient.jsx';
import { Spinner } from '../shared/ui/ui';
import ActingBanner from './ActingBanner';
import Breadcrumbs from './Breadcrumbs';
import Header from './Header';
import { SECTION_STYLE } from './sectionStyle';
import Sidebar from './Sidebar';
import useActiveNav from './useActiveNav';
import { PageMetaContext } from '../shared/ui/pageMeta.js';

const COLLAPSE_KEY = 'cp_sidebar_collapsed';
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};

/** App shell for every signed-in screen: floating sidebar, sticky header, breadcrumb pill, themed canvas. */
export default function Layout() {
  const { me, loading, acting } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(readCollapsed);
  useDensityAttribute();
  const active = useActiveNav();
  const pageMeta = useMemo(() => (active && active.item.to !== '/' ? { icon: active.item.icon, tone: SECTION_STYLE[active.section]?.tone || 'indigo' } : null), [active]);

  const closeMobile = () => setMobileOpen(false);
  const toggleMobile = () => setMobileOpen((p) => !p);
  const toggleCollapsed = () =>
    setCollapsed((p) => {
      const next = !p;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? '1' : '0');
      } catch {
        /* storage unavailable: the choice is simply not remembered */
      }
      return next;
    });

  // close the phone drawer when the window grows to desktop width
  useEffect(() => {
    const onResize = () => window.innerWidth >= 1024 && setMobileOpen(false);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // the API stopped accepting the acting organisation (Axios cleared it): the page we were on belongs to it, so go home
  useEffect(() => {
    const onEnded = () => navigate('/', { replace: true });
    window.addEventListener('acting:ended', onEnded);
    return () => window.removeEventListener('acting:ended', onEnded);
  }, [navigate]);

  if (loading) return <Spinner label={t('common.loading', 'Loading...')} />;
  if (!me) return <Navigate to="/signin" replace state={{ from: location.pathname }} />;

  return (
    <div className="bg-mesh relative isolate flex h-dvh w-full flex-col overflow-hidden text-fg">
      <Ambient />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[60] focus:rounded-xl focus:bg-brand-600 focus:px-4 focus:py-2 focus:text-sm focus:text-white">
        {t('shell.skip', 'Skip to content')}
      </a>

      <div className="relative z-10 flex min-h-0 w-full flex-1 overflow-hidden">
        <div
          aria-hidden="true"
          onClick={closeMobile}
          className={`shell-scrim fixed inset-0 z-30 transition-opacity duration-150 lg:hidden ${mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        />
        <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} toggleCollapsed={toggleCollapsed} closeMobile={closeMobile} />

        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          <Header toggleMobile={toggleMobile} mobileOpen={mobileOpen} collapsed={collapsed} toggleCollapsed={toggleCollapsed} />
          <ActingBanner />
          <main id="main-content" className="min-w-0 flex-1 overflow-y-auto scroll-smooth">
            <div className="page-container flex min-h-full min-w-0 flex-col">
              <div className="mb-4 flex min-w-0">
                <Breadcrumbs />
              </div>
              <div className="min-w-0 flex-1">
                <PageMetaContext.Provider value={pageMeta}>
                  <Outlet key={acting?.tenantId || 'console'} />
                </PageMetaContext.Provider>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
