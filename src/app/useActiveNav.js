import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import useVisibleNav from './useVisibleNav';

/** The most specific menu entry (and its section) for the current URL, or null. Used for the page icon and the sidebar highlight. */
export default function useActiveNav() {
  const sections = useVisibleNav();
  const { pathname } = useLocation();
  return useMemo(() => {
    let best = null;
    for (const section of sections) {
      for (const item of section.items) {
        const hit = item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
        if (hit && (!best || item.to.length > best.item.to.length)) best = { item, section: section.section };
      }
    }
    return best;
  }, [sections, pathname]);
}
