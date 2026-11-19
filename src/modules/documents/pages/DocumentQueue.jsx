import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Button, Empty, Field, Input, Modal, PageHeader, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import * as api from '../api';
import { openDocument } from '../components/openDocument';

export default function DocumentQueue() {
  const [items, setItems] = useState(null);
  const [busy, setBusy] = useState('');
  const [reject, setReject] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.getQueue({ status: 'pending_review', limit: 50 });
      setItems(data.items);
    } catch (e) {
      toastError(e);
      setItems([]);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const act = async (key, fn, msg) => {
    setBusy(key);
    try {
      await fn();
      toast.success(msg);
      await load();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy('');
    }
  };

  if (!items) return <Spinner />;
  return (
    <>
      <PageHeader title="Document verification queue" subtitle="Uploaded documents waiting for review, oldest first." />
      {items.length === 0 ? (
        <Empty>Nothing is waiting for review.</Empty>
      ) : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
          {items.map((d) => (
            <li key={d._id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <div className="text-sm font-medium">
                  <Link className="underline" to={`/students/${d.studentId}`}>{d.studentName || 'Student'}</Link>: {d.label || d.type}
                </div>
                <div className="text-xs text-fg-muted">{d.fileName} · v{d.version} · uploaded {formatDate(d.createdAt)}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" loading={busy === `o-${d._id}`} onClick={() => act(`o-${d._id}`, () => openDocument(d._id), 'Opened in a new tab.')}>Open</Button>
                <Button size="sm" loading={busy === `v-${d._id}`} onClick={() => act(`v-${d._id}`, () => api.verifyDocument(d._id), 'Verified.')}>Verify</Button>
                <Button size="sm" variant="secondary" onClick={() => setReject({ id: d._id, reason: '' })}>Reject</Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {reject && (
        <Modal title="Reject this document" onClose={() => setReject(null)}>
          <div className="space-y-3">
            <Field label="Reason"><Input value={reject.reason} onChange={(e) => setReject({ ...reject, reason: e.target.value })} maxLength={500} /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReject(null)}>Cancel</Button>
              <Button variant="danger" disabled={reject.reason.trim().length < 3} onClick={async () => { await act(`r-${reject.id}`, () => api.rejectDocument(reject.id, reject.reason.trim()), 'Rejected.'); setReject(null); }}>Reject</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
