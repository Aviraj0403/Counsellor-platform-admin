import { Megaphone } from 'lucide-react';
import { Guard } from '../auth';
import MetaSettings from './pages/MetaSettings';

export default {
  key: 'metaAds',
  routes: [{ path: '/integrations/meta', element: <Guard scope="tenant" perm="integrations:manage" module="metaAds"><MetaSettings /></Guard> }],
  nav: [{ section: 'My organisation', order: 60, to: '/integrations/meta', label: 'Meta Ads', icon: Megaphone, scope: 'tenant', perm: 'integrations:manage', module: 'metaAds' }],
};
