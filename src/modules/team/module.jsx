import { Building, Users } from 'lucide-react';
import { Guard } from '../auth';
import OrganisationProfile from './pages/OrganisationProfile';
import Team from './pages/Team';

export default {
  key: 'team',
  routes: [
    { path: '/team', element: <Guard scope="tenant" perm="team:read" module="team"><Team /></Guard> },
    { path: '/organisation-profile', element: <Guard scope="tenant" perm="team:manage"><OrganisationProfile /></Guard> },
  ],
  nav: [
    { section: 'My organisation', order: 20, to: '/organisation-profile', label: 'Organisation profile', labelKey: 'nav.organisationProfile', icon: Building, scope: 'tenant', perm: 'team:manage' },
    { section: 'My organisation', order: 30, to: '/team', label: 'Team & roles', labelKey: 'nav.team', icon: Users, scope: 'tenant', perm: 'team:read', module: 'team' },
  ],
};
