import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Empty, Field, Input, Select, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import * as api from '../api';

const KINDS = [
  { value: 'call', label: 'Call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
];
const TONE = { call: 'blue', whatsapp: 'green', email: 'blue', meeting: 'amber', note: 'gray', system: 'gray' };
const BLANK = { kind: 'call', direction: 'out', summary: '', outcome: '' };

/** Timeline of one entity (newest first) with a "log activity" form. Embeddable: <ActivityTimeline entityType="lead" entityId={id} canWrite /> */
export default function ActivityTimeline({ entityType, entityId, canWrite = false, reloadKey = 0 }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.listActivities({ entityType, entityId, limit: 50 });
      setItems(data.items);
    } catch (e) {
      toastError(e);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { entityType, entityId, kind: form.kind, summary: form.summary.trim() };
      if (form.kind === 'call' || form.kind === 'whatsapp') body.direction = form.direction;
      if (form.outcome.trim()) body.outcome = form.outcome.trim();
      await api.logActivity(body);
      toast.success('Logged.');
      setForm(BLANK);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      {canWrite && (
        <form onSubmit={submit} className="mb-4 grid gap-3 md:grid-cols-4">
          <Field label="Type">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
            </Select>
          </Field>
          {(form.kind === 'call' || form.kind === 'whatsapp') && (
            <Field label="Direction">
              <Select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option value="out">We contacted them</option>
                <option value="in">They contacted us</option>
              </Select>
            </Field>
          )}
          <Field label="What happened?"><Input required maxLength={1000} value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} /></Field>
          <Field label="Outcome (optional)"><Input maxLength={500} value={form.outcome} onChange={(e) => setForm({ ...form, outcome: e.target.value })} /></Field>
          <div className="md:col-span-4">
            <Button type="submit" loading={busy}>Log activity</Button>
          </div>
        </form>
      )}
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty>Nothing logged yet.</Empty>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => (
            <li key={a._id} className="rounded-lg border border-line p-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={TONE[a.kind]}>{a.kind}</Badge>
                {a.direction && <span className="text-xs text-fg-muted">{a.direction === 'in' ? 'incoming' : 'outgoing'}</span>}
                <span className="text-xs text-fg-muted">{formatDate(a.at)}</span>
              </div>
              <p className="mt-1 text-sm">{a.summary}</p>
              {a.outcome && <p className="text-xs text-fg-muted">Outcome: {a.outcome}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
