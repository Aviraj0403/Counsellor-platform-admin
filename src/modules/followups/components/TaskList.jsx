import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Empty, Field, Input, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import * as api from '../api';
import CompleteTask from './CompleteTask';

const toLocalInput = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
const tomorrow9 = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return toLocalInput(d);
};

/** Tasks of one entity (lead, student or application) with add and complete. Embeddable: <TaskList entityType="lead" entityId={id} canWrite /> */
export default function TaskList({ entityType, entityId, canWrite = false }) {
  const [items, setItems] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [completing, setCompleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.listTasks({ entityType, entityId, limit: 50 });
      setItems(data.items);
    } catch (e) {
      toastError(e);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createTask({ entityType, entityId, title: form.title, dueAt: new Date(form.dueAt).toISOString() });
      toast.success('Task added.');
      setForm(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const now = Date.now();
  return (
    <div>
      {canWrite && !form && (
        <div className="mb-3">
          <Button size="sm" variant="secondary" onClick={() => setForm({ title: '', dueAt: tomorrow9() })}>+ Add task</Button>
        </div>
      )}
      {form && (
        <form onSubmit={add} className="mb-4 grid gap-3 md:grid-cols-3">
          <Field label="Task"><Input required minLength={2} maxLength={160} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></Field>
          <Field label="Due"><Input required type="datetime-local" value={form.dueAt} onChange={(e) => setForm({ ...form, dueAt: e.target.value })} /></Field>
          <div className="flex items-end gap-2">
            <Button type="submit" loading={busy}>Add</Button>
            <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
          </div>
        </form>
      )}
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Empty>No tasks yet.</Empty>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((t) => {
            const late = t.status === 'open' && new Date(t.dueAt).getTime() < now;
            return (
              <li key={t._id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                <div>
                  <p className={t.status === 'open' ? 'font-medium' : 'text-fg-muted line-through'}>{t.title}</p>
                  <p className="text-xs text-fg-muted">
                    Due {formatDate(t.dueAt)}
                    {t.outcome ? ` · ${t.outcome}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {late && <Badge tone="red">Overdue</Badge>}
                  {t.status !== 'open' && <Badge tone={t.status === 'done' ? 'green' : 'gray'}>{t.status}</Badge>}
                  {canWrite && t.status === 'open' && <Button size="sm" onClick={() => setCompleting(t)}>Complete</Button>}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {completing && <CompleteTask task={completing} onClose={() => setCompleting(null)} onDone={() => { setCompleting(null); load(); }} />}
    </div>
  );
}
