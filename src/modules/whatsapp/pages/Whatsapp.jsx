import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import * as api from '../api';

const TONE = { queued: 'gray', sent: 'blue', delivered: 'green', read: 'green', failed: 'red' };
const EVENTS = [
  { value: 'lead.created', label: 'A lead is created', filterHint: 'Channel (optional), e.g. website' },
  { value: 'lead.stage_changed', label: 'A lead moves to a stage', filterHint: 'Stage, e.g. qualified' },
  { value: 'application.status_changed', label: 'An application changes status', filterHint: 'Status, e.g. offered' },
];

function Messages() {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const load = useCallback(() => api.listMessages({ page, limit: 25 }).then((r) => setData(r.data)).catch(toastError), [page]);
  useEffect(() => { load(); }, [load]);
  if (!data) return <Spinner />;
  if (!data.items.length) return <Empty>No WhatsApp messages yet. Send one from a lead page.</Empty>;
  return (
    <>
      <Table head={['When', 'To', 'Message', 'Status']}>
        {data.items.map((m) => (
          <tr key={m._id}>
            <td className="px-3 py-2.5 text-fg-muted">{formatDate(m.at)}</td>
            <td className="px-3 py-2.5">{m.direction === 'in' ? `From ${m.to}` : m.to}</td>
            <td className="px-3 py-2.5">{m.text}{m.error && <span className="block text-xs text-fg-muted">{m.error}</span>}</td>
            <td className="px-3 py-2.5"><Badge tone={TONE[m.status] || 'gray'}>{m.status}</Badge></td>
          </tr>
        ))}
      </Table>
      <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
    </>
  );
}

function TemplateForm({ onClose, onDone }) {
  const [f, setF] = useState({ name: '', language: 'en', body: '', purpose: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.createTemplate({ ...f, purpose: f.purpose || undefined });
      toast.success('Template saved.');
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="New template" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" hint="Exactly as approved in WhatsApp: lowercase letters, digits, underscores."><Input value={f.name} onChange={set('name')} required /></Field>
        <Field label="Language code"><Input value={f.language} onChange={set('language')} maxLength={10} required /></Field>
        <Field label="Message text" hint="Use {{1}}, {{2}} for values filled in at send time."><Input value={f.body} onChange={set('body')} maxLength={1024} required /></Field>
        <Field label="Purpose (optional)"><Input value={f.purpose} onChange={set('purpose')} maxLength={200} /></Field>
        <div className="flex gap-2"><Button type="submit" loading={busy}>Save</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </form>
    </Modal>
  );
}

function Templates() {
  const [items, setItems] = useState(null);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => api.listTemplates().then((r) => setItems(r.data.items)).catch(toastError), []);
  useEffect(() => { load(); }, [load]);
  const toggle = (t) => api.updateTemplate(t._id, { active: !t.active }).then(load).catch(toastError);
  const remove = (t) => window.confirm(`Delete template ${t.name}?`) && api.deleteTemplate(t._id).then(load).catch(toastError);
  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">Templates must be approved in WhatsApp Business first. Messages can only use approved templates.</p>
        <Button size="sm" onClick={() => setAdding(true)}>New template</Button>
      </div>
      {!items ? <Spinner /> : !items.length ? <Empty>No templates yet.</Empty> : (
        <Table head={['Name', 'Text', 'Status', '']}>
          {items.map((t) => (
            <tr key={t._id}>
              <td className="px-3 py-2.5 font-medium">{t.name} <span className="text-xs text-fg-muted">({t.language})</span></td>
              <td className="px-3 py-2.5">{t.body}</td>
              <td className="px-3 py-2.5"><Badge tone={t.active ? 'green' : 'gray'}>{t.active ? 'Active' : 'Off'}</Badge></td>
              <td className="space-x-2 px-3 py-2.5 text-right">
                <Button size="sm" variant="secondary" onClick={() => toggle(t)}>{t.active ? 'Turn off' : 'Turn on'}</Button>
                <Button size="sm" variant="secondary" onClick={() => remove(t)}>Delete</Button>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {adding && <TemplateForm onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </>
  );
}

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

function Rules() {
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
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  const toggle = (r) => api.updateRule(r._id, { active: !r.active }).then(load).catch(toastError);
  const remove = (r) => window.confirm('Delete this rule?') && api.deleteRule(r._id).then(load).catch(toastError);
  const sendDue = () => api.processDue().then((r) => toast.success(`${r.data.processed} delayed message(s) sent.`)).catch(toastError);
  return (
    <>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-fg-muted">Rules send a template automatically. People without consent are skipped.</p>
        <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={sendDue}>Send due messages</Button><Button size="sm" onClick={() => setAdding(true)}>New rule</Button></div>
      </div>
      {!items ? <Spinner /> : !items.length ? <Empty>No rules yet.</Empty> : (
        <Table head={['When', 'Template', 'Wait', 'Status', '']}>
          {items.map((r) => (
            <tr key={r._id}>
              <td className="px-3 py-2.5">{EVENTS.find((x) => x.value === r.event)?.label}{r.filter && <span className="text-fg-muted"> = {r.filter}</span>}</td>
              <td className="px-3 py-2.5">{r.template}</td>
              <td className="px-3 py-2.5 text-fg-muted">{r.delayMinutes ? `${r.delayMinutes} min` : 'Immediately'}</td>
              <td className="px-3 py-2.5"><Badge tone={r.active ? 'green' : 'gray'}>{r.active ? 'Active' : 'Off'}</Badge></td>
              <td className="space-x-2 px-3 py-2.5 text-right">
                <Button size="sm" variant="secondary" onClick={() => toggle(r)}>{r.active ? 'Turn off' : 'Turn on'}</Button>
                <Button size="sm" variant="secondary" onClick={() => remove(r)}>Delete</Button>
              </td>
            </tr>
          ))}
        </Table>
      )}
      {adding && <RuleForm templates={templates} onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </>
  );
}

export default function Whatsapp() {
  const { can } = useAuth();
  const manage = can('integrations:manage');
  const [tab, setTab] = useState('messages');
  const tabs = [['messages', 'Message log'], ...(manage ? [['templates', 'Templates'], ['rules', 'Automation rules']] : [])];
  return (
    <>
      <PageHeader title="WhatsApp" subtitle="Template messages to leads and students who agreed to be contacted. Each sent message is billed to your organisation." />
      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          {tabs.map(([k, label]) => <Button key={k} size="sm" variant={tab === k ? 'primary' : 'secondary'} onClick={() => setTab(k)}>{label}</Button>)}
        </div>
        {tab === 'messages' && <Messages />}
        {tab === 'templates' && <Templates />}
        {tab === 'rules' && <Rules />}
      </Card>
    </>
  );
}
