import { ClipboardList, Sparkles, Gift } from 'lucide-react';
import { Guard } from '../auth';
import LeadDetail from './pages/LeadDetail';
import Leads from './pages/Leads';
import PoptinSettings from './pages/PoptinSettings';
import Referrals from './pages/Referrals';

export default {
  key: 'leads',
  routes: [
    { path: '/leads', element: <Guard scope="tenant" perm="leads:read" module="leads"><Leads /></Guard> },
    { path: '/leads/popups', element: <Guard scope="tenant" perm="leads:read" module="leads"><PoptinSettings /></Guard> },
    { path: '/leads/referrals', element: <Guard scope="tenant" perm="leads:read" module="leads"><Referrals /></Guard> },
    { path: '/leads/:id', element: <Guard scope="tenant" perm="leads:read" module="leads"><LeadDetail /></Guard> },
  ],
  nav: [
    { section: 'Leads and sales', order: 10, to: '/leads', label: 'Leads', labelKey: 'nav.leads', icon: ClipboardList, scope: 'tenant', perm: 'leads:read', module: 'leads' },
    { section: 'Leads and sales', order: 11, to: '/leads/popups', label: 'Lead popups', labelKey: 'nav.leadPopups', icon: Sparkles, scope: 'tenant', perm: 'leads:read', module: 'leads' },
    { section: 'Leads and sales', order: 12, to: '/leads/referrals', label: 'Referral program', labelKey: 'nav.referrals', icon: Gift, scope: 'tenant', perm: 'leads:read', module: 'leads' },
  ],
};
