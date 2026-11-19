import { BarChart3 } from 'lucide-react';
import { Guard } from '../auth';
import Reports from './pages/Reports';

export default {
  key: 'reports',
  routes: [{ path: '/reports', element: <Guard scope="tenant" perm="reports:read" module="reports"><Reports /></Guard> }],
  nav: [{ section: 'My organisation', order: 36, to: '/reports', label: 'Reports', icon: BarChart3, scope: 'tenant', perm: 'reports:read', module: 'reports' }],
};
