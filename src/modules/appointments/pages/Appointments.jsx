import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useAuth } from '../../auth';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import * as api from '../api';
import AppointmentActions from '../components/AppointmentActions';
import BookAppointment from '../components/BookAppointment';
import useStaff from '../components/useStaff';
import { STATUS_TONE, addDays, fmtDateTime, istDayStart, statusLabel } from '../lib';

const LIMIT = 25;
const RANGES = [
  { key: 'today', label: 'Today', get: (d) => [d, addDays(d, 1)] },
  { key: 'week', label: 'Next 7 days', get: (d) => [d, addDays(d, 7)] },
  { key: 'past', label: 'Past 7 days', get: (d) => [addDays(d, -7), d] },
  { key: 'all', label: 'Next 60 days', get: (d) => [d, addDays(d, 60)] },
];
const STATUSES = ['booked', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'];

export default function Appointments() {
  const { t } = useI18n();
  const { can } = useAuth();
  const { staff, nameOf, canList } = useStaff();
  const [range, setRange] = useState('week');
  const [status, setStatus] = useState('');
  const [counsellorId, setCounsellorId] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [booking, setBooking] = useState(false);
  const [acting, setActing] = useState(null); // { action, appointment }

  const load = useCallback(async () => {
    try {
      const [from, to] = RANGES.find((r) => r.key === range).get(istDayStart());
      const [list, sum] = await Promise.all([
        api.listAppointments({ page, limit: LIMIT, from: from.toISOString(), to: to.toISOString(), ...(status && { status }), ...(counsellorId && { counsellorId }) }),
        api.getSummary(),
      ]);
      setData(list.data);
      setSummary(sum.data);
    } catch (e) {
      toastError(e);
    }
  }, [range, status, counsellorId, page]);
  useEffect(() => {
    load();
  }, [load]);

  const quick = async (fn, ok) => {
    try {
      await fn();
      toast.success(ok);
      load();
    } catch (e) {
      toastError(e);
    }
  };
  const done = () => {
    setActing(null);
    setBooking(false);
    load();
  };
  const now = Date.now();
  const write = can('appointments:write');

  return (
    <>
      <PageHeader
        title={t('page.appointments', 'Appointments')}
        subtitle="Counselling calls and visits. Students can also book from your public booking link; those appear here too."
        action={write && <Button onClick={() => setBooking(true)}>Book appointment</Button>}
      />
      {summary && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Badge tone="blue">{summary.today.total} today</Badge>
          <Badge tone="amber">{summary.upcoming7Days} in the next 7 days</Badge>
          <Badge tone={summary.last30Days.noShowRate > 0.3 ? 'red' : 'gray'}>
            {summary.last30Days.noShowRate === null ? 'No-show rate: not enough data yet' : `No-show rate (30 days): ${Math.round(summary.last30Days.noShowRate * 100)}%`}
          </Badge>
        </div>
      )}
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {RANGES.map((r) => (
            <Button key={r.key} size="sm" variant={range === r.key ? 'primary' : 'secondary'} onClick={() => { setPage(1); setRange(r.key); }}>{r.label}</Button>
          ))}
          <Select className="!w-auto" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} aria-label="Status">
            <option value="">Any status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
          </Select>
          {canList && (
            <Select className="!w-auto" value={counsellorId} onChange={(e) => { setPage(1); setCounsellorId(e.target.value); }} aria-label="Counsellor">
              <option value="">All counsellors</option>
              {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          )}
        </div>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No appointments in this view.</Empty>
        ) : (
          <>
            <Table head={['When', 'Student', 'Type', 'Counsellor', 'Status', '']}>
              {data.items.map((a) => {
                const active = a.status === 'booked' || a.status === 'confirmed';
                const started = new Date(a.start).getTime() <= now;
                return (
                  <tr key={a._id}>
                    <td className="px-3 py-2.5 font-medium">{fmtDateTime(a.start)}</td>
                    <td className="px-3 py-2.5">{a.who?.name}<span className="block text-xs text-fg-muted">{a.who?.phone}</span></td>
                    <td className="px-3 py-2.5">{a.typeName}{a.source !== 'staff' && <span className="block text-xs text-fg-muted">Booked via {a.source}</span>}</td>
                    <td className="px-3 py-2.5 text-fg-muted">{nameOf(a.counsellorId)}</td>
                    <td className="px-3 py-2.5"><Badge tone={STATUS_TONE[a.status] || 'gray'}>{statusLabel(a.status)}</Badge></td>
                    <td className="px-3 py-2.5">
                      {write && active && (
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {a.status === 'booked' && <Button size="sm" variant="secondary" onClick={() => quick(() => api.confirmAppointment(a._id), 'Confirmed.')}>Confirm</Button>}
                          {started ? (
                            <>
                              <Button size="sm" onClick={() => setActing({ action: 'complete', appointment: a })}>Complete</Button>
                              <Button size="sm" variant="secondary" onClick={() => quick(() => api.markNoShow(a._id), 'Marked as no-show.')}>No-show</Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="secondary" onClick={() => setActing({ action: 'reschedule', appointment: a })}>Reschedule</Button>
                              <Button size="sm" variant="ghost" onClick={() => setActing({ action: 'cancel', appointment: a })}>Cancel</Button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
      {booking && <BookAppointment onClose={() => setBooking(false)} onDone={done} />}
      {acting && <AppointmentActions {...acting} nameOf={nameOf} onClose={() => setActing(null)} onDone={done} />}
    </>
  );
}
