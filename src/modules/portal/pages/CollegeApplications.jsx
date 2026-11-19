import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, humanize } from '../../../shared/lib/format';
import { API_BASE_URL } from '../../../shared/api/apiConfig';
import * as api from '../api';
import Timeline from '../components/Timeline';

const ACTIONS = ['under_review', 'offered', 'rejected', 'accepted', 'admitted'];

function Detail({ id, onClose, onChanged }) {
  const [app, setApp] = useState(null);
  const [docs, setDocs] = useState([]);
  const [to, setTo] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const [a, d] = await Promise.all([api.collegeApplication(id), api.collegeDocuments(id)]);
      setApp(a.data);
      setDocs(d.data.items);
    } catch (e) {
      toastError(e);
    }
  }, [id]);
  useEffect(() => {
    load();
  }, [load]);

  const update = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.collegeSetStatus(id, { to, ...(note && { note }) });
      setTo('');
      setNote('');
      await load();
      onChanged();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const open = async (docId) => {
    try {
      const { data } = await api.collegeDownloadLink(id, docId);
      window.open(`${API_BASE_URL.replace(/\/api\/v1$/, '')}${data.url}`, '_blank', 'noopener');
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <Modal title="Application" onClose={onClose}>
      {!app ? <Spinner /> : (
        <div className="space-y-4 text-sm">
          <div>
            <div className="text-base font-semibold">{app.student.name}</div>
            <div className="text-fg-muted">{app.courseName} · {humanize(app.status)}</div>
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Academics</h4>
            {app.student.academics.length === 0 ? <p className="text-fg-muted">None recorded.</p> : (
              <ul className="space-y-1">
                {app.student.academics.map((a, i) => <li key={i}>{[a.level, a.board, a.institute, a.year].filter(Boolean).join(' · ')}{a.percentage != null && ` · ${a.percentage}%`}</li>)}
              </ul>
            )}
          </div>
          <div>
            <h4 className="mb-1 font-semibold">History</h4>
            <Timeline history={app.statusHistory} />
          </div>
          <div>
            <h4 className="mb-1 font-semibold">Verified documents</h4>
            {docs.length === 0 ? <p className="text-fg-muted">No verified documents yet.</p> : (
              <ul className="space-y-1">
                {docs.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2">
                    <span>{d.label || humanize(d.type)} <span className="text-fg-muted">({formatDate(d.verifiedAt)})</span></span>
                    <Button size="sm" variant="secondary" onClick={() => open(d.id)}>Open</Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <form onSubmit={update} className="space-y-2 border-t border-line pt-3">
            <Field label="Update status">
              <Select required value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">Choose...</option>
                {ACTIONS.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
              </Select>
            </Field>
            <Field label="Note (optional)"><Input value={note} maxLength={500} onChange={(e) => setNote(e.target.value)} /></Field>
            <Button type="submit" disabled={busy || !to}>Save</Button>
          </form>
        </div>
      )}
    </Modal>
  );
}

/** College view: applications sent to this college (name + marks only), with status updates. */
export default function CollegeApplications() {
  const [data, setData] = useState(null);
  const [open, setOpen] = useState(null);
  const load = useCallback(async () => {
    try {
      setData((await api.collegeApplications({ limit: 100 })).data);
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
      <PageHeader title="College applications" subtitle={`Applications sent to ${data.college.name}.`} />
      <Card>
        {data.items.length === 0 ? <Empty>No applications have been sent to you yet.</Empty> : (
          <Table head={['Student', 'Course', 'Intake', 'Status', '']}>
            {data.items.map((a) => (
              <tr key={a.id}>
                <td className="px-3 py-2.5 font-medium">{a.student.name}</td>
                <td className="px-3 py-2.5 text-fg-secondary">{a.courseName}</td>
                <td className="px-3 py-2.5 text-fg-muted">{a.intake ? `${a.intake.month}/${a.intake.year}` : ','}</td>
                <td className="px-3 py-2.5"><Badge tone="blue">{humanize(a.status)}</Badge></td>
                <td className="px-3 py-2.5 text-right"><Button size="sm" variant="secondary" onClick={() => setOpen(a.id)}>Open</Button></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
      {open && <Detail id={open} onClose={() => setOpen(null)} onChanged={load} />}
    </>
  );
}
