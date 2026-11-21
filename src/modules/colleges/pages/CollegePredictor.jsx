import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Calculator, CheckCircle2, AlertCircle, HelpCircle, Building2 } from 'lucide-react';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Table } from '../../../shared/ui/ui';
import * as api from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatINR, rupeesToPaise } from '../../../shared/lib/format';

const EXAMS = [
  { id: 'jee_main', label: 'JEE Main (All India / State)' },
  { id: 'mht_cet', label: 'MHT-CET (Maharashtra)' },
  { id: 'wbjee', label: 'WBJEE (West Bengal)' },
  { id: 'kcet', label: 'KCET / COMEDK (Karnataka)' },
  { id: 'direct_12th', label: '12th Board Marks (Direct Merit / Management)' },
];

const CATEGORIES = [
  { id: 'general', label: 'General / Open' },
  { id: 'obc', label: 'OBC-NCL' },
  { id: 'ews', label: 'General-EWS' },
  { id: 'sc', label: 'SC (Scheduled Caste)' },
  { id: 'st', label: 'ST (Scheduled Tribe)' },
  { id: 'management', label: 'Management / Institutional Quota' },
];

const CHANCE_TONE = {
  high: 'green',
  medium: 'amber',
  low: 'red',
};

export default function CollegePredictor() {
  const [f, setF] = useState({
    exam: 'jee_main',
    rank: '',
    percentile: '',
    percentage: '',
    category: 'general',
    branches: '',
    cities: '',
    budget: '',
  });

  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const run = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = {
        exam: f.exam,
        category: f.category,
      };

      if (f.rank) body.rank = Number(f.rank);
      if (f.percentile) body.percentile = Number(f.percentile);
      if (f.percentage) body.percentage = Number(f.percentage);

      if (f.budget) {
        const p = rupeesToPaise(f.budget);
        if (!Number.isNaN(p)) body.budgetMaxPaise = p;
      }

      const branches = f.branches.split(',').map((b) => b.trim()).filter(Boolean);
      if (branches.length) body.preferredBranches = branches;

      const cities = f.cities.split(',').map((c) => c.trim()).filter(Boolean);
      if (cities.length) body.preferredCities = cities;

      const { data } = await api.predictColleges(body);
      setRes(data);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="B.Tech College & Cutoff Predictor"
        subtitle="Predict engineering college admission probability based on JEE Main ranks, State CET percentiles, and category reservations."
      />

      <Card className="mb-6">
        <form onSubmit={run} className="grid gap-4 md:grid-cols-3">
          <Field label="Entrance Exam / Basis">
            <Select value={f.exam} onChange={set('exam')}>
              {EXAMS.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </Select>
          </Field>

          {f.exam === 'direct_12th' ? (
            <Field label="12th PCM Percentage (%)">
              <Input
                required
                type="number"
                min="35"
                max="100"
                step="0.01"
                placeholder="e.g. 78.5"
                value={f.percentage}
                onChange={set('percentage')}
              />
            </Field>
          ) : (
            <>
              <Field label="All India / State Rank">
                <Input
                  type="number"
                  min="1"
                  max="1500000"
                  placeholder="e.g. 45000"
                  value={f.rank}
                  onChange={set('rank')}
                />
              </Field>
              <Field label="Score / Percentile (optional)">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.001"
                  placeholder="e.g. 89.4"
                  value={f.percentile}
                  onChange={set('percentile')}
                />
              </Field>
            </>
          )}

          <Field label="Admission Category / Reservation">
            <Select value={f.category} onChange={set('category')}>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Field label="Preferred Engineering Branches" hint="Comma separated (e.g. CSE, IT, AI)">
            <Input
              placeholder="Computer Science, Information Tech"
              value={f.branches}
              onChange={set('branches')}
            />
          </Field>

          <Field label="Preferred Cities / Locations" hint="Comma separated">
            <Input placeholder="Pune, Bangalore, Mumbai" value={f.cities} onChange={set('cities')} />
          </Field>

          <Field label="Maximum Annual Budget (₹)" hint="Optional">
            <Input
              inputMode="decimal"
              placeholder="e.g. 200000"
              value={f.budget}
              onChange={set('budget')}
            />
          </Field>

          <div className="md:col-span-3 flex justify-end">
            <Button type="submit" loading={busy} className="px-6">
              Calculate Admission Chances
            </Button>
          </div>
        </form>
      </Card>

      {res && (
        <Card title={`${res.total} Predicted College Options`}>
          {res.predictions.length === 0 ? (
            <Empty>No colleges matched the exact criteria. Try broadening preferred branches or increasing budget.</Empty>
          ) : (
            <Table head={['College', 'Course & Stream', 'City', 'Annual Fee', 'Admission Probability', 'Analysis & Why']}>
              {res.predictions.map((p, idx) => (
                <tr key={`${p.courseId}_${idx}`}>
                  <td className="px-3 py-3 font-semibold text-fg">
                    <Link className="hover:underline text-brand-600 dark:text-brand-400" to={`/colleges/${p.collegeId}`}>
                      {p.collegeName}
                    </Link>
                  </td>
                  <td className="px-3 py-3">
                    <span className="font-medium text-fg">{p.courseName}</span>
                    {p.stream && <span className="block text-xs text-fg-muted">{p.stream}</span>}
                  </td>
                  <td className="px-3 py-3 text-fg-muted">{p.city || '-'}</td>
                  <td className="px-3 py-3 font-medium text-fg">{formatINR(p.annualFeePaise)}</td>
                  <td className="px-3 py-3">
                    <Badge tone={CHANCE_TONE[p.chance]}>
                      {p.chance === 'high' ? 'High Chance' : p.chance === 'medium' ? 'Moderate Chance' : 'Ambitious / Spot'}
                    </Badge>
                  </td>
                  <td className="px-3 py-3 text-xs text-fg-muted max-w-xs">{p.reason}</td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}
    </>
  );
}

