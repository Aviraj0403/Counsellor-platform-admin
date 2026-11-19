import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Pager, Spinner, Table } from '../../../shared/ui/ui';
import * as platformApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, slugify } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const LIMIT = 20;
const BLANK = { name: '', slug: '', ownerName: '', ownerEmail: '', ownerPassword: '' };

export default function Organisations() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null); // null = closed
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (p) => {
    try {
      const { data: d } = await platformApi.listTenants({ page: p, limit: LIMIT });
      setData(d);
    } catch (e) {
      toastError(e);
    }
  }, []);

  useEffect(() => {
    load(page);
  }, [page, load]);

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
      load(1);
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
        subtitle="Each counsellor business that uses the platform. Open one to switch features on or off, or to suspend it."
        action={!form && <Button onClick={() => setForm(BLANK)}>+ New organisation</Button>}
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
        {!data ? (
          <Spinner />
        ) : data.tenants.length === 0 ? (
          <Empty>No organisations yet. Create the first one.</Empty>
        ) : (
          <>
            <Table head={['Name', 'Address', 'Status', 'Features on', 'Created']}>
              {data.tenants.map((t) => (
                <tr key={t.id} className="hover:bg-surface-2">
                  <td className="px-3 py-2.5">
                    <Link to={`/organisations/${t.id}`} className="font-medium text-brand-600 dark:text-brand-300 hover:underline">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-3 py-2.5 text-fg-muted">{t.slug}</td>
                  <td className="px-3 py-2.5">{t.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{Object.values(t.modules).filter(Boolean).length}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{formatDate(t.createdAt)}</td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
