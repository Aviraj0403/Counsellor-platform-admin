import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, formatINR } from '../../../shared/lib/format';
import * as api from '../api';

const SEVERITY_TONE = { critical: 'red', warning: 'amber' };
const isoDay = (d) => new Date(d.getTime() + 330 * 60_000).toISOString().slice(0, 10); // IST calendar day
const daysAgo = (n) => isoDay(new Date(Date.now() - n * 86_400_000));
const num = (n) => (n || 0).toLocaleString('en-IN');

function Help() {
  return (
    <details className="mt-3 text-sm text-fg-muted">
      <summary className="cursor-pointer text-fg">Where do I find these?</summary>
      <div className="mt-2 space-y-2">
        <p><b className="text-fg">Ad account ID:</b> open Meta Business Settings, then Accounts, then Ad accounts. Click your ad account: the number shown there (like 1234567890) is the ID. In Ads Manager it is also in the address bar after <code>act=</code>. You can type it with or without <code>act_</code>.</p>
        <p><b className="text-fg">Access token:</b> in Meta Business Settings go to Users, then System users, and add a system user (Admin role). Click Add assets and give it your ad account (view performance is enough). Then Generate new token, pick your app, tick <code>ads_read</code> (and <code>leads_retrieval</code> if you use lead ads), choose "Never" expires, and copy it here. A system-user token does not expire when someone leaves the company.</p>
        <p>The token is stored encrypted and is never shown again, only its last 4 characters.</p>
      </div>
    </details>
  );
}

function Connection({ onChanged }) {
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState({ adAccountIds: '', accessToken: '', apiVersion: '' });
  const [busy, setBusy] = useState(false);
  const [test, setTest] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.getConfig();
      setCfg(data);
      setForm({ adAccountIds: (data.adAccountIds || []).join(', '), accessToken: '', apiVersion: data.apiVersion || '' });
    } catch (err) {
      toastError(err);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setBusy(true);
    try {
      const body = { adAccountIds: form.adAccountIds.split(/[,\s]+/).filter(Boolean), apiVersion: form.apiVersion };
      if (form.accessToken) body.accessToken = form.accessToken; // write-only: empty keeps the saved token
      await api.saveConfig(body);
      toast.success('Saved.');
      await load();
      onChanged();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const runTest = async () => {
    setBusy(true);
    try {
      setTest((await api.testConnection()).data);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  if (!cfg) return <Card title="Ad account connection"><Spinner /></Card>;
  return (
    <Card title="Ad account connection">
      <div className="space-y-3">
        <Field label="Ad account ID(s)" hint="One or more, separated by commas.">
          <Input value={form.adAccountIds} onChange={(e) => setForm((f) => ({ ...f, adAccountIds: e.target.value }))} placeholder="1234567890" />
        </Field>
        <Field label="Access token" hint={cfg.tokenSet ? `A token is saved (${cfg.tokenHint}). Leave empty to keep it.` : 'Paste the system-user token from Meta. It is stored encrypted and cannot be read back.'}>
          <Input type="password" autoComplete="off" value={form.accessToken} onChange={(e) => setForm((f) => ({ ...f, accessToken: e.target.value }))} placeholder={cfg.tokenSet ? 'Saved (hidden)' : ''} />
        </Field>
        <Field label="API version (optional)" hint={`Empty uses the server default (${cfg.defaultApiVersion}).`}>
          <Input value={form.apiVersion} onChange={(e) => setForm((f) => ({ ...f, apiVersion: e.target.value }))} placeholder={cfg.defaultApiVersion} />
        </Field>
        <div className="flex flex-wrap gap-2">
          <Button disabled={busy} onClick={save}>Save</Button>
          <Button variant="secondary" disabled={busy || !cfg.tokenSet} onClick={runTest}>Test connection</Button>
        </div>
        {test && (
          <p className="text-sm">
            <Badge tone={test.ok ? 'green' : 'red'}>{test.ok ? 'Works' : 'Problem'}</Badge> <span className="text-fg-muted">{test.message}</span>
          </p>
        )}
        {test?.ok && test.adAccounts?.length > 0 && (
          <ul className="text-sm text-fg-muted">
            {test.adAccounts.map((a) => <li key={a.id}>{a.name || 'Ad account'} <code>{a.id}</code> ({a.currency})</li>)}
          </ul>
        )}
      </div>
      <Help />
    </Card>
  );
}

function Status({ status, onSync, busy }) {
  if (!status) return <Card title="Sync"><Spinner /></Card>;
  return (
    <Card title="Sync" action={<Button size="sm" disabled={busy || !status.connected} onClick={onSync}>Sync now</Button>}>
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between gap-3"><dt className="text-fg-muted">Last sync</dt><dd>{status.lastSyncAt ? formatDate(status.lastSyncAt) : 'Never'}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-fg-muted">Last success</dt><dd>{status.lastSuccessAt ? formatDate(status.lastSuccessAt) : 'Never'}</dd></div>
        <div className="flex justify-between gap-3"><dt className="text-fg-muted">Rows in last run</dt><dd>{status.lastSyncRows}</dd></div>
        {status.currencyMismatch && <div><Badge tone="amber">Not INR</Badge> <span className="text-fg-muted">The ad account currency is {status.currency}. Its spend is kept but left out of cost figures.</span></div>}
      </dl>
      {status.lastError && <p className="mt-2 text-sm"><Badge tone="red">Last error</Badge> <span className="text-fg-muted">{status.lastError}</span></p>}
      {!status.connected && <p className="mt-2 text-sm text-fg-muted">Save the access token and an ad account ID to start. After that the numbers are pulled automatically every day.</p>}
      <p className="mt-2 text-sm text-fg-muted">The first sync loads the last 30 days; later runs refresh the last 3 days, because Meta corrects recent numbers.</p>
    </Card>
  );
}

function Alerts({ alerts }) {
  return (
    <Card title="Alerts">
      {!alerts ? <Spinner /> : alerts.length === 0 ? <Empty>No alerts. All good.</Empty> : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.code} className="text-sm">
              <Badge tone={SEVERITY_TONE[a.severity] || 'gray'}>{a.severity}</Badge> <b>{a.title}</b>
              <div className="text-fg-muted">{a.detail}</div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function Performance({ refreshKey }) {
  const [range, setRange] = useState({ from: daysAgo(29), to: daysAgo(0) });
  const [data, setData] = useState(null);
  const load = useCallback(async () => {
    try {
      setData((await api.getPerformance(range)).data);
    } catch (err) {
      toastError(err);
    }
  }, [range]);
  useEffect(() => {
    load();
  }, [load, refreshKey]);
  const set = (k) => (e) => setRange((r) => ({ ...r, [k]: e.target.value }));
  const money = (p, row) => (row?.currencyMismatch ? 'Not INR' : formatINR(p));
  const cpl = (p) => (p == null ? '-' : formatINR(p));
  return (
    <Card title="Campaign performance">
      <div className="mb-3 flex flex-wrap items-end gap-3">
        <Field label="From"><Input type="date" value={range.from} onChange={set('from')} /></Field>
        <Field label="To"><Input type="date" value={range.to} onChange={set('to')} /></Field>
      </div>
      {!data ? <Spinner /> : data.items.length === 0 ? <Empty>No data in this period. Run a sync first.</Empty> : (
        <>
          <Table head={['Campaign', 'Spend', 'Impressions', 'Clicks', 'Meta leads', 'Platform leads', 'Cost per lead']}>
            {data.items.map((r) => (
              <tr key={r.campaignId}>
                <td className="px-3 py-2.5">{r.campaignName || r.campaignId}<div className="text-xs text-fg-muted">{r.campaignId}</div></td>
                <td className="px-3 py-2.5">{money(r.spend, r)}</td>
                <td className="px-3 py-2.5">{num(r.impressions)}</td>
                <td className="px-3 py-2.5">{num(r.clicks)}</td>
                <td className="px-3 py-2.5">{num(r.metaLeads)}</td>
                <td className="px-3 py-2.5">{num(r.platformLeads)}</td>
                <td className="px-3 py-2.5">{r.currencyMismatch ? '-' : cpl(r.costPerLead)}</td>
              </tr>
            ))}
            <tr className="font-semibold">
              <td className="px-3 py-2.5">Total</td>
              <td className="px-3 py-2.5">{formatINR(data.totals.spend)}</td>
              <td className="px-3 py-2.5">{num(data.totals.impressions)}</td>
              <td className="px-3 py-2.5">{num(data.totals.clicks)}</td>
              <td className="px-3 py-2.5">{num(data.totals.metaLeads)}</td>
              <td className="px-3 py-2.5">{num(data.totals.platformLeads)}</td>
              <td className="px-3 py-2.5">{cpl(data.totals.costPerLead)}</td>
            </tr>
          </Table>
          <p className="mt-2 text-xs text-fg-muted">
            Meta leads are what Meta reports; platform leads are the ones that actually arrived here through your lead forms.
            {data.unattributedPlatformLeads > 0 && ` ${data.unattributedPlatformLeads} platform lead(s) in this period could not be linked to a campaign.`}
          </p>
        </>
      )}
    </Card>
  );
}

export default function MetaInsights() {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const loadStatus = useCallback(async () => {
    try {
      setStatus((await api.getStatus()).data);
    } catch (err) {
      toastError(err);
    }
  }, []);
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const sync = async () => {
    setBusy(true);
    try {
      const { data } = await api.syncNow();
      if (data.ok) toast.success(`Synced ${data.rows} rows (last ${data.days} days).`);
      else toast.error(data.error);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
      await loadStatus();
      setTick((t) => t + 1);
    }
  };

  return (
    <div className="mb-4 space-y-4">
      <Alerts alerts={status?.alerts} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Connection onChanged={loadStatus} />
        <Status status={status} onSync={sync} busy={busy} />
      </div>
      <Performance refreshKey={tick} />
    </div>
  );
}
