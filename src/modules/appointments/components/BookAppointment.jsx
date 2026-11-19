import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Field, Input, Modal, Select } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';
import SlotPicker from './SlotPicker';
import useStaff from './useStaff';

/** Staff booking for a lead or a walk-in: type, time, who, intake answers. */
export default function BookAppointment({ onClose, onDone }) {
  const { nameOf } = useStaff();
  const [types, setTypes] = useState([]);
  const [typeId, setTypeId] = useState('');
  const [slot, setSlot] = useState(null);
  const [who, setWho] = useState({ name: '', phone: '', email: '', leadId: '', notes: '' });
  const [answers, setAnswers] = useState({});
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.listTypes().then(({ data }) => setTypes(data.items)).catch(toastError);
  }, []);
  const type = types.find((t) => t._id === typeId);
  const set = (k) => (e) => setWho({ ...who, [k]: e.target.value });

  const search = async () => {
    if (q.trim().length < 2) return;
    try {
      const { data } = await api.searchLeads(q.trim());
      setFound(data.items || []);
    } catch (e) {
      toastError(e);
    }
  };
  const pickLead = (l) => {
    setWho({ ...who, leadId: l._id, name: l.name, phone: l.phone, email: l.email || '' });
    setFound([]);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!slot) return toast.error('Pick a time first.');
    setBusy(true);
    try {
      await api.bookAppointment({
        typeId,
        start: slot.start,
        counsellorId: slot.counsellorId,
        answers,
        ...(who.leadId ? { leadId: who.leadId } : { name: who.name.trim(), phone: who.phone.trim() }),
        ...(who.email && { email: who.email.trim() }),
        ...(who.notes && { notes: who.notes }),
      });
      toast.success('Appointment booked.');
      onDone();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Book an appointment" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Type of appointment">
          <Select value={typeId} onChange={(e) => { setTypeId(e.target.value); setSlot(null); setAnswers({}); }} required>
            <option value="">Choose…</option>
            {types.map((t) => <option key={t._id} value={t._id}>{t.name} ({t.durationMin} min)</option>)}
          </Select>
        </Field>
        {type && <SlotPicker typeId={typeId} value={slot} onChange={setSlot} nameOf={nameOf} />}
        {type && (
          <>
            <Field label="Find an existing lead (optional)" hint="Search by name or phone. Or just type the details below for a walk-in.">
              <div className="flex gap-2">
                <Input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); search(); } }} />
                <Button variant="secondary" onClick={search}>Search</Button>
              </div>
            </Field>
            {found.length > 0 && (
              <ul className="divide-y divide-line rounded-xl border border-line text-sm">
                {found.map((l) => (
                  <li key={l._id}><button type="button" className="w-full px-3 py-2 text-left hover:bg-surface-2" onClick={() => pickLead(l)}>{l.name} · {l.phone}</button></li>
                ))}
              </ul>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name"><Input value={who.name} onChange={set('name')} required={!who.leadId} readOnly={!!who.leadId} /></Field>
              <Field label="Phone"><Input value={who.phone} onChange={set('phone')} required={!who.leadId} readOnly={!!who.leadId} /></Field>
            </div>
            {(type.intakeQuestions || []).map((iq) => (
              <Field key={iq.key} label={`${iq.label}${iq.required ? ' *' : ''}`}>
                <Input value={answers[iq.key] || ''} maxLength={500} onChange={(e) => setAnswers({ ...answers, [iq.key]: e.target.value })} required={iq.required} />
              </Field>
            ))}
            <Field label="Notes (optional)"><Input value={who.notes} maxLength={2000} onChange={set('notes')} /></Field>
          </>
        )}
        <div className="flex gap-2">
          <Button type="submit" loading={busy} disabled={!slot}>Book</Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </form>
    </Modal>
  );
}
