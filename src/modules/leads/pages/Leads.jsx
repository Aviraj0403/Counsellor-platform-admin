import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as leadsApi from '../api';
import ImportLeads from '../components/ImportLeads';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, humanize } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const STAGES = ['new', 'contacted', 'qualified', 'counselling_done', 'application_started', 'admitted', 'lost'];
const CHANNELS = ['website', 'meta_ads', 'google_ads', 'whatsapp', 'walk_in', 'referral', 'import', 'api'];
const TONE = { new: 'blue', contacted: 'blue', qualified: 'amber', counselling_done: 'amber', application_started: 'amber', admitted: 'green', lost: 'red' };
const LIMIT = 25;
const BLANK = { name: '', phone: '', email: '', city: '', interestedCourse: '', channel: 'walk_in', consent: false, autoAssign: false };

export default function Leads() {
  const { t } = useI18n();
  const { can } = useAuth();
  const [filters, setFilters] = useState({ stage: '', search: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = useCallback(async () => {
    try {
      const params = { page, limit: LIMIT, ...(filters.stage && { stage: filters.stage }), ...(filters.search && { search: filters.search }) };
      const { data: d } = await leadsApi.listLeads(params);
      setData(d);
    } catch (e) {
      toastError(e);
    }
  }, [page, filters]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { channel, consent, autoAssign, ...rest } = form;
      const body = { ...rest, source: { channel }, consent: { given: consent, source: 'admin_entry' }, autoAssign };
      Object.keys(body).forEach((k) => body[k] === '' && delete body[k]);
      const { data: res } = await leadsApi.createLead(body);
      if (res.duplicate) toast('This number is already a lead. The repeat enquiry was recorded, no new lead created.', { icon: 'ℹ️', duration: 7000 });
      else toast.success('Lead added.');
      setForm(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const move = async (lead, stage) => {
    try {
      await leadsApi.changeStage(lead._id, stage);
      toast.success(`Moved to ${humanize(stage)}.`);
      load();
    } catch (e) {
      toastError(e); // the API explains which moves are allowed from the current stage
    }
  };

  return (
    <>
      <PageHeader
        title={t('page.leads', 'Leads')}
        subtitle="Student enquiries. The same phone number is never added twice. Stages move step by step: a lead cannot jump straight to admitted."
        action={
          !form && !importing && (
            <div className="flex gap-2">
              {can('leads:import') && <Button variant="secondary" onClick={() => setImporting(true)}>Import</Button>}
              {can('leads:write') && <Button onClick={() => setForm(BLANK)}>+ Add lead</Button>}
            </div>
          )
        }
      />

      {importing && <ImportLeads canAssign={can('leads:assign')} onClose={() => setImporting(false)} onImported={load} />}

      {form && (
        <Card title="New lead" className="mb-5">
          <form onSubmit={add} className="grid gap-4 md:grid-cols-3">
            <Field label="Student name"><Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Mobile number" hint="10-digit Indian mobile"><Input required inputMode="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
            <Field label="Email (optional)"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="City"><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            <Field label="Interested course"><Input value={form.interestedCourse} onChange={(e) => setForm({ ...form, interestedCourse: e.target.value })} /></Field>
            <Field label="Where did this lead come from?">
              <Select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}>
                {CHANNELS.map((c) => <option key={c} value={c}>{humanize(c)}</option>)}
              </Select>
            </Field>
            <label className="flex items-start gap-2 text-sm md:col-span-3">
              <input type="checkbox" className="mt-1 accent-indigo-600" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} />
              <span>The student (or parent, if under 18) agreed to be contacted. <span className="text-fg-muted">Recorded with the lead.</span></span>
            </label>
            {can('leads:assign') && (
              <label className="flex items-center gap-2 text-sm md:col-span-3">
                <input type="checkbox" className="accent-indigo-600" checked={form.autoAssign} onChange={(e) => setForm({ ...form, autoAssign: e.target.checked })} />
                Assign to the counsellor with the fewest open leads
              </label>
            )}
            <div className="flex gap-2 md:col-span-3">
              <Button type="submit" loading={busy}>Add lead</Button>
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="w-52">
            <Select value={filters.stage} onChange={(e) => { setPage(1); setFilters({ ...filters, stage: e.target.value }); }} aria-label="Filter by stage">
              <option value="">All stages</option>
              {STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
            </Select>
          </div>
          <div className="w-64">
            <Input placeholder="Search name or phone" value={filters.search} onChange={(e) => { setPage(1); setFilters({ ...filters, search: e.target.value }); }} />
          </div>
        </div>

        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No leads found.</Empty>
        ) : (
          <>
            <Table head={['Student', 'Phone', 'City / course', 'Source', 'Stage', 'Owner', 'Added']}>
              {data.items.map((l) => (
                <tr key={l._id}>
                  <td className="px-3 py-2.5 font-medium"><Link to={`/leads/${l._id}`} className="hover:underline">{l.name}</Link></td>
                  <td className="px-3 py-2.5 text-fg-secondary">{l.phone}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{[l.city, l.interestedCourse].filter(Boolean).join(' · ') || ','}</td>
                  <td className="px-3 py-2.5 text-fg-muted capitalize">{humanize(l.source?.channel)}</td>
                  <td className="px-3 py-2.5">
                    {can('leads:write') ? (
                      <Select value={l.stage} onChange={(e) => move(l, e.target.value)} className="!py-1" aria-label={`Stage of ${l.name}`}>
                        {STAGES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
                      </Select>
                    ) : (
                      <Badge tone={TONE[l.stage]}>{humanize(l.stage)}</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2.5">{l.assignedTo ? <Badge tone="blue">Assigned</Badge> : <Badge>Unassigned</Badge>}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{formatDate(l.createdAt)}</td>
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
