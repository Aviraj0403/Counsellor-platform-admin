import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useAuth } from '../../auth';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import * as api from '../api';
import useStaff from '../components/useStaff';
import { fmtDateTime } from '../lib';

const TONE = { waiting: 'blue', offered: 'amber', booked: 'green', expired: 'gray' };

function AddForm({ types, onClose, onDone }) {
  const [f, setF] = useState({ typeId: '', name: '', phone: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.addWaitlist({ ...f, name: f.name.trim(), phone: f.phone.trim() });
      toast.success('Added to the waiting list.');
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Add to waiting list" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Type of appointment"><Select value={f.typeId} onChange={(e) => setF({ ...f, typeId: e.target.value })} required><option value="">Choose…</option>{types.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</Select></Field>
        <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} minLength={2} required /></Field>
        <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} required /></Field>
        <div className="flex gap-2"><Button type="submit" loading={busy}>Add</Button><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
      </form>
    </Modal>
  );
}

export default function Waitlist() {
  const { t } = useI18n();
  const { can } = useAuth();
  const { nameOf } = useStaff();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [types, setTypes] = useState([]);
  const [adding, setAdding] = useState(false);
  const load = useCallback(() => api.listWaitlist({ page, limit: 25, ...(status && { status }) }).then(({ data: d }) => setData(d)).catch(toastError), [page, status]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { api.listTypes({ includeInactive: 1 }).then(({ data: d }) => setTypes(d.items)).catch(() => {}); }, []);
  const typeName = (id) => types.find((t) => t._id === id)?.name || '';
  const expire = async (id) => {
    try {
      await api.expireWaitlist(id);
      load();
    } catch (e) {
      toastError(e);
    }
  };
  const write = can('appointments:write');
  return (
    <>
      <PageHeader title={t('page.waitlist', 'Waiting list')} subtitle="People waiting for a time. When an appointment is cancelled or moved, the first matching person is marked Offered here and you can book them in." action={write && <Button onClick={() => setAdding(true)}>Add person</Button>} />
      <Card>
        <div className="mb-4 max-w-xs">
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} aria-label="Status">
            <option value="">Any status</option>
            {Object.keys(TONE).map((s) => <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>)}
          </Select>
        </div>
        {!data ? <Spinner /> : data.items.length === 0 ? <Empty>Nobody is waiting.</Empty> : (
          <>
            <Table head={['Person', 'Type', 'Status', 'Offered time', '']}>
              {data.items.map((w) => (
                <tr key={w._id}>
                  <td className="px-3 py-2.5 font-medium">{w.name}<span className="block text-xs text-fg-muted">{w.phone}</span></td>
                  <td className="px-3 py-2.5">{typeName(w.typeId)}</td>
                  <td className="px-3 py-2.5"><Badge tone={TONE[w.status]}>{w.status}</Badge></td>
                  <td className="px-3 py-2.5 text-fg-muted">{w.offeredStart ? `${fmtDateTime(w.offeredStart)} with ${nameOf(w.offeredCounsellorId)}` : ''}</td>
                  <td className="px-3 py-2.5 text-right">{write && (w.status === 'waiting' || w.status === 'offered') && <Button size="sm" variant="ghost" onClick={() => expire(w._id)}>Remove</Button>}</td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
      {adding && <AddForm types={types} onClose={() => setAdding(false)} onDone={() => { setAdding(false); load(); }} />}
    </>
  );
}
