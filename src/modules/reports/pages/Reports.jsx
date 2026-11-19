import { useCallback, useEffect, useState } from 'react';
import { Card, Empty, Field, Input, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatINR, humanize } from '../../../shared/lib/format';
import * as api from '../api';

const iso = (d) => d.toISOString().slice(0, 10);
const PRESETS = {
  all: () => ({}),
  '7': () => ({ from: iso(new Date(Date.now() - 6 * 864e5)), to: iso(new Date()) }),
  '30': () => ({ from: iso(new Date(Date.now() - 29 * 864e5)), to: iso(new Date()) }),
  month: () => {
    const n = new Date();
    return { from: iso(new Date(Date.UTC(n.getFullYear(), n.getMonth(), 1))), to: iso(n) };
  },
};

/** A simple horizontal bar: width is a percentage of the whole. */
function Bar({ value }) {
  const w = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div className="h-2 w-full rounded-full bg-surface-2" role="presentation">
      <div className="h-2 rounded-full bg-brand-600" style={{ width: `${w}%` }} />
    </div>
  );
}

function Tile({ label, value, hint }) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="text-xs text-fg-muted">{label}</div>
      <div className="mt-1 text-xl font-semibold text-fg">{value}</div>
      {hint ? <div className="mt-1 text-xs text-fg-muted">{hint}</div> : null}
    </div>
  );
}

export default function Reports() {
  const [preset, setPreset] = useState('all');
  const [custom, setCustom] = useState({ from: '', to: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const range = preset === 'custom' ? { ...(custom.from ? { from: custom.from } : {}), ...(custom.to ? { to: custom.to } : {}) } : PRESETS[preset]();
  const key = JSON.stringify(range);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = JSON.parse(key);
      const [funnel, sources, counsellors, applications, revenue] = await Promise.all([
        api.getFunnel(params),
        api.getSources(params),
        api.getCounsellors(params),
        api.getApplications(params),
        api.getRevenue(params),
      ]);
      setData({ funnel: funnel.data, sources: sources.data, counsellors: counsellors.data, applications: applications.data, revenue: revenue.data });
    } catch (e) {
      toastError(e);
    } finally {
      setLoading(false);
    }
  }, [key]);

  useEffect(() => {
    load();
  }, [load]);

  const customInvalid = preset === 'custom' && custom.from && custom.to && custom.from > custom.to;

  return (
    <div className="space-y-5">
      <PageHeader title="Reports" subtitle="Counts and totals for your organisation. No student details are shown here." />

      <Card title="Period">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Show">
            <Select value={preset} onChange={(e) => setPreset(e.target.value)}>
              <option value="all">All time</option>
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="month">This month</option>
              <option value="custom">Custom range</option>
            </Select>
          </Field>
          {preset === 'custom' && (
            <>
              <Field label="From"><Input type="date" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} /></Field>
              <Field label="To"><Input type="date" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} /></Field>
            </>
          )}
        </div>
        {customInvalid ? <p className="mt-2 text-sm text-fg-muted">The start date must be before the end date.</p> : null}
        <p className="mt-2 text-xs text-fg-muted">{data?.funnel?.note || 'The period applies to revenue. Lead and application counts are all-time.'}</p>
      </Card>

      {loading && !data ? <Spinner /> : null}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Tile label="Commission accrued" value={formatINR(data.revenue.accruedPaise)} hint={`Organisation share ${formatINR(data.revenue.organisationSharePaise)}`} />
            <Tile label="Collected from colleges" value={formatINR(data.revenue.collectedPaise)} hint={`${data.revenue.collectionPct}% of accrued`} />
            <Tile label="Paid to counsellors" value={formatINR(data.revenue.paidOutPaise)} hint={`Counsellor share ${formatINR(data.revenue.counsellorSharePaise)}`} />
            <Tile label="Still to collect" value={formatINR(data.revenue.outstandingPaise)} />
          </div>

          <Card title="Lead funnel">
            {data.funnel.total === 0 ? (
              <Empty>No leads yet.</Empty>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-fg-secondary">
                  {data.funnel.total} leads, {data.funnel.admitted} admitted ({data.funnel.conversionPct}% conversion), {data.funnel.lost} lost.
                </p>
                {data.funnel.steps.map((s) => (
                  <div key={s.stage}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-fg">{humanize(s.stage)}</span>
                      <span className="text-fg-muted">{s.reached} reached ({s.ofTotalPct}%), {s.ofPreviousPct}% of previous step</span>
                    </div>
                    <Bar value={s.ofTotalPct} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card title="Source performance">
            {data.sources.items.length === 0 ? (
              <Empty>No leads yet.</Empty>
            ) : (
              <Table head={['Source', 'Leads', 'Contacted', 'Admitted', 'Lost', 'Conversion']}>
                {data.sources.items.map((s) => (
                  <tr key={s.channel}>
                    <td className="px-3 py-2.5 text-fg">{humanize(s.channel)}</td>
                    <td className="px-3 py-2.5 text-fg-secondary">{s.leads}</td>
                    <td className="px-3 py-2.5 text-fg-secondary">{s.contacted} ({s.contactedPct}%)</td>
                    <td className="px-3 py-2.5 text-fg-secondary">{s.admitted}</td>
                    <td className="px-3 py-2.5 text-fg-secondary">{s.lost}</td>
                    <td className="px-3 py-2.5 text-fg">{s.conversionPct}%</td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title="Counsellor leaderboard">
            {data.counsellors.items.length === 0 ? (
              <Empty>No applications yet.</Empty>
            ) : (
              <div className="space-y-3">
                {data.counsellors.items.map((c, i) => (
                  <div key={c.counsellorId}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-fg">{i + 1}. {c.name}</span>
                      <span className="text-fg-muted">{c.applications} applications ({c.sharePct}%)</span>
                    </div>
                    <Bar value={c.sharePct} />
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card title="Applications by status">
              {data.applications.byStatus.items.length === 0 ? (
                <Empty>No applications yet.</Empty>
              ) : (
                <div className="space-y-3">
                  {data.applications.byStatus.items.map((s) => (
                    <div key={s.status}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="text-fg">{humanize(s.status)}</span>
                        <span className="text-fg-muted">{s.count} ({s.sharePct}%)</span>
                      </div>
                      <Bar value={s.sharePct} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
            <Card title="Applications by college">
              {data.applications.byCollege.length === 0 ? (
                <Empty>No applications yet.</Empty>
              ) : (
                <Table head={['College', 'Applications', 'Share']}>
                  {data.applications.byCollege.map((c) => (
                    <tr key={c.id}>
                      <td className="px-3 py-2.5 text-fg">{c.name}</td>
                      <td className="px-3 py-2.5 text-fg-secondary">{c.applications}</td>
                      <td className="px-3 py-2.5 text-fg-secondary">{c.sharePct}%</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
