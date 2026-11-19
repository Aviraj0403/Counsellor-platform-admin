import { Globe } from 'lucide-react';
import { Guard } from '../auth';
import Domains from './pages/Domains';

const perm = 'platform:domains:manage';

export default {
  key: 'domains',
  routes: [{ path: '/domains', element: <Guard scope="platform" perm={perm}><Domains /></Guard> }],
  nav: [{ section: 'Platform', order: 70, to: '/domains', label: 'Allowed domains', icon: Globe, scope: 'platform', perm }],
};
