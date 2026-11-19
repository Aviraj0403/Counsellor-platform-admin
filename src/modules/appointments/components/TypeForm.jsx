import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Field, Input, Modal, Select } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';
import { MODE_LABEL } from '../lib';
import useStaff from './useStaff';

const BLANK = {
  name: '', description: '', mode: 'phone', durationMin: 30, bufferBeforeMin: 0, bufferAfterMin: 0, minNoticeHours: 2, maxAdvanceDays: 30, slotStepMin: 15,
  assignment: 'specific', counsellorIds: [], intakeQuestions: [], cancellationNoticeHours: 4, policyText: '', remindersHours: '24, 2', publicBookable: false, active: true, locationOrLink: '',
};

const fromType = (t) => ({
  ...BLANK, ...t,
  description: t.description || '', policyText: t.policyText || '', locationOrLink: t.locationOrLink || '',
  remindersHours: (t.reminders || []).map((r) => r.offsetMin / 60).join(', '),
});

/** Create or edit an appointment type. Every setting has a plain-language hint. */
export default function TypeForm({ type, onClose, onDone }) {
  const { staff } = useStaff();
  const [f, setF] = useState(type ? fromType(type) : BLANK);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const num = (k) => (e) => setF({ ...f, [k]: e.target.value === '' ? '' : Number(e.target.value) });
  const flag = (k) => (e) => setF({ ...f, [k]: e.target.checked });
  const toggle = (id) => setF({ ...f, counsellorIds: f.counsellorIds.includes(id) ? f.counsellorIds.filter((x) => x !== id) : [...f.counsellorIds, id] });
  const setQ = (i, patch) => setF({ ...f, intakeQuestions: f.intakeQuestions.map((q, j) => (j === i ? { ...q, ...patch } : q)) });

  const submit = async (e) => {
    e.preventDefault();
    const hours = f.remindersHours.split(',').map((x) => x.trim()).filter(Boolean).map(Number);
    if (hours.some((h) => !Number.isFinite(h) || h <= 0)) return toast.error('Reminders: write hours before the appointment, for example 24, 2.');
    const body = {
      name: f.name.trim(), description: f.description || undefined, mode: f.mode, durationMin: f.durationMin,
      bufferBeforeMin: f.bufferBeforeMin, bufferAfterMin: f.bufferAfterMin, minNoticeHours: f.minNoticeHours, maxAdvanceDays: f.maxAdvanceDays, slotStepMin: f.slotStepMin,
      assignment: f.assignment, counsellorIds: f.counsellorIds,
      intakeQuestions: f.intakeQuestions.filter((q) => q.key.trim() && q.label.trim()).map((q) => ({ key: q.key.trim(), label: q.label.trim(), required: !!q.required })),
      cancellationNoticeHours: f.cancellationNoticeHours, policyText: f.policyText || undefined,
      reminders: hours.map((h) => ({ offsetMin: Math.round(h * 60) })), publicBookable: f.publicBookable, active: f.active, locationOrLink: f.locationOrLink || undefined,
    };
    setBusy(true);
    try {
      if (type) await api.updateType(type._id, body);
      else await api.createType(body);
      toast.success('Appointment type saved.');
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={type ? 'Edit appointment type' : 'New appointment type'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Name" hint="What the student sees, for example Free career counselling call."><Input value={f.name} onChange={set('name')} minLength={2} maxLength={120} required autoFocus /></Field>
        <Field label="Description (optional)"><Input value={f.description} onChange={set('description')} maxLength={1000} /></Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="How it happens"><Select value={f.mode} onChange={set('mode')}>{Object.entries(MODE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="Length (minutes)"><Input type="number" min={5} max={480} value={f.durationMin} onChange={num('durationMin')} required /></Field>
        </div>
        <Field label="Phone number, video link or address (optional)" hint="Shown to the student only after booking."><Input value={f.locationOrLink} onChange={set('locationOrLink')} maxLength={400} /></Field>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label="Gap before (min)" hint="Free time kept before each appointment."><Input type="number" min={0} max={240} value={f.bufferBeforeMin} onChange={num('bufferBeforeMin')} /></Field>
          <Field label="Gap after (min)" hint="Free time kept after each one."><Input type="number" min={0} max={240} value={f.bufferAfterMin} onChange={num('bufferAfterMin')} /></Field>
          <Field label="Start times every (min)" hint="For example 15 gives 10:00, 10:15, 10:30."><Input type="number" min={5} max={240} value={f.slotStepMin} onChange={num('slotStepMin')} /></Field>
          <Field label="Book at least (hours) ahead" hint="Stops last-minute bookings."><Input type="number" min={0} max={720} value={f.minNoticeHours} onChange={num('minNoticeHours')} /></Field>
          <Field label="Book at most (days) ahead"><Input type="number" min={1} max={365} value={f.maxAdvanceDays} onChange={num('maxAdvanceDays')} /></Field>
          <Field label="Cancel or move until (hours) before" hint="After this, students must call you."><Input type="number" min={0} max={720} value={f.cancellationNoticeHours} onChange={num('cancellationNoticeHours')} /></Field>
        </div>
        <Field label="Who takes these appointments" hint="Pick one person, or several. Their working hours decide when students can book.">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {staff.length === 0 && <span className="text-sm text-fg-muted">Team list is not available to you.</span>}
            {staff.map((s) => (
              <label key={s.id} className="flex items-center gap-1.5 text-sm"><input type="checkbox" checked={f.counsellorIds.includes(s.id)} onChange={() => toggle(s.id)} /> {s.name}</label>
            ))}
          </div>
        </Field>
        <Field label="When several people are chosen" hint="Share equally gives each new booking to whoever has the fewest in the next 7 days. Choose by time lists every person's own times.">
          <Select value={f.assignment} onChange={set('assignment')}>
            <option value="specific">Choose by time (each person listed)</option>
            <option value="round_robin">Share equally (round-robin)</option>
          </Select>
        </Field>
        <div>
          <p className="label-gap text-sm font-medium text-fg-secondary">Questions asked when booking</p>
          {f.intakeQuestions.map((q, i) => (
            <div key={i} className="mb-2 grid grid-cols-[1fr_1.6fr_auto_auto] items-center gap-2">
              <Input placeholder="key (course)" value={q.key} maxLength={40} onChange={(e) => setQ(i, { key: e.target.value })} aria-label="Question key" />
              <Input placeholder="Question text" value={q.label} maxLength={160} onChange={(e) => setQ(i, { label: e.target.value })} aria-label="Question text" />
              <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!q.required} onChange={(e) => setQ(i, { required: e.target.checked })} /> Required</label>
              <Button variant="ghost" size="sm" onClick={() => setF({ ...f, intakeQuestions: f.intakeQuestions.filter((_, j) => j !== i) })}>Remove</Button>
            </div>
          ))}
          <Button variant="secondary" size="sm" onClick={() => setF({ ...f, intakeQuestions: [...f.intakeQuestions, { key: '', label: '', required: false }] })}>Add question</Button>
          <p className="mt-1 text-xs text-fg-muted">Tip: a question with the key age (or isUnder18) makes the form ask for a parent or guardian when the student is under 18.</p>
        </div>
        <Field label="Reminders (hours before)" hint="WhatsApp reminders, for example 24, 2. Leave empty for none. Reminders need the scheduled job to be set up by your administrator."><Input value={f.remindersHours} onChange={set('remindersHours')} /></Field>
        <Field label="Cancellation policy (shown to students)"><Input value={f.policyText} onChange={set('policyText')} maxLength={1000} /></Field>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.publicBookable} onChange={flag('publicBookable')} /> Students and the chat assistant can book this online</label>
        {type && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={flag('active')} /> Active (untick to stop new bookings)</label>}
        <div className="flex gap-2">
          <Button type="submit" loading={busy}>Save</Button>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </Modal>
  );
}
