import { KeyRound, Webhook } from 'lucide-react';
import { Guard } from '../auth';
import ApiKeys from './pages/ApiKeys';
import Webhooks from './pages/Webhooks';

export default {
  key: 'publicApi',
  routes: [
    { path: '/integrations/api-keys', element: <Guard scope="tenant" perm="integrations:manage" module="publicApi"><ApiKeys /></Guard> },
    { path: '/integrations/webhooks', element: <Guard scope="tenant" perm="integrations:manage" module="publicApi"><Webhooks /></Guard> },
  ],
  nav: [
    { section: 'Developers & Integrations', order: 61, to: '/integrations/api-keys', label: 'API keys', icon: KeyRound, scope: 'tenant', perm: 'integrations:manage', module: 'publicApi' },
    { section: 'Developers & Integrations', order: 62, to: '/integrations/webhooks', label: 'Webhooks', icon: Webhook, scope: 'tenant', perm: 'integrations:manage', module: 'publicApi' },
  ],
};
