import { BarChart3 } from 'lucide-react';
import { Guard } from '../auth';
import Insights from './pages/Insights';

const perm = 'platform:insights:read';

export default {
  key: 'insights',
  routes: [{ path: '/insights', element: <Guard scope="platform" perm={perm}><Insights /></Guard> }],
  nav: [{ section: 'Research and insights', order: 50, to: '/insights', label: 'Research', labelKey: 'nav.research', icon: BarChart3, scope: 'platform', perm }],
};
