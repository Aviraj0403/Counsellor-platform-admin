import { Users } from 'lucide-react';
import { Guard } from '../auth';
import Team from './pages/Team';

export default {
  key: 'team',
  routes: [{ path: '/team', element: <Guard scope="tenant" perm="team:read" module="team"><Team /></Guard> }],
  nav: [{ section: 'My organisation', order: 30, to: '/team', label: 'Team & roles', labelKey: 'nav.team', icon: Users, scope: 'tenant', perm: 'team:read', module: 'team' }],
};
