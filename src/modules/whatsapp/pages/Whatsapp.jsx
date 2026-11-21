import { useEffect, useState } from 'react';
import { Card, PageHeader } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as api from '../api';
import ComposeTab from '../components/ComposeTab';
import MessageLogTab from '../components/MessageLogTab';
import RulesTab from '../components/RulesTab';
import StatusStrip from '../components/StatusStrip';
import TemplatesTab from '../components/TemplatesTab';
import CampaignsTab from '../components/CampaignsTab';

/** WhatsApp for an organisation: templates, automation rules, the message log and a send box. Always sent from the shared platform number. */
export default function Whatsapp() {
  const { can } = useAuth();
  const manage = can('integrations:manage');
  const tabs = [
    ['templates', 'Templates'],
    ...(manage ? [['campaigns', 'Broadcast Campaigns'], ['rules', 'Automation rules']] : []),
    ['log', 'Message log'],
    ['send', 'Send message'],
  ];
  const [tab, setTab] = useState('templates');
  const [latest, setLatest] = useState(null);
  const [logKey, setLogKey] = useState(0);

  // the status strip reads the newest message, even before the Message log tab is opened
  useEffect(() => {
    api.listMessages({ page: 1, limit: 1 }).then((r) => setLatest(r.data.items[0] || null)).catch(() => {});
  }, [logKey]);

  return (
    <>
      <PageHeader title="WhatsApp" subtitle="Template messages to leads and students who agreed to be contacted. Each sent message is billed to your organisation." />
      <StatusStrip latest={latest} />
      <nav role="tablist" aria-label="WhatsApp sections" className="mb-4 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map(([k, label]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`-mb-px cursor-pointer whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${tab === k ? 'border-brand-500 text-fg' : 'border-transparent text-fg-muted hover:text-fg'}`}
          >
            {label}
          </button>
        ))}
      </nav>
      <Card>
        <div role="tabpanel" aria-label={tab}>
          {tab === 'templates' && <TemplatesTab manage={manage} />}
          {tab === 'campaigns' && manage && <CampaignsTab manage={manage} />}
          {tab === 'rules' && manage && <RulesTab />}
          {tab === 'log' && <MessageLogTab onLatest={setLatest} refreshKey={logKey} />}
          {tab === 'send' && <ComposeTab onSent={() => { setLogKey((k) => k + 1); setTab('log'); }} />}
        </div>
      </Card>
    </>
  );
}
