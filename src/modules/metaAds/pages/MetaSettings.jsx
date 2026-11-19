import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import * as api from '../api';
import MetaInsights from './MetaInsights';

const STATUS_TONE = { sent: 'green', failed: 'red', skipped: 'amber' };

export default function MetaSettings() {
  const [cfg, setCfg] = useState(null);
  const [form, setForm] = useState({ pixelId: '', pageId: '', accessToken: '', verifyToken: '', testEventCode: '' });
  const [events, setEvents] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([api.getConfig(), api.listEvents()]);
      setCfg(c.data);
      setForm({ pixelId: c.data.pixelId, pageId: c.data.pageId, accessToken: '', verifyToken: c.data.verifyToken, testEventCode: c.data.testEventCode });
      setEvents(e.data.items);
    } catch (err) {
      toastError(err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  const save = async (extra = {}) => {
    setBusy(true);
    try {
      const body = { pixelId: form.pixelId, pageId: form.pageId, verifyToken: form.verifyToken, testEventCode: form.testEventCode, ...extra };
      if (form.accessToken) body.accessToken = form.accessToken; // write-only: empty keeps the saved token
      await api.saveConfig(body);
      toast.success('Saved.');
      await load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    setBusy(true);
    try {
      const res = await api.sendTest();
      toast.success(res.data.message);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
      load();
    }
  };

  const copy = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied.');
    } catch {
      toast('Select the text and copy it.');
    }
  };

  if (!cfg) return <Spinner />;
  return (
    <>
      <PageHeader
        title="Meta Ads"
        subtitle="Bring Meta lead-ad enquiries in automatically, and tell Meta which leads became qualified or admitted (hashed, no raw phone or email is sent)."
        action={<Badge tone={cfg.enabled ? 'green' : 'gray'}>{cfg.enabled ? 'On' : 'Off'}</Badge>}
      />
      <MetaInsights />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Pixel and conversions">
          <div className="space-y-3">
            <Field label="Pixel (dataset) ID"><Input value={form.pixelId} onChange={set('pixelId')} inputMode="numeric" /></Field>
            <Field label="Facebook Page ID (optional)"><Input value={form.pageId} onChange={set('pageId')} /></Field>
            <Field label="Access token" hint={cfg.tokenSet ? 'A token is saved. Leave empty to keep it; it is never shown again.' : 'Paste the long-lived token from Meta. It is stored encrypted and cannot be read back.'}>
              <Input type="password" autoComplete="off" value={form.accessToken} onChange={set('accessToken')} placeholder={cfg.tokenSet ? 'Saved (hidden)' : ''} />
            </Field>
            <Field label="Test event code (optional)" hint="From Meta Events Manager, Test events tab."><Input value={form.testEventCode} onChange={set('testEventCode')} /></Field>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button disabled={busy} onClick={() => save()}>Save</Button>
              <Button variant="secondary" disabled={busy} onClick={() => save({ enabled: !cfg.enabled })}>{cfg.enabled ? 'Switch off' : 'Save and switch on'}</Button>
              <Button variant="secondary" disabled={busy || !cfg.tokenSet} onClick={test}>Send test event</Button>
            </div>
          </div>
        </Card>
        <Card title="Lead ads webhook">
          <p className="mb-3 text-sm text-fg-muted">In Meta (App, Webhooks, Page, leadgen) paste these two values. Meta signs every call with your app secret.</p>
          <div className="space-y-3">
            <Field label="Callback URL">
              <div className="flex gap-2"><Input readOnly value={cfg.webhookUrl} /><Button variant="secondary" onClick={() => copy(cfg.webhookUrl)}>Copy</Button></div>
            </Field>
            <Field label="Verify token">
              <div className="flex gap-2"><Input value={form.verifyToken} onChange={set('verifyToken')} /><Button variant="secondary" onClick={() => copy(form.verifyToken)}>Copy</Button></div>
            </Field>
            {!cfg.appSecretConfigured && <p className="text-sm text-fg-muted"><Badge tone="amber">Server setup needed</Badge> The server has no META_APP_SECRET, so incoming webhooks are refused. Ask your administrator.</p>}
          </div>
        </Card>
      </div>
      <div className="mt-4">
        <Card title="Last events" action={<Button size="sm" variant="secondary" onClick={load}>Refresh</Button>}>
          {!events ? <Spinner /> : events.length === 0 ? <Empty>Nothing yet.</Empty> : (
            <Table head={['When', 'Type', 'Event', 'Status', 'Details']}>
              {events.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2.5 text-fg-muted">{formatDate(e.at)}</td>
                  <td className="px-3 py-2.5 capitalize">{e.kind.replace('_', ' ')}</td>
                  <td className="px-3 py-2.5">{e.eventName}</td>
                  <td className="px-3 py-2.5"><Badge tone={STATUS_TONE[e.status] || 'gray'}>{e.status}</Badge></td>
                  <td className="px-3 py-2.5 text-fg-muted">{e.error || (e.attempts > 1 ? `${e.attempts} attempts` : '')}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </>
  );
}
