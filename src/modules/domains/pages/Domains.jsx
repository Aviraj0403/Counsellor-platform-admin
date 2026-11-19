import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import * as api from '../api';

const KINDS = [
  ['admin', 'Admin console'],
  ['portal', 'Student / college portal'],
  ['public_site', 'Public website'],
  ['other', 'Other'],
];
const BLANK = { origin: '', label: '', kind: 'admin', tenantId: '', note: '' };

/**
 * Superadmin: add a domain here and the API accepts browser calls from it straight away (no restart, no config edit).
 * Domains from the server configuration (.env) are always allowed and shown read-only.
 */
export default function Domains() {
  const [data, setData] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData((await api.listDomains()).data);
    } catch (e) {
      toastError(e);
    }
  }, []);

  useEffect(() => {
    load();
    api.listOrganisations({ page: 1, limit: 100 }).then(({ data: d }) => setOrgs(d.tenants)).catch(() => {});
  }, [load]);

  const orgName = (id) => orgs.find((o) => o.id === id)?.name || 'Organisation';

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { origin: form.origin.trim(), kind: form.kind, ...(form.label && { label: form.label }), ...(form.tenantId && { tenantId: form.tenantId }), ...(form.note && { note: form.note }) };
      const { data: d } = await api.addDomain(body);
      toast.success(`${d.origin} can now call the API.`);
      setForm(BLANK);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (d) => {
    try {
      await api.updateDomain(d.id, { active: !d.active });
      toast.success(d.active ? `${d.origin} is blocked now.` : `${d.origin} is allowed again.`);
      load();
    } catch (e) {
      toastError(e);
    }
  };

  const remove = async (d) => {
    if (!window.confirm(`Remove ${d.origin}? Websites on this domain will stop working with the API.`)) return;
    try {
      await api.removeDomain(d.id);
      toast.success('Domain removed.');
      load();
    } catch (e) {
      toastError(e);
    }
  };

  if (!data) return <Spinner />;

  return (
    <>
      <PageHeader
        title="Allowed domains"
        subtitle="Which websites a browser may use to call this API (admin console, portals, an organisation's own website). A domain added here works within seconds, no restart."
      />

      <Card title="Always allowed (server configuration)" className="mb-5">
        <div className="flex flex-wrap gap-2">
          {data.configured.length === 0 && <span className="text-sm text-fg-muted">None configured.</span>}
          {data.configured.map((c) => (
            <Badge key={c.origin} tone="blue">{c.origin}</Badge>
          ))}
        </div>
        <p className="text-caption mt-3">
          These come from the server settings <code>PLATFORM_ORIGINS</code> and <code>CORS_ORIGINS</code> and can only be changed there (needs a restart). Local development addresses are also allowed outside production.
        </p>
      </Card>

      <Card title="Add a domain" className="mb-5">
        <form onSubmit={add} className="grid gap-4 md:grid-cols-2">
          <Field label="Domain" hint="Exactly as users type it, for example https://counsellor.example.com. https only, no page path, no wildcards, no IP addresses.">
            <Input required placeholder="https://counsellor.example.com" value={form.origin} onChange={(e) => setForm({ ...form, origin: e.target.value })} />
          </Field>
          <Field label="What is it?">
            <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })}>
              {KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select>
          </Field>
          <Field label="Belongs to organisation (optional)" hint="Leave empty for our own platform apps.">
            <Select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
              <option value="">Platform / none</option>
              {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </Field>
          <Field label="Label (optional)"><Input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></Field>
          <div className="md:col-span-2">
            <Field label="Note (optional)" hint="Why was this added, who asked.">
              <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit" loading={busy}>Allow this domain</Button>
            <p className="text-caption mt-2">This only lets the browser talk to the API. The domain itself must already point to your hosting (DNS).</p>
          </div>
        </form>
      </Card>

      <Card title="Domains added from here">
        {data.custom.length === 0 ? (
          <Empty>No extra domains yet.</Empty>
        ) : (
          <Table head={['Domain', 'Type', 'Organisation', 'Status', 'Added', '']}>
            {data.custom.map((d) => (
              <tr key={d.id}>
                <td>
                  <span className="font-medium text-fg">{d.origin}</span>
                  {d.label && <span className="block text-xs text-fg-muted">{d.label}</span>}
                  {d.note && <span className="block text-xs text-fg-muted">{d.note}</span>}
                </td>
                <td>{KINDS.find(([k]) => k === d.kind)?.[1] || d.kind}</td>
                <td>{d.tenantId ? orgName(d.tenantId) : 'Platform'}</td>
                <td>{d.active ? <Badge tone="green">Allowed</Badge> : <Badge tone="red">Blocked</Badge>}</td>
                <td className="text-fg-muted">{formatDate(d.createdAt)}</td>
                <td>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => toggle(d)}>{d.active ? 'Block' : 'Allow'}</Button>
                    <Button variant="secondary" size="sm" onClick={() => remove(d)}>Remove</Button>
                  </div>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
