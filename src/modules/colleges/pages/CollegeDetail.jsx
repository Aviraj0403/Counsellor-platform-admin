import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as api from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatINR, rupeesToPaise } from '../../../shared/lib/format';

const LEVELS = ['diploma', 'ug', 'pg', 'phd', 'certificate'];
const BLANK = { name: '', level: 'ug', stream: '', durationMonths: '', feeRupees: '', minPercentage: '', intakeMonth: '', intakeYear: '', deadline: '' };

export default function CollegeDetail() {
  const { id } = useParams();
  const { can } = useAuth();
  const [c, setC] = useState(null);
  const [failed, setFailed] = useState(false);
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const write = can('colleges:write');

  const load = useCallback(async () => {
    try {
      const { data } = await api.getCollege(id);
      setC(data);
    } catch (e) {
      setFailed(true);
      toastError(e);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const back = <Link to="/colleges" className="text-sm underline">Back to colleges</Link>;
  if (failed) return <PageHeader title="College" subtitle="This college could not be opened." action={back} />;
  if (!c) return <Spinner />;

  const addCourse = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const fee = rupeesToPaise(form.feeRupees);
      if (Number.isNaN(fee)) throw new Error('Yearly fee must be a plain amount in rupees, for example 150000.');
      const body = { name: form.name.trim(), level: form.level, annualFeePaise: fee };
      if (form.stream) body.stream = form.stream;
      if (form.durationMonths) body.durationMonths = Number(form.durationMonths);
      if (form.minPercentage) body.eligibility = { minPercentage: Number(form.minPercentage) };
      if (form.intakeMonth && form.intakeYear) {
        body.intakes = [{ month: Number(form.intakeMonth), year: Number(form.intakeYear), ...(form.deadline && { deadline: form.deadline }) }];
      }
      await api.createCourse(id, body);
      toast.success('Course added.');
      setForm(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const toggleCourse = async (course) => {
    try {
      if (course.active) await api.deactivateCourse(id, course._id);
      else await api.updateCourse(id, course._id, { active: true });
      load();
    } catch (err) {
      toastError(err);
    }
  };

  const toggleCollege = async () => {
    try {
      if (c.active) await api.deactivateCollege(id);
      else await api.updateCollege(id, { active: true });
      load();
    } catch (err) {
      toastError(err);
    }
  };

  const facts = [
    ['Type', c.type], ['City', c.city], ['State', c.state], ['Website', c.website], ['Affiliation', c.affiliation],
    ['Contact', [c.contact?.name, c.contact?.email, c.contact?.phone].filter(Boolean).join(' · ')],
    ['Address (web)', c.slug],
  ];

  return (
    <>
      <PageHeader
        title={c.name}
        subtitle={c.description || 'College details and courses'}
        action={
          <div className="flex items-center gap-2">
            <Badge tone={c.active ? 'green' : 'gray'}>{c.active ? 'active' : 'inactive'}</Badge>
            {write && <Button variant="secondary" onClick={toggleCollege}>{c.active ? 'Deactivate' : 'Reactivate'}</Button>}
            {back}
          </div>
        }
      />
      <Card title="Details" className="mb-5">
        <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {facts.map(([k, v]) => <div key={k}><dt className="text-caption">{k}</dt><dd className="text-sm">{v || ','}</dd></div>)}
        </dl>
        {(c.requiredDocuments || []).length > 0 && (
          <p className="mt-3 text-sm text-fg-muted">Required documents: {c.requiredDocuments.map((d) => `${d.label}${d.mandatory ? '' : ' (optional)'}`).join(', ')}</p>
        )}
      </Card>

      <Card title="Courses" action={write && !form && <Button size="sm" onClick={() => setForm(BLANK)}>+ Add course</Button>}>
        {form && (
          <form onSubmit={addCourse} className="mb-5 grid gap-4 md:grid-cols-3">
            <Field label="Course name"><Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Level"><Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</Select></Field>
            <Field label="Stream"><Input value={form.stream} onChange={(e) => setForm({ ...form, stream: e.target.value })} /></Field>
            <Field label="Yearly fee (rupees)"><Input required inputMode="decimal" value={form.feeRupees} onChange={(e) => setForm({ ...form, feeRupees: e.target.value })} /></Field>
            <Field label="Duration (months)"><Input type="number" min="1" max="120" value={form.durationMonths} onChange={(e) => setForm({ ...form, durationMonths: e.target.value })} /></Field>
            <Field label="Minimum marks (%)"><Input type="number" min="0" max="100" value={form.minPercentage} onChange={(e) => setForm({ ...form, minPercentage: e.target.value })} /></Field>
            <Field label="Intake month (1-12)"><Input type="number" min="1" max="12" value={form.intakeMonth} onChange={(e) => setForm({ ...form, intakeMonth: e.target.value })} /></Field>
            <Field label="Intake year"><Input type="number" min="2000" max="2100" value={form.intakeYear} onChange={(e) => setForm({ ...form, intakeYear: e.target.value })} /></Field>
            <Field label="Apply by"><Input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} /></Field>
            <div className="flex gap-2 md:col-span-3">
              <Button type="submit" loading={busy}>Add course</Button>
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        )}
        {c.courses.length === 0 ? (
          <Empty>No courses yet.</Empty>
        ) : (
          <Table head={['Course', 'Level', 'Yearly fee', 'Min marks', 'Intakes', 'Status', '']}>
            {c.courses.map((k) => (
              <tr key={k._id}>
                <td className="px-3 py-2.5 font-medium">{k.name}{k.stream ? <span className="text-fg-muted"> · {k.stream}</span> : null}</td>
                <td className="px-3 py-2.5 uppercase text-fg-muted">{k.level}</td>
                <td className="px-3 py-2.5">{formatINR(k.annualFeePaise)}</td>
                <td className="px-3 py-2.5 text-fg-muted">{k.eligibility?.minPercentage ?? ','}</td>
                <td className="px-3 py-2.5 text-fg-muted">{(k.intakes || []).map((i) => `${i.month}/${i.year}`).join(', ') || ','}</td>
                <td className="px-3 py-2.5"><Badge tone={k.active ? 'green' : 'gray'}>{k.active ? 'active' : 'inactive'}</Badge></td>
                <td className="px-3 py-2.5">{write && <Button size="sm" variant="secondary" onClick={() => toggleCourse(k)}>{k.active ? 'Deactivate' : 'Reactivate'}</Button>}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
