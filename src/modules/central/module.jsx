import { DatabaseZap } from 'lucide-react';
import { Guard } from '../auth';
import Central from './pages/Central';

const perm = 'platform:central:read';

export default {
  key: 'central',
  routes: [{ path: '/central', element: <Guard scope="platform" perm={perm}><Central /></Guard> }],
  nav: [{ section: 'Organisations', order: 11, to: '/central', label: 'Central data', labelKey: 'nav.central', icon: DatabaseZap, scope: 'platform', perm }],
};
