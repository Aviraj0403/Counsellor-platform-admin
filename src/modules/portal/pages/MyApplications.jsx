import { useCallback, useEffect, useRef, useState } from 'react';
import { Badge, Button, Card, Empty, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { humanize } from '../../../shared/lib/format';
import toast from 'react-hot-toast';
import * as api from '../api';
import Timeline from '../components/Timeline';

const STATE_TONE = { verified: 'green', pending_review: 'amber', rejected: 'red', missing: 'gray' };

function Upload({ app, onDone }) {
  const missing = app.checklist.filter((c) => c.state === 'missing' || c.state === 'rejected');
  const [type, setType] = useState('');
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const send = async (e) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file || !type) return;
    setBusy(true);
    try {
      await api.studentUpload(file, { type, applicationId: app.id });
      toast.success('Uploaded. Our team will check it.');
      if (fileRef.current) fileRef.current.value = '';
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  if (missing.length === 0) return null;
  return (
    <form onSubmit={send} className="mt-3 flex flex-wrap items-end gap-3">
      <label className="text-sm">
        <span className="mb-1 block text-fg-muted">Document</span>
        <Select required value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">Choose...</option>
          {missing.map((c) => <option key={c.type} value={c.type}>{c.label || humanize(c.type)}</option>)}
        </Select>
      </label>
      <input ref={fileRef} required type="file" accept="application/pdf,image/jpeg,image/png" className="text-sm" />
      <Button type="submit" disabled={busy}>Upload</Button>
    </form>
  );
}

function ApplicationCard({ app, onChange }) {
  return (
    <Card title={`${app.collegeName || 'College'} · ${app.courseName || 'Course'}`} action={<Badge tone="blue">{humanize(app.status)}</Badge>}>
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h4 className="mb-2 text-sm font-semibold">Progress</h4>
          <Timeline history={app.statusHistory} />
        </div>
        <div>
          <h4 className="mb-2 text-sm font-semibold">Documents needed</h4>
          {app.checklist.length === 0 ? (
            <p className="text-sm text-fg-muted">No documents are required yet.</p>
          ) : (
            <Table head={['Document', 'Status']}>
              {app.checklist.map((c) => (
                <tr key={c.type}>
                  <td className="px-3 py-2">{c.label || humanize(c.type)}{c.mandatory && <span className="ml-1 text-fg-muted">(required)</span>}</td>
                  <td className="px-3 py-2">
                    <Badge tone={STATE_TONE[c.state] || 'gray'}>{humanize(c.state)}</Badge>
                    {c.state === 'rejected' && c.rejectReason && <div className="mt-1 text-xs text-fg-muted">{c.rejectReason}</div>}
                  </td>
                </tr>
              ))}
            </Table>
          )}
          <Upload app={app} onDone={onChange} />
        </div>
      </div>
    </Card>
  );
}

/** The student's own view: where each application stands, what is missing, and a way to upload it. */
export default function MyApplications() {
  const [data, setData] = useState(null);
  const load = useCallback(async () => {
    try {
      setData((await api.studentOverview()).data);
    } catch (e) {
      toastError(e);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!data) return <Spinner />;
  return (
    <>
      <PageHeader title="My application" subtitle={`Hello ${data.profile.name}. Follow your applications and upload the documents we ask for.`} />
      {data.applications.length === 0 ? (
        <Empty>No applications yet. Your counsellor will add them.</Empty>
      ) : (
        <div className="space-y-5">
          {data.applications.map((a) => <ApplicationCard key={a.id} app={a} onChange={load} />)}
        </div>
      )}
    </>
  );
}
