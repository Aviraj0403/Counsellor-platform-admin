import { Building2, UserPlus } from 'lucide-react';
import { Guard } from '../auth';
import OrganisationDetail from './pages/OrganisationDetail';
import Organisations from './pages/Organisations';
import OnboardOrganisation from './pages/OnboardOrganisation';

const perm = 'platform:tenants:manage';

export default {
  key: 'organisations',
  routes: [
    { path: '/organisations', element: <Guard scope="platform" perm={perm}><Organisations /></Guard> },
    { path: '/organisations/onboard', element: <Guard scope="platform" perm={perm}><OnboardOrganisation /></Guard> },
    { path: '/organisations/:id/:tab?', element: <Guard scope="platform" perm={perm}><OrganisationDetail /></Guard> },
  ],
  nav: [
    { section: 'Organisations', order: 10, to: '/organisations', label: 'Organisations', labelKey: 'nav.organisations', icon: Building2, scope: 'platform', perm },
    { section: 'Organisations', order: 11, to: '/organisations/onboard', label: 'Onboard organisation', labelKey: 'nav.onboard', icon: UserPlus, scope: 'platform', perm },
  ],
};
