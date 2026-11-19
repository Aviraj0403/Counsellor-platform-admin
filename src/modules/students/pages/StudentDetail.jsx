import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Field, Input, Modal, PageHeader, Spinner } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { StudentDocuments } from '../../documents';
import * as api from '../api';
import StudentForm from '../components/StudentForm';
import { formToBody, studentToForm } from '../components/studentForm.helpers';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, formatINR } from '../../../shared/lib/format';

const download = (name, data) => {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
};

export default function StudentDetail() {
  const { id } = useParams();
  const { can, hasModule } = useAuth();
  const [s, setS] = useState(null);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [erase, setErase] = useState(null); // { confirm, reason }

  const load = useCallback(async () => {
    try {
      const { data } = await api.getStudent(id);
      setS(data);
    } catch (e) {
      setFailed(true);
      toastError(e);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const back = <Link to="/students" className="text-sm underline">Back to students</Link>;
  if (failed) return <PageHeader title="Student" subtitle="This student could not be opened. It may not exist or may not be assigned to you." action={back} />;
  if (!s) return <Spinner />;

  const erased = s.status === 'erased';

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { phone, ...body } = formToBody(form);
      await api.updateStudent(id, { ...body, ...(phone && phone !== s.phone ? { phone } : {}) });
      toast.success('Saved.');
      setForm(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const exportData = async () => {
    try {
      const { data } = await api.exportStudent(id);
      download(`student-${id}-export.json`, data);
      toast.success('Export downloaded. Share it only with the student or parent.');
    } catch (err) {
      toastError(err);
    }
  };

  const doErase = async () => {
    setBusy(true);
    try {
      await api.eraseStudent(id, { confirm: erase.confirm, reason: erase.reason });
      toast.success('Student erased.');
      setErase(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const facts = [
    ['Phone', s.phone], ['Email', s.email], ['Date of birth', s.dob && new Date(s.dob).toLocaleDateString()], ['Gender', s.gender],
    ['Address', [s.address?.line, s.address?.city, s.address?.state, s.address?.pincode].filter(Boolean).join(', ')],
    ['Guardian', [s.guardian?.name, s.guardian?.relation && `(${s.guardian.relation})`, s.guardian?.phone].filter(Boolean).join(' ')],
    ['Preferred courses', (s.preferences?.courses || []).join(', ')], ['Preferred cities', (s.preferences?.cities || []).join(', ')],
    ['Yearly budget', s.preferences?.budgetMaxPaise ? formatINR(s.preferences.budgetMaxPaise) : ''],
    ['Consent', s.consent?.given ? `Yes (${s.consent.source || 'recorded'}) ${formatDate(s.consent.at)}` : 'No'],
    ['Guardian consent', s.consent?.guardianConsent?.given ? `Yes${s.consent.guardianConsent.by ? `, by ${s.consent.guardianConsent.by}` : ''} ${formatDate(s.consent.guardianConsent.at)}` : 'Not recorded'],
    ['Added', formatDate(s.createdAt)],
  ];

  return (
    <>
      <PageHeader
        title={s.name}
        subtitle={erased ? `Erased on ${formatDate(s.erasedAt)}. Personal data has been removed and this cannot be undone.` : 'Student profile'}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={erased ? 'red' : 'green'}>{s.status}</Badge>
            {!erased && can('students:write') && !form && <Button variant="secondary" onClick={() => setForm(studentToForm(s))}>Edit</Button>}
            {!erased && can('students:export') && <Button variant="secondary" onClick={exportData}>Export data</Button>}
            {!erased && can('students:erase') && <Button variant="danger" onClick={() => setErase({ confirm: '', reason: '' })}>Erase</Button>}
            {back}
          </div>
        }
      />

      {form ? (
        <Card title="Edit student">
          <StudentForm value={form} onChange={setForm} onSubmit={save} onCancel={() => setForm(null)} submitLabel="Save changes" busy={busy} />
        </Card>
      ) : (
        !erased && (
          <>
            <Card title="Details" className="mb-5">
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {facts.map(([k, v]) => (
                  <div key={k}><dt className="text-caption">{k}</dt><dd className="text-sm">{v || ','}</dd></div>
                ))}
              </dl>
            </Card>
            {hasModule('documents') && can('documents:read') && <div className="mb-5"><StudentDocuments studentId={id} /></div>}
            <Card title="Academics and test scores">
              {(s.academics || []).length + (s.testScores || []).length === 0 ? (
                <p className="text-sm text-fg-muted">Nothing recorded yet.</p>
              ) : (
                <ul className="space-y-1 text-sm">
                  {(s.academics || []).map((a, i) => <li key={`a${i}`}>{[a.level, a.board, a.institute, a.year].filter(Boolean).join(' · ')}{a.percentage !== undefined ? `: ${a.percentage}%` : ''}</li>)}
                  {(s.testScores || []).map((t, i) => <li key={`t${i}`}>{t.test}: {t.score} {t.year ? `(${t.year})` : ''}</li>)}
                </ul>
              )}
            </Card>
          </>
        )
      )}

      {erase && (
        <Modal title="Erase this student?" onClose={() => setErase(null)}>
          <p className="mb-3 text-sm">This removes the phone, email, address, guardian, marks and preferences, and switches off any portal login. It <strong>cannot be undone</strong>. Export the data first if the student asked for a copy.</p>
          <div className="space-y-3">
            <Field label="Reason"><Input value={erase.reason} onChange={(e) => setErase({ ...erase, reason: e.target.value })} placeholder="For example: parent request on 12 Nov" /></Field>
            <Field label="Type ERASE to confirm"><Input value={erase.confirm} onChange={(e) => setErase({ ...erase, confirm: e.target.value })} autoComplete="off" /></Field>
            <div className="flex gap-2">
              <Button variant="danger" loading={busy} disabled={erase.confirm !== 'ERASE' || erase.reason.trim().length < 3} onClick={doErase}>Erase permanently</Button>
              <Button variant="secondary" onClick={() => setErase(null)}>Cancel</Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
