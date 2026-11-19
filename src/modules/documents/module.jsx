import { ShieldCheck } from 'lucide-react';
import { Guard } from '../auth';
import DocumentQueue from './pages/DocumentQueue';

export default {
  key: 'documents',
  routes: [{ path: '/documents/queue', element: <Guard scope="tenant" perm="documents:verify" module="documents"><DocumentQueue /></Guard> }],
  nav: [{ section: 'My organisation', order: 17, to: '/documents/queue', label: 'Document verification', icon: ShieldCheck, scope: 'tenant', perm: 'documents:verify', module: 'documents' }],
};
