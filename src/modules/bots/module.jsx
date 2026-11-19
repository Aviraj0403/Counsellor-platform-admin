import { BarChart3, MessageSquare, Settings2, TestTube2 } from 'lucide-react';
import { Guard } from '../auth';
import BotSettings from './pages/BotSettings';
import BotSummary from './pages/BotSummary';
import Conversations from './pages/Conversations';
import TestConsole from './pages/TestConsole';

const g = (perm, el) => <Guard scope="tenant" perm={perm} module="aiBot">{el}</Guard>;

export default {
  key: 'aiBot',
  routes: [
    { path: '/bots', element: g('bots:read', <Conversations />) },
    { path: '/bots/summary', element: g('bots:read', <BotSummary />) },
    { path: '/bots/settings', element: g('bots:read', <BotSettings />) },
    { path: '/bots/test', element: g('bots:manage', <TestConsole />) },
  ],
  nav: [
    { section: 'Counselling', order: 30, to: '/bots', label: 'Assistant chats', labelKey: 'nav.botConversations', icon: MessageSquare, scope: 'tenant', perm: 'bots:read', module: 'aiBot' },
    { section: 'Counselling', order: 31, to: '/bots/summary', label: 'Assistant results', labelKey: 'nav.botSummary', icon: BarChart3, scope: 'tenant', perm: 'bots:read', module: 'aiBot' },
    { section: 'Counselling', order: 32, to: '/bots/settings', label: 'Assistant settings', labelKey: 'nav.botSettings', icon: Settings2, scope: 'tenant', perm: 'bots:read', module: 'aiBot' },
    { section: 'Counselling', order: 33, to: '/bots/test', label: 'Test the assistant', labelKey: 'nav.botTest', icon: TestTube2, scope: 'tenant', perm: 'bots:manage', module: 'aiBot' },
  ],
};
