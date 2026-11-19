import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Table } from '../../../shared/ui/ui';
import * as api from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatINR, rupeesToPaise } from '../../../shared/lib/format';

const LEVELS = ['diploma', 'ug', 'pg', 'phd', 'certificate'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Shortlist() {
  const [f, setF] = useState({ percentage: '', level: 'ug', budget: '', cities: '', course: '', intakeYear: '' });
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const run = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { percentage: Number(f.percentage), level: f.level };
      if (f.budget) {
        const p = rupeesToPaise(f.budget);
        if (Number.isNaN(p)) throw new Error('Budget must be a plain amount in rupees, for example 250000.');
        body.budgetMaxPaise = p;
      }
      const cities = f.cities.split(',').map((c) => c.trim()).filter(Boolean);
      if (cities.length) body.cities = cities;
      if (f.course.trim()) body.course = f.course.trim();
      if (f.intakeYear) body.intakeYear = Number(f.intakeYear);
      const { data } = await api.shortlist(body);
      setRes(data);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Shortlist tool" subtitle="Enter a student's marks and wishes. We list courses they are eligible for, within budget, with an intake that is still open." />
      <Card className="mb-5">
        <form onSubmit={run} className="grid gap-4 md:grid-cols-3">
          <Field label="Marks (%)"><Input required type="number" min="0" max="100" step="0.01" value={f.percentage} onChange={set('percentage')} /></Field>
          <Field label="Level">
            <Select value={f.level} onChange={set('level')}>{LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}</Select>
          </Field>
          <Field label="Yearly budget (rupees)" hint="Optional"><Input inputMode="decimal" value={f.budget} onChange={set('budget')} /></Field>
          <Field label="Cities" hint="Comma separated, optional"><Input value={f.cities} onChange={set('cities')} /></Field>
          <Field label="Course or stream" hint="Optional"><Input value={f.course} onChange={set('course')} /></Field>
          <Field label="Intake year" hint="Optional"><Input type="number" min="2000" max="2100" value={f.intakeYear} onChange={set('intakeYear')} /></Field>
          <div className="md:col-span-3"><Button type="submit" loading={busy}>Find courses</Button></div>
        </form>
      </Card>
      {res && (
        <Card title={`${res.total} matching course${res.total === 1 ? '' : 's'}`}>
          {res.items.length === 0 ? (
            <Empty>No course fits. Try a lower level, a higher budget or fewer cities.</Empty>
          ) : (
            <Table head={['College', 'Course', 'City', 'Yearly fee', 'Next intake', 'Why']}>
              {res.items.map((m) => (
                <tr key={m.courseId}>
                  <td className="px-3 py-2.5 font-medium"><Link className="underline" to={`/colleges/${m.collegeId}`}>{m.collegeName}</Link></td>
                  <td className="px-3 py-2.5">{m.courseName} <Badge tone="blue">{m.score}</Badge></td>
                  <td className="px-3 py-2.5 text-fg-muted">{m.city || ','}</td>
                  <td className="px-3 py-2.5">{formatINR(m.annualFeePaise)}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{m.nextIntake ? `${MONTHS[m.nextIntake.month - 1]} ${m.nextIntake.year}` : ','}</td>
                  <td className="px-3 py-2.5 text-caption">{m.reasons.join('. ')}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}
