import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, PageHeader } from '../../../shared/ui/ui';
import * as api from '../api';
import StudentForm from '../components/StudentForm';
import { blankStudent, formToBody, isMinorDob } from '../components/studentForm.helpers';
import { toastError } from '../../../shared/lib/AxiosToastError';

/** Two ways in: type a new student, or pick an existing lead and convert it (copies name, phone, email, city, course and consent). */
export default function StudentNew() {
  const nav = useNavigate();
  const [form, setForm] = useState(blankStudent());
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState('');
  const [leads, setLeads] = useState(null);
  const [picked, setPicked] = useState(null);
  const [dob, setDob] = useState('');
  const [guardianConsent, setGuardianConsent] = useState(false);
  const [guardianBy, setGuardianBy] = useState('');

  useEffect(() => {
    if (q.trim().length < 2) {
      setLeads(null);
      return undefined;
    }
    const h = setTimeout(async () => {
      try {
        const { data } = await api.searchLeads(q.trim());
        setLeads(data.items);
      } catch (e) {
        toastError(e);
      }
    }, 300);
    return () => clearTimeout(h);
  }, [q]);

  const create = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.createStudent(formToBody(form));
      toast.success('Student added.');
      nav(`/students/${data._id}`);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const convert = async () => {
    setBusy(true);
    try {
      const body = { ...(dob && { dob }), ...(guardianConsent && { guardianConsent: { given: true, by: guardianBy || undefined } }) };
      const { data } = await api.createFromLead(picked._id, body);
      toast.success('Student created from the lead.');
      nav(`/students/${data._id}`);
    } catch (err) {
      toastError(err); // for example "A student was already created from this lead."
    } finally {
      setBusy(false);
    }
  };

  const minor = isMinorDob(dob);

  return (
    <>
      <PageHeader title="Add student" subtitle="Start from an existing lead, or enter a new student by hand." action={<Link to="/students" className="text-sm underline">Back to students</Link>} />

      <Card title="Create from a lead" className="mb-5">
        {!picked ? (
          <>
            <div className="max-w-sm">
              <Input placeholder="Search leads by name or phone" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search leads" />
            </div>
            {leads && (leads.length === 0 ? (
              <div className="mt-3"><Empty>No matching leads.</Empty></div>
            ) : (
              <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
                {leads.map((l) => (
                  <li key={l._id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <span><span className="font-medium">{l.name}</span> <span className="text-fg-muted">{l.phone} {l.city ? `· ${l.city}` : ''}</span></span>
                    <Button size="sm" variant="secondary" onClick={() => setPicked(l)}>Use this lead</Button>
                  </li>
                ))}
              </ul>
            ))}
          </>
        ) : (
          <div className="space-y-3">
            <p className="text-sm">Converting <span className="font-medium">{picked.name}</span> ({picked.phone}) <Badge tone={picked.consent?.given ? 'green' : 'amber'}>{picked.consent?.given ? 'consent recorded' : 'no consent on lead'}</Badge></p>
            <div className="max-w-xs"><Field label="Date of birth" hint="Needed to check the under-18 rule"><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} /></Field></div>
            {minor && (
              <div className="rounded-lg border border-line bg-surface-muted p-3 text-sm">
                <p className="mb-2 font-medium">Under 18: a parent or guardian must consent.</p>
                <label className="flex items-center gap-2"><input type="checkbox" className="accent-indigo-600" checked={guardianConsent} onChange={(e) => setGuardianConsent(e.target.checked)} /> The parent / guardian gave consent.</label>
                <div className="mt-2 max-w-sm"><Field label="Consent given by"><Input value={guardianBy} onChange={(e) => setGuardianBy(e.target.value)} /></Field></div>
              </div>
            )}
            <div className="flex gap-2">
              <Button loading={busy} disabled={minor && !guardianConsent} onClick={convert}>Create student</Button>
              <Button variant="secondary" onClick={() => setPicked(null)}>Choose another lead</Button>
            </div>
          </div>
        )}
      </Card>

      <Card title="New student">
        <StudentForm value={form} onChange={setForm} onSubmit={create} submitLabel="Add student" busy={busy} />
      </Card>
    </>
  );
}
