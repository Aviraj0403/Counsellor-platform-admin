import useAuth from '../hooks/useAuth';
import ModuleOff from '../pages/ModuleOff';
import Unauthorized from '../pages/Unauthorized';

/**
 * Wraps a page. Mirrors the API's own checks (the API is the real gate, this only gives a friendly message
 * instead of a failing screen). perm = role permission, module = feature switched on, scope = platform | tenant.
 */
export default function Guard({ perm, module, scope, children }) {
  const { me, can, hasModule } = useAuth();
  if (scope && me.scope !== scope) return <Unauthorized />;
  if (perm && !can(perm)) return <Unauthorized />;
  if (module && me.scope === 'tenant' && !hasModule(module)) return <ModuleOff module={module} />;
  return children;
}
