import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Spinner } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { StudentDocuments } from '../../documents';
import * as api from '../api';
import { TONE, intakeLabel, statusLabel } from '../status';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, formatINR, rupeesToPaise } from '../../../shared/lib/format';

const FEE_STATUSES = ['accepted', 'fee_paid', 'admitted'];
const paiseToRupees = (p) => (p == null ? '' : String(p / 100));
const toForm = (a) => ({
  collegeRef: a.collegeRef || '',
  notes: a.notes || '',
  applicationFee: paiseToRupees(a.fee?.applicationFeePaise),
  tuition: paiseToRupees(a.fee?.tuitionPaise),
  scholarship: paiseToRupees(a.offer?.scholarshipPaise),
  deadline: a.offer?.deadline ? String(a.offer.deadline).slice(0, 10) : '',
  offerNote: a.offer?.note || '',
});

export default function ApplicationDetail() {
  const { id } = useParams();
  const { can, hasModule } = useAuth();
  const [a, setA] = useState(null);
  const [failed, setFailed] = useState(false);
  const [move, setMove] = useState(null); // { to, note, fee }
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const { data } = await api.getApplication(id);
      setA(data);
    } catch (e) {
      setFailed(true);
      toastError(e);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const back = <Link to="/applications" className="text-sm underline">Back to applications</Link>;
  if (failed) return <PageHeader title="Application" subtitle="This application could not be opened. It may not exist or may not be assigned to you." action={back} />;
  if (!a) return <Spinner />;

  const submitMove = async (e) => {
    e.preventDefault();
    const body = { to: move.to, ...(move.note && { note: move.note }) };
    if (FEE_STATUSES.includes(move.to) && move.fee !== '') {
      const p = rupeesToPaise(move.fee);
      if (Number.isNaN(p)) return toast.error('Enter the amount paid in rupees, for example 150000 or 150000.50.');
      body.feePaidPaise = p;
    }
    setBusy(true);
    try {
      await api.changeStatus(id, body);
      toast.success(`Moved to ${statusLabel(move.to)}.`);
      setMove(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    const money = (v) => (v === '' ? undefined : rupeesToPaise(v));
    const [app, tui, sch] = [money(form.applicationFee), money(form.tuition), money(form.scholarship)];
    if ([app, tui, sch].some((v) => Number.isNaN(v))) return toast.error('Amounts must be in rupees, for example 1500 or 1500.50.');
    setBusy(true);
    try {
      await api.updateApplication(id, {
        collegeRef: form.collegeRef,
        notes: form.notes,
        fee: { ...(app !== undefined && { applicationFeePaise: app }), ...(tui !== undefined && { tuitionPaise: tui }) },
        offer: { ...(sch !== undefined && { scholarshipPaise: sch }), ...(form.deadline && { deadline: form.deadline }), ...(form.offerNote && { note: form.offerNote }) },
      });
      toast.success('Saved.');
      setForm(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const next = a.allowedNext || [];
  const row = (label, value) => (
    <div className="flex justify-between gap-4 py-1.5 text-sm">
      <span className="text-fg-muted">{label}</span>
      <span className="text-right text-fg">{value || ','}</span>
    </div>
  );

  return (
    <>
      <PageHeader title={`${a.studentName || 'Student'}: ${a.courseName || 'Course'}`} subtitle={`${a.collegeName || ''} · intake ${intakeLabel(a.intake)}`} action={back} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Status">
          <div className="mb-3"><Badge tone={TONE[a.status]}>{statusLabel(a.status)}</Badge></div>
          {next.length === 0 ? (
            <p className="text-sm text-fg-muted">This application is finished. No further changes are possible.</p>
          ) : can('applications:status') ? (
            <div className="flex flex-wrap gap-2">
              {next.map((s) => (
                <Button key={s} variant={s === 'withdrawn' ? 'secondary' : 'primary'} size="sm" onClick={() => setMove({ to: s, note: '', fee: '' })}>
                  Move to {statusLabel(s)}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fg-muted">You can view this application but not change its status.</p>
          )}
          <h4 className="mb-2 mt-5 text-sm font-medium">History</h4>
          <ol className="space-y-2 text-sm">
            {[...(a.statusHistory || [])].reverse().map((h, i) => (
              <li key={i} className="rounded-lg border border-line px-3 py-2">
                <div>{h.from ? `${statusLabel(h.from)} → ${statusLabel(h.to)}` : `Created as ${statusLabel(h.to)}`}</div>
                <div className="text-xs text-fg-muted">
                  {formatDate(h.at)}
                  {h.note ? ` · ${h.note}` : ''}
                </div>
              </li>
            ))}
          </ol>
        </Card>
        <Card title="Fees and offer" action={can('applications:write') && <Button variant="secondary" size="sm" onClick={() => setForm(toForm(a))}>Edit</Button>}>
          {row('College reference', a.collegeRef)}
          {row('Application fee', a.fee?.applicationFeePaise != null && formatINR(a.fee.applicationFeePaise))}
          {row('Tuition', a.fee?.tuitionPaise != null && formatINR(a.fee.tuitionPaise))}
          {row('Paid so far', formatINR(a.fee?.paidPaise))}
          {row('Scholarship', a.offer?.scholarshipPaise != null && formatINR(a.offer.scholarshipPaise))}
          {row('Offer deadline', a.offer?.deadline && formatDate(a.offer.deadline).split(',')[0])}
          {row('Offer note', a.offer?.note)}
          {row('Notes', a.notes)}
        </Card>
      </div>

      {hasModule('documents') && can('documents:read') && a.studentId && <div className="mt-4"><StudentDocuments studentId={a.studentId} applicationId={id} /></div>}

      {move && (
        <Modal title={`Move to ${statusLabel(move.to)}`} onClose={() => setMove(null)}>
          <form onSubmit={submitMove} className="space-y-3">
            <Field label="Note (optional)">
              <Input value={move.note} onChange={(e) => setMove({ ...move, note: e.target.value })} maxLength={500} />
            </Field>
            {FEE_STATUSES.includes(move.to) && (
              <Field label="Amount paid so far (rupees)" hint="Leave empty to keep the current amount. Commission is calculated from this.">
                <Input inputMode="decimal" value={move.fee} onChange={(e) => setMove({ ...move, fee: e.target.value })} />
              </Field>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setMove(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Confirm</Button>
            </div>
          </form>
        </Modal>
      )}

      {form && (
        <Modal title="Edit fees and offer" onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-3">
            <Field label="College reference"><Input value={form.collegeRef} onChange={(e) => setForm({ ...form, collegeRef: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Application fee (rupees)"><Input inputMode="decimal" value={form.applicationFee} onChange={(e) => setForm({ ...form, applicationFee: e.target.value })} /></Field>
              <Field label="Tuition (rupees)"><Input inputMode="decimal" value={form.tuition} onChange={(e) => setForm({ ...form, tuition: e.target.value })} /></Field>
              <Field label="Scholarship (rupees)"><Input inputMode="decimal" value={form.scholarship} onChange={(e) => setForm({ ...form, scholarship: e.target.value })} /></Field>
              <Field label="Offer deadline"><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
            </div>
            <Field label="Offer note"><Input value={form.offerNote} onChange={(e) => setForm({ ...form, offerNote: e.target.value })} /></Field>
            <Field label="Notes"><Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
              <Button type="submit" loading={busy}>Save</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
