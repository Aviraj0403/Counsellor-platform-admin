import { ArrowRight, Plus, Zap } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { Badge, Button, Field, Input, Modal, Select, Spinner } from '../../../shared/ui/ui';
import * as api from '../api';
import { EVENTS, eventLabel } from '../lib';

function RuleForm({ templates, onClose, onDone }) {
  const [f, setF] = useState({ event: 'lead.stage_changed', filter: '', template: '', params: '', delayMinutes: 0 });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ev = EVENTS.find((x) => x.value === f.event);
  const submit = async (e) => {
    e.preventDefault();
    const [name, language] = f.template.split('|');
    setBusy(true);
    try {
      await api.createRule({
        event: f.event,
        filter: f.filter || undefined,
        template: name,
        language,
        params: f.params.split(',').map((s) => s.trim()).filter(Boolean),
        delayMinutes: Number(f.delayMinutes) || 0,
      });
      toast.success('Rule saved.');
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="New automation rule" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="When"><Select value={f.event} onChange={set('event')}>{EVENTS.map((x) => <option key={x.value} value={x.value}>{x.label}</option>)}</Select></Field>
        <Field label="Only if" hint={ev.filterHint}><Input value={f.filter} onChange={set('filter')} maxLength={60} /></Field>
        <Field label="Send template"><Select value={f.template} onChange={set('template')} required><option value="">Choose</option>{templates.map((t) => <option key={t._id} value={`${t.name}|${t.language}`}>{t.name} ({t.language})</option>)}</Select></Field>
        <Field label="Values" hint="Comma separated, in order. You can use {name}, {course}, {city}."><Input value={f.params} onChange={set('params')} placeholder="{name}, {course}" /></Field>
        <Field label="Wait (minutes)" hint="0 sends straight away. Delayed messages go out when someone presses Send due messages."><Input type="number" min="0" value={f.delayMinutes} onChange={set('delayMinutes')} /></Field>
        <div className="flex gap-2"><Button type="submit" loading={busy}>Save</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </form>
    </Modal>
  );
}

export default function RulesTab() {
  const [items, setItems] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [adding, setAdding] = useState(false);
  const load = useCallback(async () => {
    try {
      const [r, t] = await Promise.all([api.listRules(), api.listTemplates()]);
      setItems(r.data.items);
      setTemplates(t.data.items.filter((x) => x.active));
    } catch (e) {
      toastError(e);
      setItems([]);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const toggle = (r) => api.updateRule(r._id, { active: !r.active }).then(load).catch(toastError);
  const remove = (r) => window.confirm('Delete this rule?') && api.deleteRule(r._id).then(load).catch(toastError);
  const sendDue = () => api.processDue().then((r) => toast.success(`${r.data.processed} delayed message(s) sent.`)).catch(toastError);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">A rule sends a template by itself when something happens. People who have not agreed to be contacted are skipped.</p>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={sendDue}>Send due messages</Button>
          <Button size="sm" icon={Plus} onClick={() => setAdding(true)}>New rule</Button>
        </div>
      </div>
      {!items ? (
        <Spinner />
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center">
          <span className="tone-amber tone-chip mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"><Zap size={20} aria-hidden="true" /></span>
          <p className="text-sm font-medium text-fg">No automation rules yet</p>
          <p className="text-caption mx-auto mt-1 max-w-md">Example: when a lead moves to "qualified", send the welcome template after 10 minutes. Add a template first, then create the rule.</p>
          <Button className="mt-4" size="sm" icon={Plus} onClick={() => setAdding(true)}>Create a rule</Button>
        </div>
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((r) => (
            <li key={r._id} className="surface-card flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-fg">
                  <span>{eventLabel(r.event)}</span>
                  {r.filter && <Badge tone="gray">{r.filter}</Badge>}
                </p>
                <p className="text-caption mt-1 flex flex-wrap items-center gap-1 !text-[12px]">
                  <ArrowRight size={12} aria-hidden="true" /> sends <span className="font-mono text-fg">{r.template}</span> · {r.delayMinutes ? `after ${r.delayMinutes} min` : 'immediately'}
                </p>
              </div>
              <Badge tone={r.active ? 'green' : 'gray'}>{r.active ? 'Active' : 'Off'}</Badge>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => toggle(r)}>{r.active ? 'Turn off' : 'Turn on'}</Button>
                <Button size="sm" variant="ghost" onClick={() => remove(r)}>Delete</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {adding && <RuleForm templates={templates} onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </>
  );
}
