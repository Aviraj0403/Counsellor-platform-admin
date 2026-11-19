import { ClipboardList } from 'lucide-react';
import { Guard } from '../auth';
import LeadDetail from './pages/LeadDetail';
import Leads from './pages/Leads';

export default {
  key: 'leads',
  routes: [
    { path: '/leads', element: <Guard scope="tenant" perm="leads:read" module="leads"><Leads /></Guard> },
    { path: '/leads/:id', element: <Guard scope="tenant" perm="leads:read" module="leads"><LeadDetail /></Guard> },
  ],
  nav: [{ section: 'Leads and sales', order: 10, to: '/leads', label: 'Leads', labelKey: 'nav.leads', icon: ClipboardList, scope: 'tenant', perm: 'leads:read', module: 'leads' }],
};
