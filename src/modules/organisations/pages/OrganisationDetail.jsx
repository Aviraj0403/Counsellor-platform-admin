import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useParams } from 'react-router-dom';
import { Badge, Button, Card, Empty, Input, PageHeader, Spinner, Table } from '../../../shared/ui/ui';
import { OrganisationBilling } from '../../billing';
import { useAuth } from '../../auth';
import { useCatalog } from '../../catalog';
import { platformAudit } from '../../audit';
import * as platformApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, humanize } from '../../../shared/lib/format';

const GROUPS = { crm: 'CRM', admissions: 'Admissions', finance: 'Finance', marketing: 'Marketing', channels: 'Channels', platform: 'Platform' };

export default function OrganisationDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const catalog = useCatalog();
  const [tenant, setTenant] = useState(null);
  const [audit, setAudit] = useState(null);
  const [name, setName] = useState('');
  const [busyKey, setBusyKey] = useState('');

  const load = useCallback(async () => {
    try {
      const { data } = await platformApi.getTenant(id);
      setTenant(data);
      setName(data.name);
    } catch (e) {
      toastError(e);
    }
  }, [id]);

  const loadAudit = useCallback(async () => {
    if (!can('platform:audit:read')) return;
    try {
      const { data } = await platformAudit({ tenantId: id, limit: 15 });
      setAudit(data.items);
    } catch (e) {
      toastError(e);
    }
  }, [id, can]);

  useEffect(() => {
    load();
    loadAudit();
  }, [load, loadAudit]);

  if (!tenant || !catalog) return <Spinner />;

  const toggleModule = async (m, on) => {
    setBusyKey(m.key);
    try {
      const { data } = await platformApi.setTenantModules(id, { [m.key]: on });
      setTenant((t) => ({ ...t, modules: data.modules }));
      data.warnings.forEach((w) => toast(w, { icon: '⚠️', duration: 8000 }));
      if (!data.warnings.length) toast.success(`${m.label} ${on ? 'switched on' : 'switched off'}.`);
      loadAudit();
    } catch (e) {
      toastError(e);
    } finally {
      setBusyKey('');
    }
  };

  const setStatus = async (status) => {
    const msg = status === 'suspended' ? `Suspend ${tenant.name}? Everyone in it is locked out immediately.` : `Reactivate ${tenant.name}?`;
    if (!window.confirm(msg)) return;
    try {
      await platformApi.setTenantStatus(id, status);
      toast.success(status === 'suspended' ? 'Organisation suspended.' : 'Organisation reactivated.');
      load();
      loadAudit();
    } catch (e) {
      toastError(e);
    }
  };

  const rename = async () => {
    try {
      await platformApi.renameTenant(id, name.trim());
      toast.success('Name updated.');
      load();
      loadAudit();
    } catch (e) {
      toastError(e);
    }
  };

  const grouped = Object.keys(GROUPS)
    .map((g) => ({ key: g, label: GROUPS[g], items: catalog.modules.filter((m) => m.group === g) }))
    .filter((g) => g.items.length);

  return (
    <>
      <p className="mb-2 text-sm">
        <Link to="/organisations" className="text-brand-600 dark:text-brand-300 hover:underline">← Organisations</Link>
      </p>
      <PageHeader
        title={tenant.name}
        subtitle={`Address: ${tenant.slug} · ${tenant.staff.active} active staff${tenant.staff.blocked ? `, ${tenant.staff.blocked} blocked` : ''} · created ${formatDate(tenant.createdAt)}`}
        action={
          tenant.status === 'active' ? (
            <Button variant="danger" onClick={() => setStatus('suspended')}>Suspend</Button>
          ) : (
            <Button onClick={() => setStatus('active')}>Reactivate</Button>
          )
        }
      />
      {tenant.status !== 'active' && <p className="mb-4"><Badge tone="red">Suspended: nobody in this organisation can log in</Badge></p>}

      <Card title="Name" className="mb-5">
        <div className="flex max-w-md gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <Button variant="secondary" disabled={name.trim() === tenant.name || name.trim().length < 2} onClick={rename}>Save</Button>
        </div>
      </Card>

      <Card title="Features (modules)" className="mb-5">
        <p className="mb-4 text-xs text-fg-muted">
          Core features are always on. Add-ons are off until you switch them on here. A feature marked “coming soon” is not built yet: do not sell it yet.
        </p>
        <div className="space-y-5">
          {grouped.map((g) => (
            <div key={g.key}>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-fg-muted">{g.label}</p>
              <div className="grid gap-3 md:grid-cols-2">
                {g.items.map((m) => {
                  const on = !!tenant.modules[m.key];
                  return (
                    <div key={m.key} className="flex items-start justify-between gap-3 rounded-lg border border-line p-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-fg">
                          {m.label}
                          {m.core && <Badge tone="blue">Core</Badge>}
                          {m.stage === 'soon' && <Badge tone="amber">Coming soon</Badge>}
                        </p>
                        <p className="mt-1 text-xs text-fg-muted">{m.whatItDoes}</p>
                        {m.dependsOn?.length > 0 && <p className="mt-1 text-xs text-fg-muted">Needs: {m.dependsOn.join(', ')}</p>}
                        {m.priceMonthlyInr > 0 && <p className="mt-1 text-xs text-fg-muted">₹{m.priceMonthlyInr}/month</p>}
                      </div>
                      <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 shrink-0 accent-indigo-600"
                        checked={on}
                        disabled={m.core || busyKey === m.key || !can('platform:modules:manage')}
                        onChange={(e) => toggleModule(m, e.target.checked)}
                        aria-label={`${m.label} on or off`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {can('platform:billing:manage') && <OrganisationBilling tenantId={id} modulesOn={JSON.stringify(tenant.modules)} />}

      {audit && (
        <Card title="Recent changes">
          {audit.length === 0 ? (
            <Empty>Nothing recorded yet.</Empty>
          ) : (
            <Table head={['When', 'What', 'Ref']}>
              {audit.map((a) => (
                <tr key={a._id}>
                  <td className="px-3 py-2 text-fg-muted">{formatDate(a.at)}</td>
                  <td className="px-3 py-2 capitalize">{humanize(a.action)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-fg-muted">{a.requestId?.slice(0, 8)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}
