import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import * as billingApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatINR, rupeesToPaise, thisMonth } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const CATEGORIES = ['hosting', 'whatsapp', 'sms', 'email', 'storage', 'ai', 'ads', 'support', 'other'];
const BLANK = { category: 'hosting', amount: '', tenantId: '', note: '' };

export default function Costs() {
  const { t } = useI18n();
  const [month, setMonth] = useState(thisMonth());
  const [data, setData] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setData((await billingApi.listCosts(month)).data);
    } catch (e) {
      toastError(e);
    }
  }, [month]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    billingApi.listOrganisations({ page: 1, limit: 100 }).then(({ data: d }) => setTenants(d.tenants)).catch(() => {});
  }, []);

  const nameOf = (id) => tenants.find((t) => t.id === id)?.name || 'Organisation';

  const add = async (e) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(form.amount);
    if (Number.isNaN(amountPaise) || amountPaise < 1) return toast.error('Enter the amount in rupees, like 2500 or 2500.50.');
    setBusy(true);
    try {
      await billingApi.addCost({ month, category: form.category, amountPaise, ...(form.tenantId && { tenantId: form.tenantId }), ...(form.note && { note: form.note }) });
      toast.success('Cost recorded.');
      setForm(BLANK);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const voidIt = async (c) => {
    if (!window.confirm('Void this cost entry? It stays in the history but no longer counts.')) return;
    try {
      await billingApi.voidCost(c.id);
      load();
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <>
      <PageHeader title={t('page.costs', 'Platform costs')} subtitle="What it costs us to run the platform: hosting, WhatsApp, SMS, ads. Entered by finance for now. Costs tied to one organisation show in its margin on the overview." />

      <div className="mb-5 w-44">
        <Field label="Month"><Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field>
      </div>

      <Card title={`Add a cost for ${month}`} className="mb-5">
        <form onSubmit={add} className="grid gap-4 md:grid-cols-4">
          <Field label="Category">
            <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Amount (₹)"><Input required inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
          <Field label="Caused by (optional)">
            <Select value={form.tenantId} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
              <option value="">Shared platform cost</option>
              {tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </Select>
          </Field>
          <Field label="Note (optional)"><Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
          <div className="md:col-span-4"><Button type="submit" loading={busy}>Record cost</Button></div>
        </form>
      </Card>

      <Card title={data ? `${month}: total ${formatINR(data.totalPaise)}` : month}>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No costs recorded for this month.</Empty>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2">
              {Object.entries(data.byCategory).map(([k, v]) => <Badge key={k} tone="blue">{k}: {formatINR(v)}</Badge>)}
            </div>
            <Table head={['Category', 'Amount', 'Organisation', 'Note', '']}>
              {data.items.map((c) => (
                <tr key={c.id} className={c.voided ? 'text-fg-muted line-through' : ''}>
                  <td className="px-3 py-2.5 capitalize">{c.category}</td>
                  <td className="px-3 py-2.5">{formatINR(c.amountPaise)}</td>
                  <td className="px-3 py-2.5">{c.tenantId ? nameOf(c.tenantId) : 'Shared'}</td>
                  <td className="px-3 py-2.5">{c.note || ','}</td>
                  <td className="px-3 py-2.5">{c.voided ? <Badge>Voided</Badge> : <Button variant="secondary" onClick={() => voidIt(c)}>Void</Button>}</td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </Card>
    </>
  );
}
