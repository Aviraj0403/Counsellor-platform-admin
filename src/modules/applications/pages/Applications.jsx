import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as api from '../api';
import { MONTHS, STATUSES, TONE, intakeLabel, statusLabel } from '../status';
import { toastError } from '../../../shared/lib/AxiosToastError';

const LIMIT = 25;
const BLANK = { studentId: '', studentName: '', collegeId: '', courseId: '', month: '8', year: String(new Date().getFullYear() + 1), assignedTo: '' };

function NewApplication({ colleges, team, onClose, onCreated }) {
  const [f, setF] = useState(BLANK);
  const [q, setQ] = useState('');
  const [found, setFound] = useState([]);
  const [courses, setCourses] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (q.trim().length < 2) return undefined;
    const t = setTimeout(() => api.searchStudents(q.trim()).then(({ data }) => setFound(data.items)).catch(toastError), 250);
    return () => clearTimeout(t);
  }, [q]);

  const pickCollege = async (collegeId) => {
    setF((p) => ({ ...p, collegeId, courseId: '' }));
    setCourses([]);
    if (!collegeId) return;
    try {
      const { data } = await api.getCollege(collegeId);
      setCourses((data.courses || []).filter((c) => c.active !== false));
    } catch (e) {
      toastError(e);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!f.studentId || !f.collegeId || !f.courseId) return toast.error('Pick a student, a college and a course.');
    setBusy(true);
    try {
      const { data } = await api.createApplication({
        studentId: f.studentId,
        collegeId: f.collegeId,
        courseId: f.courseId,
        intake: { month: Number(f.month), year: Number(f.year) },
        ...(f.assignedTo && { assignedTo: f.assignedTo }),
      });
      toast.success('Application created.');
      onCreated(data._id);
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="New application" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Student" hint={f.studentId ? `Selected: ${f.studentName}` : 'Type at least 2 letters of the name or phone'}>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student" />
        </Field>
        {q.trim().length >= 2 && !f.studentId && (
          <ul className="max-h-40 overflow-auto rounded-xl border border-line text-sm">
            {found.length === 0 && <li className="p-2 text-fg-muted">No student found.</li>}
            {found.map((s) => (
              <li key={s._id}>
                <button type="button" className="w-full px-3 py-2 text-left hover:bg-surface-2" onClick={() => setF({ ...f, studentId: s._id, studentName: s.name })}>
                  {s.name} <span className="text-fg-muted">{s.phone}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {f.studentId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setF({ ...f, studentId: '', studentName: '' });
              setQ('');
            }}
          >
            Change student
          </Button>
        )}
        <Field label="College">
          <Select value={f.collegeId} onChange={(e) => pickCollege(e.target.value)}>
            <option value="">Choose a college</option>
            {colleges.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="Course">
          <Select value={f.courseId} onChange={(e) => setF({ ...f, courseId: e.target.value })} disabled={!f.collegeId}>
            <option value="">Choose a course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Intake month">
            <Select value={f.month} onChange={(e) => setF({ ...f, month: e.target.value })}>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </Select>
          </Field>
          <Field label="Intake year">
            <Input type="number" min="2000" max="2100" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
          </Field>
        </div>
        {team.length > 0 && (
          <Field label="Assigned counsellor" hint="Defaults to the student's counsellor">
            <Select value={f.assignedTo} onChange={(e) => setF({ ...f, assignedTo: e.target.value })}>
              <option value="">Default</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Applications() {
  const { can } = useAuth();
  const nav = useNavigate();
  const [status, setStatus] = useState('');
  const [collegeId, setCollegeId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [team, setTeam] = useState([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (can('colleges:read')) api.listColleges().then(({ data: d }) => setColleges(d.items)).catch(() => {});
    // Only team managers may list the team: for everyone else the counsellor filter simply stays hidden.
    api.listTeam().then(({ data: d }) => setTeam(d.team || [])).catch(() => {});
  }, [can]);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.listApplications({ page, limit: LIMIT, ...(status && { status }), ...(collegeId && { collegeId }), ...(assignedTo && { assignedTo }) });
      setData(d);
    } catch (e) {
      toastError(e);
    }
  }, [page, status, collegeId, assignedTo]);

  useEffect(() => {
    load();
  }, [load]);

  const reset = (setter) => (e) => {
    setPage(1);
    setter(e.target.value);
  };

  return (
    <>
      <PageHeader
        title="Applications"
        subtitle="Every student application to a college course, from draft to admission."
        action={can('applications:write') && <Button onClick={() => setCreating(true)}>+ New application</Button>}
      />
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Select className="w-48" value={status} onChange={reset(setStatus)}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{statusLabel(s)}</option>
            ))}
          </Select>
          {colleges.length > 0 && (
            <Select className="w-56" value={collegeId} onChange={reset(setCollegeId)}>
              <option value="">All colleges</option>
              {colleges.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          )}
          {team.length > 0 && (
            <Select className="w-48" value={assignedTo} onChange={reset(setAssignedTo)}>
              <option value="">All counsellors</option>
              {team.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          )}
        </div>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No applications found.</Empty>
        ) : (
          <>
            <Table head={['Student', 'College', 'Course', 'Intake', 'Status']}>
              {data.items.map((a) => (
                <tr key={a._id}>
                  <td className="px-3 py-2.5 font-medium"><Link className="underline" to={`/applications/${a._id}`}>{a.studentName || 'Student'}</Link></td>
                  <td className="px-3 py-2.5 text-fg-secondary">{a.collegeName}</td>
                  <td className="px-3 py-2.5 text-fg-secondary">{a.courseName}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{intakeLabel(a.intake)}</td>
                  <td className="px-3 py-2.5"><Badge tone={TONE[a.status]}>{statusLabel(a.status)}</Badge></td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
      {creating && <NewApplication colleges={colleges} team={team} onClose={() => setCreating(false)} onCreated={(id) => nav(`/applications/${id}`)} />}
    </>
  );
}
