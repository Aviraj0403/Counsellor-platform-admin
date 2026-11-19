import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import * as api from '../api';

const SCOPE_LABEL = {
  'leads:create': 'Send new enquiries (leads)',
  'colleges:read': 'Read the college list',
  'applications:read': 'Read applications (college key)',
  'applications:update': 'Update application status (college key)',
};

const copyText = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success('Copied.');
  } catch {
    toast('Select the text and copy it.');
  }
};

function CreateKey({ colleges, scopes, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [picked, setPicked] = useState(['leads:create']);
  const [collegeId, setCollegeId] = useState('');
  const [busy, setBusy] = useState(false);

  const toggle = (s) => setPicked((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  const needsCollege = picked.some((s) => s.startsWith('applications:'));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.createKey({ name, scopes: picked, ...(collegeId ? { collegeId } : {}) });
      onCreated(data);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New API key" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name" hint="For example: Website contact form, or the college's name."><Input required minLength={2} value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="What may this key do?">
          <div className="space-y-1.5">
            {scopes.map((s) => (
              <label key={s} className="flex items-center gap-2 text-sm text-fg">
                <input type="checkbox" checked={picked.includes(s)} onChange={() => toggle(s)} /> {SCOPE_LABEL[s] || s}
              </label>
            ))}
          </div>
        </Field>
        <Field label="Tie to one college (optional)" hint={needsCollege ? 'Required for application access. The key can only ever see this college.' : 'A college key only sees its own college and applications.'}>
          <Select value={collegeId} onChange={(e) => setCollegeId(e.target.value)} required={needsCollege}>
            <option value="">Not tied to a college</option>
            {colleges.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </Select>
        </Field>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy} disabled={!picked.length}>Create key</Button>
        </div>
      </form>
    </Modal>
  );
}

function ShowOnce({ created, onClose }) {
  return (
    <Modal title="Copy your API key now" onClose={onClose}>
      <p className="mb-3 text-sm text-fg-muted">This is the only time the full key is shown. Store it somewhere safe. If you lose it, revoke it and create a new one.</p>
      <div className="flex gap-2">
        <Input readOnly value={created.apiKey} onFocus={(e) => e.target.select()} />
        <Button variant="secondary" onClick={() => copyText(created.apiKey)}>Copy</Button>
      </div>
      <p className="mt-3 text-xs text-fg-muted">Use it as the header <code>Authorization: Bearer &lt;key&gt;</code> on <code>/public/v1</code>.</p>
      <div className="mt-4 flex justify-end"><Button onClick={onClose}>I have copied it</Button></div>
    </Modal>
  );
}

export default function ApiKeys() {
  const [items, setItems] = useState(null);
  const [meta, setMeta] = useState({ scopes: [] });
  const [colleges, setColleges] = useState([]);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState(null);

  const load = useCallback(async () => {
    try {
      const [k, m] = await Promise.all([api.listKeys(), api.getMeta()]);
      setItems(k.data.items);
      setMeta(m.data);
    } catch (err) {
      toastError(err);
    }
  }, []);

  useEffect(() => {
    load();
    api.listColleges().then(({ data }) => setColleges(data.items || [])).catch(() => {});
  }, [load]);

  const revoke = async (k) => {
    if (!window.confirm(`Revoke "${k.name}"? Anything using this key stops working immediately.`)) return;
    try {
      await api.revokeKey(k.id);
      toast.success('Key revoked.');
      load();
    } catch (err) {
      toastError(err);
    }
  };

  const collegeName = (id) => colleges.find((c) => c._id === id)?.name || 'One college';

  return (
    <>
      <PageHeader title="API keys" subtitle="Let your website, partner forms or a college connect to your data. Keys are shown once and can be revoked any time." action={<Button onClick={() => setCreating(true)}>New key</Button>} />
      <Card>
        {!items ? <Spinner /> : items.length === 0 ? <Empty>No keys yet.</Empty> : (
          <Table head={['Name', 'Key', 'Can do', 'College', 'Last used', 'Status', '']}>
            {items.map((k) => (
              <tr key={k.id}>
                <td className="px-3 py-2.5 font-medium text-fg">{k.name}</td>
                <td className="px-3 py-2.5 font-mono text-xs text-fg-muted">{k.prefix}</td>
                <td className="px-3 py-2.5 text-fg-muted">{k.scopes.map((s) => SCOPE_LABEL[s] || s).join(', ')}</td>
                <td className="px-3 py-2.5 text-fg-muted">{k.collegeId ? collegeName(k.collegeId) : '-'}</td>
                <td className="px-3 py-2.5 text-fg-muted">{k.lastUsedAt ? formatDate(k.lastUsedAt) : 'Never'}</td>
                <td className="px-3 py-2.5"><Badge tone={k.revokedAt ? 'red' : 'green'}>{k.revokedAt ? 'Revoked' : 'Active'}</Badge></td>
                <td className="px-3 py-2.5 text-right">{!k.revokedAt && <Button size="sm" variant="secondary" onClick={() => revoke(k)}>Revoke</Button>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {creating && <CreateKey colleges={colleges} scopes={meta.scopes} onClose={() => setCreating(false)} onCreated={(c) => { setCreating(false); setCreated(c); load(); }} />}
      {created && <ShowOnce created={created} onClose={() => setCreated(null)} />}
    </>
  );
}
