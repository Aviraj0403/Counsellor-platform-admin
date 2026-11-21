import { Building2, Calculator } from 'lucide-react';
import { Guard } from '../auth';
import CollegeDetail from './pages/CollegeDetail';
import Colleges from './pages/Colleges';
import Shortlist from './pages/Shortlist';
import CollegePredictor from './pages/CollegePredictor';

export default {
  key: 'colleges',
  routes: [
    { path: '/colleges', element: <Guard scope="tenant" perm="colleges:read" module="colleges"><Colleges /></Guard> },
    { path: '/colleges/shortlist', element: <Guard scope="tenant" perm="colleges:read" module="colleges"><Shortlist /></Guard> },
    { path: '/colleges/predictor', element: <Guard scope="tenant" perm="colleges:read" module="colleges"><CollegePredictor /></Guard> },
    { path: '/colleges/:id', element: <Guard scope="tenant" perm="colleges:read" module="colleges"><CollegeDetail /></Guard> },
  ],
  nav: [
    { section: 'Admissions', order: 14, to: '/colleges', label: 'Colleges', icon: Building2, scope: 'tenant', perm: 'colleges:read', module: 'colleges' },
    { section: 'Admissions', order: 15, to: '/colleges/shortlist', label: 'Shortlist tool', icon: Building2, scope: 'tenant', perm: 'colleges:read', module: 'colleges' },
    { section: 'Admissions', order: 16, to: '/colleges/predictor', label: 'College predictor', icon: Calculator, scope: 'tenant', perm: 'colleges:read', module: 'colleges' },
  ],
};
