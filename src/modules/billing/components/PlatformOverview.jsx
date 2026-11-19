import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, Field, Input, Spinner, Table } from '../../../shared/ui/ui';
import { useCatalog } from '../../catalog';
import * as billingApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatINR, thisMonth } from '../../../shared/lib/format';

const Tile = ({ label, value, hint, tone = 'text-fg' }) => (
  <div className="rounded-xl border border-line bg-surface p-4 shadow-sm">
    <p className="text-xs font-medium uppercase tracking-wide text-fg-muted">{label}</p>
    <p className={`mt-1 text-xl font-semibold ${tone}`}>{value}</p>
    {hint && <p className="mt-1 text-xs text-fg-muted">{hint}</p>}
  </div>
);

/** Super-admin / finance overview: money in, money out, and which features customers actually use. */
export default function PlatformOverview() {
  const catalog = useCatalog();
  const [month, setMonth] = useState(thisMonth());
  const [d, setD] = useState(null);

  useEffect(() => {
    let live = true;
    billingApi.dashboard(month).then(({ data }) => live && setD(data)).catch(toastError);
    return () => {
      live = false;
    };
  }, [month]);

  if (!d || !catalog) return <Spinner />;
  const label = (key) => catalog.modules.find((m) => m.key === key)?.label || key;
  const adoption = Object.entries(d.moduleAdoption).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-fg">Platform overview</h2>
          <p className="text-sm text-fg-muted">Money and usage for the month. Organisation counts are live; money figures follow the month you pick.</p>
        </div>
        <div className="w-44">
          <Field label="Month">
            <Input type="month" value={month} onChange={(e) => e.target.value && setMonth(e.target.value)} />
          </Field>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Tile label="Monthly recurring revenue" value={formatINR(d.revenue.mrrPaise)} hint="What active organisations pay per month, before GST" />
        <Tile label="Invoiced this month" value={formatINR(d.revenue.invoicedPaise)} hint="Before GST" />
        <Tile label="Collected" value={formatINR(d.revenue.collectedPaise)} hint={`Outstanding: ${formatINR(d.revenue.outstandingPaise)} (incl. GST)`} tone="text-emerald-700 dark:text-emerald-300" />
        <Tile label="Platform costs" value={formatINR(d.costs.totalPaise)} hint={Object.entries(d.costs.byCategory).map(([k, v]) => `${k} ${formatINR(v)}`).join(' · ') || 'None recorded'} />
        <Tile label="Margin" value={formatINR(d.marginPaise)} hint="Invoiced (before GST) minus costs" tone={d.marginPaise < 0 ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'} />
        <Tile label="Organisations" value={`${d.organisations.active} active`} hint={`${d.organisations.suspended} suspended · ${d.organisations.newLast30Days} new in 30 days · ${d.organisations.activeStaffAccounts} staff accounts`} />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Which features customers use">
          {adoption.length === 0 ? (
            <Empty>No add-ons switched on yet.</Empty>
          ) : (
            <ul className="space-y-2 text-sm">
              {adoption.map(([key, n]) => (
                <li key={key} className="flex items-center justify-between">
                  <span>{label(key)}</span>
                  <span className="text-fg-muted">{n} organisation{n === 1 ? '' : 's'}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="By organisation">
          {d.perOrganisation.length === 0 ? (
            <Empty>No active organisations.</Empty>
          ) : (
            <Table head={['Organisation', 'MRR', 'Cost this month']}>
              {d.perOrganisation.map((o) => (
                <tr key={o.tenantId}>
                  <td className="px-3 py-2"><Link to={`/organisations/${o.tenantId}`} className="text-brand-600 dark:text-brand-300 hover:underline">{o.name}</Link></td>
                  <td className="px-3 py-2">{formatINR(o.mrrPaise)}</td>
                  <td className="px-3 py-2 text-fg-muted">{formatINR(o.costPaise)}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
      <p className="text-xs text-fg-muted">Costs are entered by finance for now. Automatic metering arrives with the WhatsApp and Meta modules.</p>
    </div>
  );
}
