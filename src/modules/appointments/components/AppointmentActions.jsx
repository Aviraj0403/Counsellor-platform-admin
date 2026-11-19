import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Field, Input, Modal } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';
import { fmtDateTime } from '../lib';
import SlotPicker from './SlotPicker';

/** One dialog for the actions that need input: cancel (reason), reschedule (new time), complete (notes). */
export default function AppointmentActions({ action, appointment, nameOf, onClose, onDone }) {
  const [text, setText] = useState('');
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (action === 'cancel') await api.cancelAppointment(appointment._id, text.trim());
      if (action === 'complete') await api.completeAppointment(appointment._id, text.trim() || undefined);
      if (action === 'reschedule') {
        if (!slot) throw new Error('Pick a new time first.');
        await api.rescheduleAppointment(appointment._id, { start: slot.start });
      }
      toast.success('Done.');
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const title = { cancel: 'Cancel appointment', complete: 'Mark as completed', reschedule: 'Reschedule appointment' }[action];
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <p className="text-sm text-fg-secondary">{appointment.who?.name} · {fmtDateTime(appointment.start)}</p>
        {action === 'cancel' && (
          <Field label="Reason" hint="Saved on the appointment. If someone is on the waiting list, they are offered this time.">
            <Input value={text} onChange={(e) => setText(e.target.value)} minLength={2} maxLength={500} required autoFocus />
          </Field>
        )}
        {action === 'complete' && (
          <Field label="Notes (optional)" hint="What was discussed or agreed?">
            <Input value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} autoFocus />
          </Field>
        )}
        {action === 'reschedule' && <SlotPicker typeId={appointment.typeId} counsellorId={appointment.counsellorId} value={slot} onChange={setSlot} nameOf={nameOf} />}
        <div className="flex gap-2">
          <Button type="submit" loading={busy} variant={action === 'cancel' ? 'danger' : 'primary'}>{action === 'cancel' ? 'Cancel appointment' : 'Save'}</Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </form>
    </Modal>
  );
}
