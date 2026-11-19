import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Modal, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useAuth } from '../../auth';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import * as api from '../api';

const BAND_TONE = { hot: 'red', warm: 'amber', cold: 'gray' };
const STATUS_TONE = { open: 'blue', handed_off: 'amber', closed: 'gray' };
const STATUS_LABEL = { open: 'Bot chatting', handed_off: 'With a counsellor', closed: 'Closed' };
const REASON = {
  keyword: 'Keyword', human_request: 'Asked for a person', frustration: 'Upset', minor_needs_guardian: 'Under 18, guardian needed',
  low_confidence: 'Bot unsure', model_failed: 'AI error', model_refused: 'AI declined', staff_takeover: 'Staff took over',
};
const when = (d) => (d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '');

function Transcript({ id, onClose, onChanged }) {
  const { can } = useAuth();
  const [c, setC] = useState(null);
  const [busy, setBusy] = useState(false);
  const load = useCallback(() => api.getConversation(id).then(({ data }) => setC(data)).catch((e) => { toastError(e); onClose(); }), [id, onClose]);
  useEffect(() => { load(); }, [load]);
  const act = async (fn, msg) => {
    setBusy(true);
    try {
      await fn(id);
      toast.success(msg);
      await load();
      onChanged();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };
  const manage = can('bots:manage');
  return (
    <Modal title="Chat" onClose={onClose}>
      {!c ? <Spinner /> : (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Badge tone={BAND_TONE[c.band]}>{c.band} · {c.score}/100</Badge>
            <Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>
            {c.handoff?.reason && <span className="text-fg-muted">Reason: {REASON[c.handoff.reason] || c.handoff.reason}</span>}
            {c.minorSuspected && <Badge tone="amber">May be under 18</Badge>}
          </div>
          <details className="text-sm">
            <summary className="cursor-pointer text-fg-secondary">Why this score</summary>
            <ul className="mt-1 list-disc pl-5 text-fg-muted">{c.scoreReasons.length ? c.scoreReasons.map((r) => <li key={r}>{r}</li>) : <li>Nothing known yet.</li>}</ul>
            <p className="mt-1 text-xs text-fg-muted">The score is worked out by fixed rules from what the student typed, not by the AI.</p>
          </details>
          {c.guardian?.name && <p className="text-sm text-fg-muted">Guardian: {c.guardian.name} {c.guardian.phone}</p>}
          <div className="max-h-80 space-y-2 overflow-y-auto rounded-lg border border-line p-3">
            {c.messages.length === 0 ? <Empty>No messages stored.</Empty> : c.messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'text-sm' : 'text-sm text-fg-muted'}>
                <span className="mr-2 text-xs uppercase tracking-wide">{m.role === 'user' ? 'Student' : 'Assistant'}</span>
                {m.text}
              </div>
            ))}
          </div>
          <p className="text-xs text-fg-muted">Phone numbers and e-mails the student typed are hidden here unless they are saved on the lead. Stored until {when(c.expiresAt)}.</p>
          {manage && c.status !== 'closed' && (
            <div className="flex gap-2">
              {c.status === 'open' && <Button loading={busy} onClick={() => act(api.takeover, 'You took over this chat.')}>Take over</Button>}
              <Button variant="secondary" loading={busy} onClick={() => act(api.closeConversation, 'Chat closed.')}>Close chat</Button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

export default function Conversations() {
  const { t } = useI18n();
  const { can } = useAuth();
  const [f, setF] = useState({ status: '', band: '', channel: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const load = useCallback(() => api.listConversations({ page, limit: 25, ...Object.fromEntries(Object.entries(f).filter(([, v]) => v)) }).then(({ data: d }) => setData(d)).catch(toastError), [page, f]);
  useEffect(() => { load(); }, [load]);
  const set = (k) => (e) => { setPage(1); setF({ ...f, [k]: e.target.value }); };
  const purge = async () => {
    try {
      const { data: r } = await api.purge();
      toast.success(`${r.deleted} expired chat(s) deleted.`);
      load();
    } catch (e) {
      toastError(e);
    }
  };
  return (
    <>
      <PageHeader title={t('page.botConversations', 'Assistant chats')} subtitle="Every chat the AI assistant has had, with a score and any hand-over to a counsellor." action={can('bots:manage') && <Button variant="secondary" onClick={purge}>Delete expired chats now</Button>} />
      <Card>
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Select value={f.status} onChange={set('status')} aria-label="Status"><option value="">Any status</option>{Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select>
          <Select value={f.band} onChange={set('band')} aria-label="Score"><option value="">Any score</option><option value="hot">Hot</option><option value="warm">Warm</option><option value="cold">Cold</option></Select>
          <Select value={f.channel} onChange={set('channel')} aria-label="Channel"><option value="">Any channel</option><option value="web">Website</option><option value="whatsapp">WhatsApp</option><option value="staff_test">Staff test</option></Select>
        </div>
        {!data ? <Spinner /> : data.items.length === 0 ? <Empty>No chats yet.</Empty> : (
          <>
            <Table head={['Last message', 'Channel', 'Score', 'Status', 'What they said last', '']}>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-2.5 whitespace-nowrap">{when(c.lastMessageAt)}</td>
                  <td className="px-3 py-2.5">{c.channel === 'web' ? 'Website' : c.channel === 'whatsapp' ? 'WhatsApp' : 'Staff test'}</td>
                  <td className="px-3 py-2.5"><Badge tone={BAND_TONE[c.band]}>{c.band} · {c.score}</Badge></td>
                  <td className="px-3 py-2.5"><Badge tone={STATUS_TONE[c.status]}>{STATUS_LABEL[c.status]}</Badge>{c.handoff?.reason && <span className="block text-xs text-fg-muted">{REASON[c.handoff.reason] || c.handoff.reason}</span>}</td>
                  <td className="px-3 py-2.5 max-w-xs truncate text-fg-muted">{c.lastText}</td>
                  <td className="px-3 py-2.5 text-right"><Button size="sm" variant="ghost" onClick={() => setOpen(c.id)}>Open</Button></td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
      {open && <Transcript id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </>
  );
}
