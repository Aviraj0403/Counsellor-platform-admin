import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, Empty, Field, Input, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useAuth } from '../../auth';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import * as api from '../api';
import useStaff from '../components/useStaff';
import { DAYS, fmtDateTime } from '../lib';

const emptyWeek = () => Object.fromEntries(DAYS.map((d) => [d.day, []]));

function Weekly({ counsellorId, canEdit }) {
  const [week, setWeek] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    api.getHours(counsellorId).then(({ data }) => {
      if (!alive) return;
      const w = emptyWeek();
      for (const d of data.weekly) w[d.day] = d.ranges.map((r) => ({ ...r }));
      setWeek(w);
    }).catch(toastError);
    return () => { alive = false; };
  }, [counsellorId]);
  if (!week) return <Spinner />;
  const setRange = (day, i, patch) => setWeek({ ...week, [day]: week[day].map((r, j) => (j === i ? { ...r, ...patch } : r)) });
  const save = async () => {
    setBusy(true);
    try {
      const weekly = DAYS.filter((d) => week[d.day].length).map((d) => ({ day: d.day, ranges: week[d.day] }));
      await api.saveHours(counsellorId, weekly);
      toast.success('Working hours saved.');
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-3">
      {DAYS.map((d) => (
        <div key={d.day} className="flex flex-wrap items-center gap-3">
          <span className="w-24 text-sm font-medium">{d.label}</span>
          {week[d.day].length === 0 && <span className="text-sm text-fg-muted">Not working</span>}
          {week[d.day].map((r, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <Input type="time" className="!w-auto" value={r.start} disabled={!canEdit} onChange={(e) => setRange(d.day, i, { start: e.target.value })} aria-label={`${d.label} start`} />
              to
              <Input type="time" className="!w-auto" value={r.end} disabled={!canEdit} onChange={(e) => setRange(d.day, i, { end: e.target.value })} aria-label={`${d.label} end`} />
              {canEdit && <Button size="sm" variant="ghost" onClick={() => setWeek({ ...week, [d.day]: week[d.day].filter((_, j) => j !== i) })}>Remove</Button>}
            </span>
          ))}
          {canEdit && <Button size="sm" variant="secondary" onClick={() => setWeek({ ...week, [d.day]: [...week[d.day], { start: '09:00', end: '17:00' }] })}>Add hours</Button>}
        </div>
      ))}
      {canEdit && <Button loading={busy} onClick={save}>Save working hours</Button>}
    </div>
  );
}

function TimeOff({ counsellorId, canEdit }) {
  const [items, setItems] = useState(null);
  const [f, setF] = useState({ from: '', to: '', reason: '' });
  const load = useCallback(() => api.listTimeOff({ counsellorId }).then(({ data }) => setItems(data.items)).catch(toastError), [counsellorId]);
  useEffect(() => { load(); }, [load]);
  const add = async (e) => {
    e.preventDefault();
    try {
      await api.addTimeOff({ counsellorId, from: new Date(f.from).toISOString(), to: new Date(f.to).toISOString(), reason: f.reason || undefined });
      toast.success('Time off added.');
      setF({ from: '', to: '', reason: '' });
      load();
    } catch (err) {
      toastError(err);
    }
  };
  const remove = async (id) => {
    try {
      await api.removeTimeOff(id);
      load();
    } catch (err) {
      toastError(err);
    }
  };
  return (
    <>
      {canEdit && (
        <form onSubmit={add} className="mb-4 grid gap-3 sm:grid-cols-4">
          <Field label="From"><Input type="datetime-local" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} required /></Field>
          <Field label="To"><Input type="datetime-local" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} required /></Field>
          <Field label="Reason (optional)"><Input value={f.reason} maxLength={200} onChange={(e) => setF({ ...f, reason: e.target.value })} /></Field>
          <div className="flex items-end"><Button type="submit">Add time off</Button></div>
        </form>
      )}
      {!items ? <Spinner /> : items.length === 0 ? <Empty>No time off planned.</Empty> : (
        <Table head={['From', 'To', 'Reason', '']}>
          {items.map((o) => (
            <tr key={o._id}>
              <td className="px-3 py-2.5">{fmtDateTime(o.from)}</td>
              <td className="px-3 py-2.5">{fmtDateTime(o.to)}</td>
              <td className="px-3 py-2.5 text-fg-muted">{o.reason}</td>
              <td className="px-3 py-2.5 text-right">{canEdit && <Button size="sm" variant="ghost" onClick={() => remove(o._id)}>Remove</Button>}</td>
            </tr>
          ))}
        </Table>
      )}
    </>
  );
}

export default function Availability() {
  const { t } = useI18n();
  const { can, me } = useAuth();
  const { staff, canList } = useStaff();
  const [who, setWho] = useState('');
  const counsellorId = who || staff[0]?.id || me?.id || '';
  const canEdit = can('appointments:manage');
  return (
    <>
      <PageHeader title={t('page.availability', 'Availability')} subtitle="Weekly working hours (Indian time) and time off. Students can only book inside these hours." />
      {canList && (
        <div className="mb-4 max-w-xs">
          <Field label="Counsellor">
            <Select value={counsellorId} onChange={(e) => setWho(e.target.value)}>{staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select>
          </Field>
        </div>
      )}
      {!counsellorId ? <Spinner /> : (
        <div className="space-y-5">
          <Card title="Weekly working hours"><Weekly key={counsellorId} counsellorId={counsellorId} canEdit={canEdit} /></Card>
          <Card title="Time off and leave"><TimeOff key={counsellorId} counsellorId={counsellorId} canEdit={canEdit} /></Card>
        </div>
      )}
    </>
  );
}
