import { BookOpen } from 'lucide-react';
import { Guard } from '../auth';
import Ledger from './pages/Ledger';

export default {
  key: 'ledger',
  routes: [{ path: '/ledger', element: <Guard scope="tenant" perm="ledger:read" module="ledger"><Ledger /></Guard> }],
  nav: [{ section: 'Finance & Settlements', order: 20, to: '/ledger', label: 'Ledger', labelKey: 'nav.ledger', icon: BookOpen, scope: 'tenant', perm: 'ledger:read', module: 'ledger' }],
};
