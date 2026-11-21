import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useCatalog } from '../../catalog';
import * as platformApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, slugify } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import OrgAvatar from '../../../shared/ui/OrgAvatar.jsx';

const LIMIT = 20;
const FETCH = 100; // the API's maximum page size; every page is loaded so search and the status filter cover all organisations
const MAX_CHIPS = 3;
const BLANK = { name: '', slug: '', ownerName: '', ownerEmail: '', ownerPassword: '' };

export default function Organisations() {
  const { t } = useI18n();
  const catalog = useCatalog();
  const [page, setPage] = useState(1);
  const [all, setAll] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [form, setForm] = useState(null); // null = closed
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const first = (await platformApi.listTenants({ page: 1, limit: FETCH })).data;
      let rows = first.tenants;
      for (let p = 2; rows.length < first.total && p <= 50; p += 1) {
        rows = rows.concat((await platformApi.listTenants({ page: p, limit: FETCH })).data.tenants);
      }
      setAll(rows);
    } catch (e) {
      toastError(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const setOrgStatus = async (org, next) => {
    const msg = next === 'suspended' ? `Suspend ${org.name}? Everyone in it is locked out immediately.` : `Reactivate ${org.name}?`;
    if (!window.confirm(msg)) return;
    try {
      await platformApi.setTenantStatus(org.id, next);
      toast.success(next === 'suspended' ? 'Organisation suspended.' : 'Organisation reactivated.');
      load();
    } catch (e) {
      toastError(e);
    }
  };

  const q = search.trim().toLowerCase();
  const filtered = (all || []).filter((o) => (!status || o.status === status) && (!q || o.name.toLowerCase().includes(q) || o.slug.includes(q)));
  const pageRows = filtered.slice((page - 1) * LIMIT, page * LIMIT);
  const counts = (all || []).reduce((n, o) => ({ ...n, [o.status]: (n[o.status] || 0) + 1 }), {});
  const chips = (o) => (catalog ? catalog.modules.filter((m) => !m.core && o.modules[m.key]) : []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value, ...(k === 'name' && !f.slugTouched ? { slug: slugify(e.target.value) } : {}) }));

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { slugTouched: _unused, ...body } = form;
      await platformApi.createTenant(body);
      toast.success('Organisation created. Share the owner login with them.');
      setForm(null);
      setPage(1);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title={t('page.organisations', 'Organisations')}
        subtitle="Each counsellor business that uses the platform. Open one to switch features on or off, change its plan, or suspend it. The owner login is shown only once, when you create the organisation."
        action={
          <div className="flex gap-2">
            <Link to="/organisations/onboard">
              <Button variant="primary">+ Onboard organisation wizard</Button>
            </Link>
            {!form && <Button variant="secondary" onClick={() => setForm(BLANK)}>Quick create</Button>}
          </div>
        }
      />

      {form && (
        <Card title="New organisation" className="mb-5">
          <form onSubmit={create} className="grid gap-4 md:grid-cols-2">
            <Field label="Organisation name">
              <Input required minLength={2} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Address (slug)" hint="3-40 lowercase letters, numbers, hyphens. Cannot be changed later.">
              <Input required pattern="[a-z0-9-]{3,40}" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value, slugTouched: true })} />
            </Field>
            <Field label="Owner name">
              <Input required minLength={2} value={form.ownerName} onChange={set('ownerName')} />
            </Field>
            <Field label="Owner email">
              <Input type="email" required value={form.ownerEmail} onChange={set('ownerEmail')} />
            </Field>
            <Field label="Owner temporary password" hint="At least 10 characters. The owner should change it after first login.">
              <Input type="password" required minLength={10} autoComplete="new-password" value={form.ownerPassword} onChange={set('ownerPassword')} />
            </Field>
            <div className="flex items-end gap-2">
              <Button type="submit" loading={busy}>Create organisation</Button>
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[200px] flex-1">
            <Field label="Search">
              <Input type="search" placeholder="Name or address" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
            </Field>
          </div>
          <div className="w-44">
            <Field label="Status">
              <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
                <option value="">All ({all?.length ?? 0})</option>
                <option value="active">Active ({counts.active || 0})</option>
                <option value="suspended">Suspended ({counts.suspended || 0})</option>
              </Select>
            </Field>
          </div>
        </div>
        {!all ? (
          <Spinner />
        ) : all.length === 0 ? (
          <Empty>No organisations yet. Create the first one.</Empty>
        ) : filtered.length === 0 ? (
          <Empty>No organisation matches this search or filter.</Empty>
        ) : (
          <>
            <Table head={['Name', 'Status', 'Add-on features on', 'Created', '']}>
              {pageRows.map((o) => {
                const on = chips(o);
                return (
                  <tr key={o.id} className="hover:bg-surface-2">
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-3">
                        <OrgAvatar name={o.name} logoUrl={o.logoUrl} brandColor={o.brandColor} size="sm" />
                        <div className="min-w-0">
                          <Link to={`/organisations/${o.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-300">
                            {o.name}
                          </Link>
                          <p className="text-caption">{o.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">{o.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}</td>
                    <td className="px-3 py-2.5">
                      {on.length === 0 ? (
                        <span className="text-fg-muted">Core only</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {on.slice(0, MAX_CHIPS).map((m) => <Badge key={m.key} tone="blue">{m.label}</Badge>)}
                          {on.length > MAX_CHIPS && <span className="text-caption" title={on.slice(MAX_CHIPS).map((m) => m.label).join(', ')}>+{on.length - MAX_CHIPS} more</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-fg-muted">{formatDate(o.createdAt)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <div className="flex justify-end gap-2">
                        <Link to={`/organisations/${o.id}`}><Button size="sm" variant="secondary">Manage</Button></Link>
                        {o.status === 'active' ? (
                          <Button size="sm" variant="danger" onClick={() => setOrgStatus(o, 'suspended')}>Suspend</Button>
                        ) : (
                          <Button size="sm" onClick={() => setOrgStatus(o, 'active')}>Reactivate</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pager page={page} limit={LIMIT} total={filtered.length} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
