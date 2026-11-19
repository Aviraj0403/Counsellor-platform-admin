import { Building2, Receipt, Tag, Wallet } from 'lucide-react';
import { Guard } from '../auth';
import CompanySettings from './pages/CompanySettings';
import Costs from './pages/Costs';
import Invoices from './pages/Invoices';
import Plans from './pages/Plans';

export default {
  key: 'billing',
  routes: [
    { path: '/plans', element: <Guard scope="platform" perm="platform:billing:manage"><Plans /></Guard> },
    { path: '/invoices', element: <Guard scope="platform" perm="platform:billing:manage"><Invoices /></Guard> },
    { path: '/costs', element: <Guard scope="platform" perm="platform:costs:manage"><Costs /></Guard> },
    { path: '/settings/company', element: <Guard scope="platform" perm="platform:settings:manage"><CompanySettings /></Guard> },
  ],
  nav: [
    { section: 'Revenue and billing', order: 20, to: '/plans', label: 'Plans & pricing', labelKey: 'nav.plans', icon: Tag, scope: 'platform', perm: 'platform:billing:manage' },
    { section: 'Revenue and billing', order: 30, to: '/invoices', label: 'Invoices', labelKey: 'nav.invoices', icon: Receipt, scope: 'platform', perm: 'platform:billing:manage' },
    { section: 'Revenue and billing', order: 40, to: '/costs', label: 'Platform costs', labelKey: 'nav.costs', icon: Wallet, scope: 'platform', perm: 'platform:costs:manage' },
    { section: 'Platform settings', order: 50, to: '/settings/company', label: 'Company settings', icon: Building2, scope: 'platform', perm: 'platform:settings:manage' },
  ],
};
