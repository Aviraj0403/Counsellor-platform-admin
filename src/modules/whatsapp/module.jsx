import { MessageCircle } from 'lucide-react';
import { Guard } from '../auth';
import Whatsapp from './pages/Whatsapp';

export default {
  key: 'whatsapp',
  routes: [{ path: '/whatsapp', element: <Guard scope="tenant" perm="whatsapp:send" module="whatsapp"><Whatsapp /></Guard> }],
  nav: [{ section: 'Growth & Channels', order: 10, to: '/whatsapp', label: 'WhatsApp', icon: MessageCircle, scope: 'tenant', perm: 'whatsapp:send', module: 'whatsapp' }],
};
