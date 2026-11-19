import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import * as api from '../api';

const EVENT_LABEL = {
  'lead.created': 'A new lead is created',
  'lead.stage_changed': 'A lead changes stage',
  'application.created': 'An application is created',
  'application.status_changed': 'An application changes status',
  'document.verified': 'A document is verified',
};
const STATUS_TONE = { delivered: 'green', retrying: 'amber', failed: 'red' };

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied.');
  } catch {
    toast('Select the text and copy it.');
  }
};

function CreateWebhook({ events, onClose, onCreated }) {
  const [url, setUrl] = useState('https://');
  const [picked, setPicked] = useState(['lead.created']);
  const [busy, setBusy] = useState(false);
  const toggle = (s) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.createWebhook({ url, events: picked });
      onCreated(data);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New webhook" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Web address (https only)" hint="Public addresses only. Internal or localhost addresses are refused."><Input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
        <Field label="Send me a message when">
          <div className="space-y-1.5">
            {events.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" checked={picked.includes(s)} onChange={() => toggle(s)} /> {EVENT_LABEL[s] || s}
              </label>
            ))}
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={!picked.length}>Create webhook</Button>
        </div>
      </form>
    </Modal>
  );
}

function ShowSecret({ created, onClose }) {
  return (
    <Modal title="Copy your signing secret now" onClose={onClose}>
      <p className="mb-3 text-sm text-fg-muted">Every message carries an <code>x-cp-signature</code> header (HMAC-SHA256 of the body with this secret). The secret is shown only once.</p>
      <div className="flex gap-2">
        <Input readOnly value={created.secret} onFocus={(e) => e.target.select()} />
        <Button variant="secondary" onClick={() => copyText(created.secret)}>Copy</Button>
      </div>
      <div className="mt-4 flex justify-end"><Button onClick={onClose}>I have copied it</Button></div>
    </Modal>
  );
}

export default function Webhooks() {
  const [hooks, setHooks] = useState(null);
  const [deliveries, setDeliveries] = useState(null);
  const [events, setEvents] = useState([]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState('');

  const load = useCallback(async () => {
    try {
      const [h, d, m] = await Promise.all([api.listWebhooks(), api.listDeliveries(), api.getMeta()]);
      setHooks(h.data.items);
      setDeliveries(d.data.items);
      setEvents(m.data.events);
    } catch (err) {
      toastError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const run = async (key, fn, ok) => {
    setBusy(key);
    try {
      const res = await fn();
      if (ok) toast.success(typeof ok === 'function' ? ok(res.data) : ok);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy('');
      load();
    }
  };

  const hookUrl = (id) => hooks?.find((h) => h.id === id)?.url || 'Removed subscription';

  return (
    <>
      <PageHeader title="Webhooks" subtitle="We send a signed message to your system when something happens. Failed messages are retried automatically with growing waits." action={<Button onClick={() => setCreating(true)}>New webhook</Button>} />
      <Card title="Subscriptions">
        {!hooks ? <Spinner /> : hooks.length === 0 ? <Empty>No webhooks yet.</Empty> : (
          <Table head={['Web address', 'Events', 'Failures', 'Status', '']}>
            {hooks.map((h) => (
              <tr key={h.id}>
                <td className="px-3 py-2.5 font-medium text-fg">{h.url}</td>
                <td className="px-3 py-2.5 text-fg-muted">{h.events.map((e) => EVENT_LABEL[e] || e).join(', ')}</td>
                <td className="px-3 py-2.5 text-fg-muted">{h.failureCount}</td>
                <td className="px-3 py-2.5"><Badge tone={h.active ? 'green' : 'gray'}>{h.active ? 'Active' : 'Paused'}</Badge></td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="secondary" disabled={busy === h.id} onClick={() => run(h.id, () => api.updateWebhook(h.id, { active: !h.active }), h.active ? 'Paused.' : 'Resumed.')}>{h.active ? 'Pause' : 'Resume'}</Button>
                    <Button size="sm" variant="secondary" disabled={busy === h.id} onClick={() => window.confirm('Delete this webhook?') && run(h.id, () => api.deleteWebhook(h.id), 'Deleted.')}>Delete</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      <div className="mt-4">
        <Card
          title="Delivery log"
          action={
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" disabled={busy === 'due'} onClick={() => run('due', api.retryDue, (d) => `Tried ${d.tried} due message(s), ${d.delivered} delivered.`)}>Retry due now</Button>
              <Button size="sm" variant="secondary" onClick={load}>Refresh</Button>
            </div>
          }
        >
          {!deliveries ? <Spinner /> : deliveries.length === 0 ? <Empty>Nothing sent yet.</Empty> : (
            <Table head={['When', 'Event', 'Web address', 'Status', 'Attempts', 'Details', '']}>
              {deliveries.map((d) => (
                <tr key={d.id}>
                  <td className="px-3 py-2.5 text-fg-muted">{formatDate(d.at)}</td>
                  <td className="px-3 py-2.5">{d.event}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{hookUrl(d.webhookId)}</td>
                  <td className="px-3 py-2.5"><Badge tone={STATUS_TONE[d.status] || 'gray'}>{d.status}</Badge></td>
                  <td className="px-3 py-2.5 text-fg-muted">{d.attempts}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{d.error || (d.responseCode ? `HTTP ${d.responseCode}` : '')}{d.nextAttemptAt ? ` (next try ${formatDate(d.nextAttemptAt)})` : ''}</td>
                  <td className="px-3 py-2.5 text-right">
                    {d.status !== 'delivered' && <Button size="sm" variant="secondary" disabled={busy === d.id} onClick={() => run(d.id, () => api.retryDelivery(d.id), 'Retried.')}>Retry</Button>}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
      {creating && <CreateWebhook events={events} onClose={() => setCreating(false)} onCreated={(c) => { setCreating(false); setCreated(c); load(); }} />}
      {created && <ShowSecret created={created} onClose={() => setCreated(null)} />}
    </>
  );
}
