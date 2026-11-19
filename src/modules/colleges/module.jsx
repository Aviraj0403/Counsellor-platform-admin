import { Building2 } from 'lucide-react';
import { Guard } from '../auth';
import CollegeDetail from './pages/CollegeDetail';
import Colleges from './pages/Colleges';
import Shortlist from './pages/Shortlist';

export default {
  key: 'colleges',
  routes: [
    { path: '/colleges', element: <Guard scope="tenant" perm="colleges:read" module="colleges"><Colleges /></Guard> },
    { path: '/colleges/shortlist', element: <Guard scope="tenant" perm="colleges:read" module="colleges"><Shortlist /></Guard> },
    { path: '/colleges/:id', element: <Guard scope="tenant" perm="colleges:read" module="colleges"><CollegeDetail /></Guard> },
  ],
  nav: [
    { section: 'My organisation', order: 14, to: '/colleges', label: 'Colleges', icon: Building2, scope: 'tenant', perm: 'colleges:read', module: 'colleges' },
    { section: 'My organisation', order: 15, to: '/colleges/shortlist', label: 'Shortlist tool', icon: Building2, scope: 'tenant', perm: 'colleges:read', module: 'colleges' },
  ],
};
