import { Coins } from 'lucide-react';
import { Guard } from '../auth';
import Commissions from './pages/Commissions';

export default {
  key: 'commissions',
  routes: [{ path: '/commissions', element: <Guard scope="tenant" perm="commissions:read" module="commissions"><Commissions /></Guard> }],
  nav: [{ section: 'Finance', order: 33, to: '/commissions', label: 'Commissions', icon: Coins, scope: 'tenant', perm: 'commissions:read', module: 'commissions' }],
};
