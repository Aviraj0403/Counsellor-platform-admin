import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Field, Input, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useCatalog } from '../../catalog';
import * as billingApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatINR, thisMonth } from '../../../shared/lib/format';

/** Billing for one organisation: plan, negotiated prices, what it owes now, and its invoices. Finance / super admin only. */
export default function OrganisationBilling({ tenantId, modulesOn }) {
  const catalog = useCatalog();
  const [view, setView] = useState(null);
  const [plans, setPlans] = useState([]);
  const [prices, setPrices] = useState({}); // module key -> text in rupees ('' = use list price)
  const [period, setPeriod] = useState(thisMonth());
  const [busy, setBusy] = useState(false);
  const [details, setDetails] = useState({ legalName: '', gstin: '', address: '', state: '' });

  const load = useCallback(async () => {
    try {
      const [b, p] = await Promise.all([billingApi.tenantBilling(tenantId), billingApi.listPlans()]);
      setView(b.data);
      setDetails({ legalName: '', gstin: '', address: '', state: '', ...(b.data.billingDetails || {}) });
      setPlans(p.data.plans.filter((x) => x.active || x.key === b.data.plan?.key));
      setPrices(Object.fromEntries(Object.entries(b.data.priceOverrides || {}).map(([k, v]) => [k, String(v)])));
    } catch (e) {
      toastError(e);
    }
  }, [tenantId]);

  // modulesOn changes when the admin toggles a feature above, so the preview follows it
  useEffect(() => {
    load();
  }, [load, modulesOn]);

  if (!view || !catalog) return <Spinner />;
  const priced = catalog.modules.filter((m) => m.optIn && m.priceMonthlyInr > 0);

  const changePlan = async (planKey) => {
    try {
      await billingApi.assignPlan(tenantId, planKey || null);
      toast.success('Plan updated.');
      load();
    } catch (e) {
      toastError(e);
    }
  };

  const savePricing = async () => {
    const original = view.priceOverrides || {};
    const body = {};
    for (const m of priced) {
      const text = (prices[m.key] ?? '').trim();
      const was = original[m.key];
      if (text === '' && was !== undefined) body[m.key] = null;
      else if (text !== '') {
        const n = Number(text);
        if (!Number.isFinite(n) || n < 0) return toast.error(`"${text}" is not a valid price for ${m.label}.`);
        if (n !== was) body[m.key] = n;
      }
    }
    if (!Object.keys(body).length) return toast('No price changes.');
    try {
      await billingApi.setPricing(tenantId, body);
      toast.success('Pricing saved.');
      load();
    } catch (e) {
      toastError(e);
    }
  };

  const saveDetails = async () => {
    try {
      await billingApi.saveBillingDetails(tenantId, { legalName: details.legalName, gstin: details.gstin, address: details.address, state: details.state });
      toast.success('Billing details saved. New invoices will use them.');
      load();
    } catch (e) {
      toastError(e);
    }
  };

  const invoice = async () => {
    setBusy(true);
    try {
      const { data } = await billingApi.generateInvoice(tenantId, period);
      toast.success(`Invoice ${data.invoiceNo} issued.`);
      load();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const c = view.currentCharge;
  return (
    <Card title="Billing" className="mb-5">
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Field label="Plan">
            <Select value={view.plan?.key || ''} onChange={(e) => changePlan(e.target.value)}>
              <option value="">No plan (custom)</option>
              {plans.map((p) => <option key={p.key} value={p.key}>{p.name} · {formatINR(p.basePricePaise)}/month{p.active ? '' : ' (retired)'}</option>)}
            </Select>
          </Field>
          {view.plan?.maxStaff && <p className="text-xs text-fg-muted">This plan allows {view.plan.maxStaff} active staff accounts, owner included.</p>}

          <div>
            <p className="mb-2 text-sm font-medium text-fg-secondary">Billing details (printed on invoices)</p>
            <p className="mb-2 text-xs text-fg-muted">Same state as our company: CGST + SGST. Different or empty state: IGST.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Field label="Legal name"><Input value={details.legalName} onChange={(e) => setDetails({ ...details, legalName: e.target.value })} /></Field>
              <Field label="State"><Input value={details.state} onChange={(e) => setDetails({ ...details, state: e.target.value })} /></Field>
              <Field label="GSTIN"><Input value={details.gstin} onChange={(e) => setDetails({ ...details, gstin: e.target.value })} placeholder="optional" /></Field>
              <Field label="Address"><Input value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} /></Field>
            </div>
            <Button variant="secondary" className="mt-3" onClick={saveDetails}>Save billing details</Button>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-fg-secondary">Negotiated add-on prices</p>
            <p className="mb-2 text-xs text-fg-muted">Leave empty to use the list price. Enter 0 to give it free to this customer.</p>
            <div className="space-y-2">
              {priced.map((m) => (
                <div key={m.key} className="flex items-center gap-3 text-sm">
                  <span className="w-48 shrink-0">{m.label} {m.stage === 'soon' && <Badge tone="amber">soon</Badge>}</span>
                  <span className="w-24 shrink-0 text-xs text-fg-muted">list ₹{m.priceMonthlyInr}</span>
                  <Input inputMode="decimal" placeholder="list price" value={prices[m.key] ?? ''} onChange={(e) => setPrices({ ...prices, [m.key]: e.target.value })} className="!py-1" />
                </div>
              ))}
            </div>
            <Button variant="secondary" className="mt-3" onClick={savePricing}>Save pricing</Button>
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-fg-secondary">What this organisation owes per month right now</p>
          {c.lines.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line p-4 text-sm text-fg-muted">Nothing: no plan price and no priced add-on switched on. Features still marked “coming soon” are never billed.</p>
          ) : (
            <Table head={['Item', 'Amount']}>
              {c.lines.map((l) => <tr key={l.code}><td className="px-3 py-2">{l.label}</td><td className="px-3 py-2">{formatINR(l.amountPaise)}</td></tr>)}
              <tr><td className="px-3 py-2 text-fg-muted">Subtotal</td><td className="px-3 py-2">{formatINR(c.subtotalPaise)}</td></tr>
              {c.supply === 'intra' ? (
                <>
                  <tr><td className="px-3 py-2 text-fg-muted">CGST</td><td className="px-3 py-2">{formatINR(c.cgstPaise)}</td></tr>
                  <tr><td className="px-3 py-2 text-fg-muted">SGST</td><td className="px-3 py-2">{formatINR(c.sgstPaise)}</td></tr>
                </>
              ) : (
                <tr><td className="px-3 py-2 text-fg-muted">IGST</td><td className="px-3 py-2">{formatINR(c.igstPaise)}</td></tr>
              )}
              <tr><td className="px-3 py-2 font-semibold">Total</td><td className="px-3 py-2 font-semibold">{formatINR(c.totalPaise)}</td></tr>
            </Table>
          )}

          <div className="mt-4 flex items-end gap-2">
            <div className="w-44"><Field label="Invoice for month"><Input type="month" value={period} onChange={(e) => e.target.value && setPeriod(e.target.value)} /></Field></div>
            <Button onClick={invoice} loading={busy} disabled={c.lines.length === 0}>Issue invoice</Button>
          </div>
        </div>
      </div>

      {view.invoices.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-sm font-medium text-fg-secondary">Invoices</p>
          <Table head={['Invoice', 'Month', 'Total', 'Status']}>
            {view.invoices.map((i) => (
              <tr key={i.id}>
                <td className="px-3 py-2 font-medium">{i.invoiceNo}</td>
                <td className="px-3 py-2 text-fg-muted">{i.period}</td>
                <td className="px-3 py-2">{formatINR(i.totalPaise)}</td>
                <td className="px-3 py-2"><Badge tone={{ issued: 'amber', paid: 'green', void: 'gray' }[i.status]}>{i.status}</Badge></td>
              </tr>
            ))}
          </Table>
          <p className="mt-2 text-xs text-fg-muted">Mark invoices paid or void from the Invoices page.</p>
        </div>
      )}
    </Card>
  );
}
