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
  const [copied, setCopied] = useState(false);
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

  const copyReferral = () => {
    if (!data?.referral?.referralCode) return;
    const url = `${window.location.origin}/enquiry?ref=${data.referral.referralCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!data) return <Spinner />;
  return (
    <>
      <PageHeader
        title="Student Portal"
        subtitle={`Welcome, ${data.profile.name}. Track your admission progress and complete document uploads.`}
      />

      {/* Top Banner: Assigned Counsellor & Referral Card */}
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        {data.counsellor ? (
          <Card className="flex items-center justify-between border-l-4 border-l-brand-600 bg-brand-50/30 p-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-brand-700">Your Assigned Counsellor</span>
              <h3 className="text-base font-bold text-fg">{data.counsellor.name}</h3>
              <p className="text-xs text-fg-muted">Available to guide you through counselling rounds</p>
            </div>
            <a
              href={`https://wa.me/?text=Hello%20${encodeURIComponent(data.counsellor.name)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700"
            >
              WhatsApp Support
            </a>
          </Card>
        ) : (
          <Card className="p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Counsellor</span>
            <p className="text-sm text-fg">Your dedicated counsellor will be assigned shortly.</p>
          </Card>
        )}

        {data.referral && (
          <Card className="flex items-center justify-between border-l-4 border-l-purple-600 bg-purple-50/30 p-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-purple-700">Refer a Friend & Earn ₹2,000</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="rounded bg-purple-100 px-2 py-0.5 font-mono text-xs font-bold text-purple-800">
                  {data.referral.referralCode}
                </span>
                <span className="text-xs text-fg-muted">Share your link</span>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={copyReferral}>
              {copied ? 'Copied Link!' : 'Copy Invite Link'}
            </Button>
          </Card>
        )}
      </div>

      {/* Pending Fees & Seat Booking Payments */}
      {(data.feeLinks || []).length > 0 && (
        <Card className="mb-6 p-4">
          <h3 className="mb-2 text-sm font-semibold text-fg">Pending Fees & Seat Booking Deposits</h3>
          <div className="divide-y divide-line">
            {(data.feeLinks || []).map((f) => (
              <div key={f._id} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium text-fg">{f.title}</div>
                  <div className="text-xs text-fg-muted">Amount: ₹{(f.amountPaise / 100).toLocaleString('en-IN')}</div>
                </div>
                <div>
                  {f.status === 'paid' ? (
                    <Badge tone="success">Paid</Badge>
                  ) : (
                    <a
                      href={f.shortUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
                    >
                      Pay Online (Razorpay)
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <div className="mb-4">
        <h3 className="text-base font-semibold text-fg">Your Applications</h3>
      </div>

      {(data.applications || []).length === 0 ? (
        <Empty>No applications yet. Your counsellor will add them.</Empty>
      ) : (
        <div className="space-y-5">
          {(data.applications || []).map((a) => <ApplicationCard key={a.id} app={a} onChange={load} />)}
        </div>
      )}
    </>
  );
}
