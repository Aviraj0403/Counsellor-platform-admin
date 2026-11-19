import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Spinner, Table } from '../../../shared/ui/ui';
import { useCatalog } from '../../catalog';
import * as billingApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatINR, rupeesToPaise } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const BLANK = { id: null, key: '', name: '', description: '', price: '', maxStaff: '', includedModules: [] };

export default function Plans() {
  const { t } = useI18n();
  const catalog = useCatalog();
  const [plans, setPlans] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setPlans((await billingApi.listPlans()).data.plans);
    } catch (e) {
      toastError(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!plans || !catalog) return <Spinner />;
  const addOns = catalog.modules.filter((m) => m.optIn);

  const edit = (p) =>
    setForm({ id: p.id, key: p.key, name: p.name, description: p.description || '', price: String(p.basePricePaise / 100), maxStaff: p.maxStaff ? String(p.maxStaff) : '', includedModules: p.includedModules });

  const save = async (e) => {
    e.preventDefault();
    const basePricePaise = rupeesToPaise(form.price || '0');
    if (Number.isNaN(basePricePaise)) return toast.error('Enter the price in rupees, like 1999 or 1999.50.');
    const maxStaff = form.maxStaff ? Number(form.maxStaff) : null;
    setBusy(true);
    try {
      if (form.id) {
        await billingApi.updatePlan(form.id, { name: form.name, description: form.description, basePricePaise, includedModules: form.includedModules, maxStaff });
      } else {
        await billingApi.createPlan({ key: form.key, name: form.name, description: form.description || undefined, basePricePaise, includedModules: form.includedModules, maxStaff });
      }
      toast.success('Plan saved.');
      setForm(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      await billingApi.updatePlan(p.id, { active: !p.active });
      load();
    } catch (e) {
      toastError(e);
    }
  };

  const toggleModule = (key) =>
    setForm((f) => ({ ...f, includedModules: f.includedModules.includes(key) ? f.includedModules.filter((k) => k !== key) : [...f.includedModules, key] }));

  return (
    <>
      <PageHeader
        title={t('page.plans', 'Plans and pricing')}
        subtitle="A plan is a monthly base price, an optional staff limit, and the add-ons bundled into that price. Add-ons not bundled are billed separately at their list price (or a negotiated price on the organisation page)."
        action={!form && <Button onClick={() => setForm(BLANK)}>+ New plan</Button>}
      />

      {form && (
        <Card title={form.id ? `Edit plan: ${form.name}` : 'New plan'} className="mb-5">
          <form onSubmit={save} className="grid gap-4 md:grid-cols-2">
            <Field label="Plan key" hint="Short id, cannot be changed later. Example: starter">
              <Input required disabled={!!form.id} pattern="[a-z0-9-]{2,30}" value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} />
            </Field>
            <Field label="Plan name"><Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Monthly base price (₹, before GST)" hint="0 is allowed (free plan)"><Input required inputMode="decimal" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
            <Field label="Max active staff accounts" hint="Owner included. Leave empty for unlimited."><Input type="number" min="1" value={form.maxStaff} onChange={(e) => setForm({ ...form, maxStaff: e.target.value })} /></Field>
            <div className="md:col-span-2">
              <Field label="Description (optional)"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            </div>
            <fieldset className="md:col-span-2">
              <legend className="mb-1 text-sm font-medium text-fg-secondary">Add-ons bundled in the price</legend>
              <div className="grid gap-2 md:grid-cols-2">
                {addOns.map((m) => (
                  <label key={m.key} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" className="accent-indigo-600" checked={form.includedModules.includes(m.key)} onChange={() => toggleModule(m.key)} />
                    {m.label}
                    {m.stage === 'soon' && <Badge tone="amber">Coming soon</Badge>}
                  </label>
                ))}
              </div>
            </fieldset>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" loading={busy}>Save plan</Button>
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {plans.length === 0 ? (
          <Empty>No plans yet. Create one, then assign it on an organisation’s page.</Empty>
        ) : (
          <Table head={['Plan', 'Price / month', 'Staff limit', 'Bundled add-ons', 'Status', '']}>
            {plans.map((p) => (
              <tr key={p.id}>
                <td className="px-3 py-2.5"><span className="font-medium">{p.name}</span> <span className="text-xs text-fg-muted">{p.key}</span></td>
                <td className="px-3 py-2.5">{formatINR(p.basePricePaise)}</td>
                <td className="px-3 py-2.5 text-fg-muted">{p.maxStaff ?? 'Unlimited'}</td>
                <td className="px-3 py-2.5 text-fg-muted">{p.includedModules.map((k) => catalog.modules.find((m) => m.key === k)?.label || k).join(', ') || ','}</td>
                <td className="px-3 py-2.5">{p.active ? <Badge tone="green">Active</Badge> : <Badge>Retired</Badge>}</td>
                <td className="px-3 py-2.5">
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={() => edit(p)}>Edit</Button>
                    <Button variant="secondary" onClick={() => toggleActive(p)}>{p.active ? 'Retire' : 'Reactivate'}</Button>
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
