import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import { useAuth } from '../../auth';
import * as api from '../api';
import { openDocument } from './openDocument';

const TONE = { missing: 'gray', pending_review: 'amber', verified: 'green', rejected: 'red' };
const LABEL = { missing: 'Missing', pending_review: 'Waiting for review', verified: 'Verified', rejected: 'Rejected' };
const kb = (n) => (n >= 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/** Documents panel for one student (and optionally one application): checklist, upload, verify / reject, signed download. */
export default function StudentDocuments({ studentId, applicationId }) {
  const { can } = useAuth();
  const [checklist, setChecklist] = useState(null);
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState('');
  const [reject, setReject] = useState(null); // { id, reason }
  const [extraType, setExtraType] = useState('');
  const picker = useRef(null);
  const pickFor = useRef(null); // { type, label }

  const params = useCallback(() => ({ studentId, ...(applicationId ? { applicationId } : {}) }), [studentId, applicationId]);

  const load = useCallback(async () => {
    try {
      const [c, d] = await Promise.all([api.getChecklist(params()), api.listDocuments(params())]);
      setChecklist(c.data);
      setDocs(d.data.items.filter((x) => !x.supersededBy));
    } catch (e) {
      toastError(e);
      setChecklist({ items: [], complete: false });
    }
  }, [params]);

  useEffect(() => {
    load();
  }, [load]);

  const choose = (type, label) => {
    pickFor.current = { type, label };
    picker.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !pickFor.current) return;
    const { type, label } = pickFor.current;
    setBusy(`up-${type}`);
    try {
      await api.uploadDocument(file, { ...params(), type, ...(label ? { label } : {}) });
      toast.success('Uploaded. It is now waiting for review.');
      await load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy('');
    }
  };

  const act = async (key, fn, okMsg) => {
    setBusy(key);
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      await load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy('');
    }
  };

  if (!checklist) return <Spinner />;
  const canWrite = can('documents:write');
  const canVerify = can('documents:verify');
  const canDownload = can('documents:download');
  const byId = new Map(docs.map((d) => [d._id, d]));
  const listed = new Set(checklist.items.map((i) => i.type));
  const others = docs.filter((d) => !listed.has(d.type));

  const row = (type, label, mandatory, state, d, rejectReason) => (
    <li key={`${type}-${d?._id || 'none'}`} className="flex flex-wrap items-center justify-between gap-2 border-b border-line py-2 last:border-0">
      <div className="min-w-0">
        <div className="text-sm font-medium">
          {label || type}
          {mandatory && <span className="ml-1 text-xs text-fg-muted">(required)</span>}
        </div>
        {d && <div className="text-xs text-fg-muted">{d.fileName} · {kb(d.sizeBytes)} · v{d.version} · {formatDate(d.createdAt)}</div>}
        {state === 'rejected' && rejectReason && <div className="text-xs text-red-600 dark:text-red-400">Reason: {rejectReason}</div>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={TONE[state]}>{LABEL[state]}</Badge>
        {d && canDownload && <Button size="sm" variant="secondary" loading={busy === `dl-${d._id}`} onClick={() => act(`dl-${d._id}`, () => openDocument(d._id))}>Open</Button>}
        {d && canVerify && state === 'pending_review' && (
          <>
            <Button size="sm" loading={busy === `v-${d._id}`} onClick={() => act(`v-${d._id}`, () => api.verifyDocument(d._id), 'Verified.')}>Verify</Button>
            <Button size="sm" variant="secondary" onClick={() => setReject({ id: d._id, reason: '' })}>Reject</Button>
          </>
        )}
        {d && canVerify && state === 'rejected' && <Button size="sm" variant="secondary" loading={busy === `v-${d._id}`} onClick={() => act(`v-${d._id}`, () => api.verifyDocument(d._id), 'Verified.')}>Verify anyway</Button>}
        {d && canWrite && state !== 'verified' && (
          <Button size="sm" variant="secondary" loading={busy === `x-${d._id}`} onClick={() => act(`x-${d._id}`, () => api.deleteDocument(d._id), 'Deleted.')}>Delete</Button>
        )}
        {canWrite && <Button size="sm" variant="secondary" loading={busy === `up-${type}`} onClick={() => choose(type, label)}>{d ? 'Upload new version' : 'Upload'}</Button>}
      </div>
    </li>
  );

  return (
    <Card title="Documents">
      <input ref={picker} type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="hidden" onChange={onFile} />
      <p className="mb-3 text-xs text-fg-muted">PDF, JPEG or PNG only. Files are stored encrypted; every download is recorded.</p>
      {checklist.items.length === 0 && others.length === 0 && <Empty>No documents are required or uploaded yet.</Empty>}
      <ul>
        {checklist.items.map((i) => row(i.type, i.label, i.mandatory, i.state, i.documentId ? byId.get(i.documentId) : null, i.rejectReason))}
        {others.map((d) => row(d.type, d.label || d.type, false, d.status, d, d.rejectReason))}
      </ul>
      {applicationId && checklist.items.length > 0 && (
        <p className="mt-3 text-sm">{checklist.complete ? 'All required documents are verified. The application can be submitted.' : 'The application cannot be submitted until every required document is verified.'}</p>
      )}
      {canWrite && (
        <div className="mt-4 flex flex-wrap items-end gap-2">
          <Field label="Other document type"><Input value={extraType} onChange={(e) => setExtraType(e.target.value)} placeholder="For example: income_certificate" maxLength={60} /></Field>
          <Button variant="secondary" disabled={!extraType.trim()} onClick={() => choose(extraType.trim().toLowerCase().replace(/\s+/g, '_'), extraType.trim())}>Upload</Button>
        </div>
      )}
      {reject && (
        <Modal title="Reject this document" onClose={() => setReject(null)}>
          <div className="space-y-3">
            <Field label="Reason (the student will be told)"><Input value={reject.reason} onChange={(e) => setReject({ ...reject, reason: e.target.value })} maxLength={500} placeholder="For example: the scan is blurred" /></Field>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setReject(null)}>Cancel</Button>
              <Button variant="danger" disabled={reject.reason.trim().length < 3} loading={busy === `r-${reject.id}`} onClick={async () => { await act(`r-${reject.id}`, () => api.rejectDocument(reject.id, reject.reason.trim()), 'Rejected.'); setReject(null); }}>Reject</Button>
            </div>
          </div>
        </Modal>
      )}
    </Card>
  );
}
