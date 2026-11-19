import { useLocation } from 'react-router-dom';
import { useI18n } from '../shared/i18n/languageContext.js';
import Breadcrumb from '../shared/ui/Breadcrumb.jsx';
import { NAV } from './navigation';

/** Breadcrumb pill built from the menu: /organisations/<id> -> Home > Organisations > Details. */
export default function Breadcrumbs() {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const labels = new Map(NAV.flatMap((s) => s.items).map((i) => [i.to, t(i.labelKey, i.label)]));
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length === 0) return null;

  const items = parts.map((seg, i) => {
    const to = `/${parts.slice(0, i + 1).join('/')}`;
    const label = labels.get(to) || (/^[0-9a-f]{24}$/i.test(seg) ? t('shell.details', 'Details') : seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, ' '));
    return { to, label };
  });

  return <Breadcrumb items={items} homeTo="/" homeLabel={t('shell.home', 'Home')} ariaLabel={t('shell.breadcrumb', 'Breadcrumb')} />;
}
