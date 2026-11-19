import { ListChecks } from 'lucide-react';
import { Guard } from '../auth';
import MyTasks from './pages/MyTasks';

export default {
  key: 'followups',
  routes: [{ path: '/followups', element: <Guard scope="tenant" perm="followups:read" module="followups"><MyTasks /></Guard> }],
  nav: [{ section: 'My organisation', order: 11, to: '/followups', label: 'My tasks', icon: ListChecks, scope: 'tenant', perm: 'followups:read', module: 'followups' }],
};
