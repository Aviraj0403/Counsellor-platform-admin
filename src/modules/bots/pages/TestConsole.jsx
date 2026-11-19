import { useState } from 'react';
import { Badge, Button, Card, Input, PageHeader } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import * as api from '../api';

export default function TestConsole() {
  const { t } = useI18n();
  const [msg, setMsg] = useState('');
  const [log, setLog] = useState([]);
  const [conv, setConv] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState(null);

  const send = async (e) => {
    e.preventDefault();
    const text = msg.trim();
    if (!text) return;
    setBusy(true);
    setMsg('');
    setLog((l) => [...l, { who: 'You', text }]);
    try {
      const { data } = await api.testMessage({ message: text, ...(conv && { conversationId: conv }) });
      setConv(data.conversationId);
      setState(data);
      setLog((l) => [...l, { who: 'Assistant', text: data.reply }]);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title={t('page.botTest', 'Test the assistant')} subtitle="Talk to the assistant the way a student would. This uses the real AI (and counts towards cost) and creates a chat marked Staff test. A real lead is created if you give a name and phone number." />
      <Card>
        <div className="mb-3 max-h-96 min-h-40 space-y-2 overflow-y-auto rounded-lg border border-line p-3 text-sm">
          {log.length === 0 && <p className="text-fg-muted">Say hello to begin.</p>}
          {log.map((m, i) => <div key={i} className={m.who === 'You' ? '' : 'text-fg-muted'}><span className="mr-2 text-xs uppercase tracking-wide">{m.who}</span>{m.text}</div>)}
        </div>
        {state && <div className="mb-3 flex flex-wrap gap-2 text-sm">{state.offline && <Badge tone="red">Offline: no AI key on the server</Badge>}{state.limited && <Badge tone="amber">Daily or monthly limit reached</Badge>}{state.handedOff && <Badge tone="amber">Handed to a counsellor ({state.handoffReason})</Badge>}</div>}
        <form onSubmit={send} className="flex gap-2">
          <Input value={msg} onChange={(e) => setMsg(e.target.value)} maxLength={1000} placeholder="Type a message" aria-label="Message" />
          <Button type="submit" loading={busy}>Send</Button>
          <Button variant="secondary" onClick={() => { setLog([]); setConv(undefined); setState(null); }}>New chat</Button>
        </form>
      </Card>
    </div>
  );
}
