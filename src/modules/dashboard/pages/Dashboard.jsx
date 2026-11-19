import { Navigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import PlatformDashboard from './PlatformDashboard';
import TenantDashboard from './TenantDashboard';

/** Home. Portal users (a student, a college employee) land on their own page; platform staff and organisation users get their own dashboard. */
export default function Dashboard() {
  const { me, can } = useAuth();
  // the Super Admin role holds EVERY permission (including the portal ones), so portal redirects apply to organisation users only
  if (me.scope === 'tenant' && can('portal:student')) return <Navigate to="/my-applications" replace />;
  if (me.scope === 'tenant' && can('portal:college')) return <Navigate to="/college-applications" replace />;
  return me.scope === 'platform' ? <PlatformDashboard /> : <TenantDashboard />;
}
