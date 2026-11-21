import { ClipboardList, Sparkles, Gift, Share2, School } from 'lucide-react';
import { Guard } from '../auth';
import LeadDetail from './pages/LeadDetail';
import Leads from './pages/Leads';
import PoptinSettings from './pages/PoptinSettings';
import Referrals from './pages/Referrals';
import LeadSourcesHub from './pages/LeadSourcesHub';
import Partners from './pages/Partners';

export default {
  key: 'leads',
  routes: [
    { path: '/leads', element: <Guard scope="tenant" perm="leads:read" module="leads"><Leads /></Guard> },
    { path: '/leads/sources', element: <Guard scope="tenant" perm="leads:read" module="leads"><LeadSourcesHub /></Guard> },
    { path: '/leads/partners', element: <Guard scope="tenant" perm="leads:read" module="leads"><Partners /></Guard> },
    { path: '/leads/popups', element: <Guard scope="tenant" perm="leads:read" module="leads"><PoptinSettings /></Guard> },
    { path: '/leads/referrals', element: <Guard scope="tenant" perm="leads:read" module="leads"><Referrals /></Guard> },
    { path: '/leads/:id', element: <Guard scope="tenant" perm="leads:read" module="leads"><LeadDetail /></Guard> },
  ],
  nav: [
    { section: 'Lead Engine & Outreach', order: 9, to: '/leads/sources', label: 'Lead Sources Hub', labelKey: 'nav.leadSources', icon: Share2, scope: 'tenant', perm: 'leads:read', module: 'leads' },
    { section: 'Lead Engine & Outreach', order: 10, to: '/leads', label: 'Leads', labelKey: 'nav.leads', icon: ClipboardList, scope: 'tenant', perm: 'leads:read', module: 'leads' },
    { section: 'Lead Engine & Outreach', order: 11, to: '/leads/partners', label: 'School & Coaching Partners', labelKey: 'nav.partners', icon: School, scope: 'tenant', perm: 'leads:read', module: 'leads' },
    { section: 'Lead Engine & Outreach', order: 12, to: '/leads/popups', label: 'Lead popups', labelKey: 'nav.leadPopups', icon: Sparkles, scope: 'tenant', perm: 'leads:read', module: 'leads' },
    { section: 'Lead Engine & Outreach', order: 13, to: '/leads/referrals', label: 'Referral program', labelKey: 'nav.referrals', icon: Gift, scope: 'tenant', perm: 'leads:read', module: 'leads' },
  ],
};
