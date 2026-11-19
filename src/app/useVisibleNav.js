import { useAuth } from '../modules/auth';
import { NAV } from './navigation';

/** The menu for the logged-in person: each item must pass its perm / module / scope checks (see navigation.js). */
export default function useVisibleNav() {
  const { me, can, hasModule } = useAuth();
  if (!me) return [];
  // Students and college employees only ever see their own portal: no Home dashboard, only items tied to a portal permission or their account.
  const portalOnly = me.user?.role === 'student' || me.user?.role === 'college_user';
  const visible = (item) => {
    if (portalOnly && item.to === '/') return false;
    if (item.scope && item.scope !== me.scope) return false;
    if (item.perm && !can(item.perm)) return false;
    if (item.module && !hasModule(item.module)) return false;
    return true;
  };
  return NAV.map((s) => ({ ...s, items: s.items.filter(visible) })).filter((s) => s.items.length > 0);
}
