import { Building2 } from 'lucide-react';
import { Guard } from '../auth';
import OrganisationDetail from './pages/OrganisationDetail';
import Organisations from './pages/Organisations';

const perm = 'platform:tenants:manage';

export default {
  key: 'organisations',
  routes: [
    { path: '/organisations', element: <Guard scope="platform" perm={perm}><Organisations /></Guard> },
    { path: '/organisations/:id', element: <Guard scope="platform" perm={perm}><OrganisationDetail /></Guard> },
  ],
  nav: [{ section: 'Organisations', order: 10, to: '/organisations', label: 'Organisations', labelKey: 'nav.organisations', icon: Building2, scope: 'platform', perm }],
};
