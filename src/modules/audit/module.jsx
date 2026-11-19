import { History } from 'lucide-react';
import { Guard } from '../auth';
import Audit from './pages/Audit';
import PlatformAudit from './pages/PlatformAudit';

export default {
  key: 'audit',
  routes: [
    { path: '/platform-audit', element: <Guard scope="platform" perm="platform:audit:read"><PlatformAudit /></Guard> },
    { path: '/audit', element: <Guard scope="tenant" perm="audit:read"><Audit /></Guard> },
  ],
  nav: [
    { section: 'Platform', order: 60, to: '/platform-audit', label: 'Platform audit', labelKey: 'nav.platformAudit', icon: History, scope: 'platform', perm: 'platform:audit:read' },
    { section: 'My organisation', order: 40, to: '/audit', label: 'Activity log', labelKey: 'nav.activity', icon: History, scope: 'tenant', perm: 'audit:read' },
  ],
};
