import { FileText } from 'lucide-react';
import { Guard } from '../auth';
import ApplicationDetail from './pages/ApplicationDetail';
import Applications from './pages/Applications';

export default {
  key: 'applications',
  routes: [
    { path: '/applications', element: <Guard scope="tenant" perm="applications:read" module="applications"><Applications /></Guard> },
    { path: '/applications/:id', element: <Guard scope="tenant" perm="applications:read" module="applications"><ApplicationDetail /></Guard> },
  ],
  nav: [{ section: 'My organisation', order: 16, to: '/applications', label: 'Applications', icon: FileText, scope: 'tenant', perm: 'applications:read', module: 'applications' }],
};
