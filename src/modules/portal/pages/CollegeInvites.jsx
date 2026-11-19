import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Field, Input, PageHeader, Pager, Select, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';
import InviteTable from '../components/InviteTable';
import TempPassword from '../components/TempPassword';

const LIMIT = 25;

export default function CollegeInvites() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [colleges, setColleges] = useState([]);
  const [form, setForm] = useState({ collegeId: '', name: '', email: '' });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      setData((await api.listCollegeInvites({ page, limit: LIMIT })).data);
    } catch (e) {
      toastError(e);
    }
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    api.listColleges().then((r) => setColleges(r.data.items ?? [])).catch(toastError);
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      setResult((await api.inviteCollege(form)).data);
      setForm({ collegeId: '', name: '', email: '' });
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const disable = async (inv) => {
    if (!window.confirm(`Disable the login for ${inv.name}?`)) return;
    try {
      await api.disableCollegeInvite(inv.id);
      load();
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <>
      <PageHeader title="College portal invites" subtitle="Give a college employee a login. They see only applications sent to their college, with the student's name and marks, never contact details." />
      <Card title="Invite a college user">
        <form onSubmit={submit} className="grid gap-3 md:grid-cols-4">
          <Field label="College">
            <Select required value={form.collegeId} onChange={set('collegeId')}>
              <option value="">Choose...</option>
              {colleges.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
          </Field>
          <Field label="Name"><Input required value={form.name} onChange={set('name')} /></Field>
          <Field label="Email"><Input required type="email" value={form.email} onChange={set('email')} /></Field>
          <div className="flex items-end"><Button type="submit" disabled={busy}>Create login</Button></div>
        </form>
      </Card>
      <div className="mt-5">
        <Card title="Invites">
          {!data ? <Spinner /> : (
            <>
              <InviteTable items={data.items} subjectLabel="College" onDisable={disable} />
              <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
            </>
          )}
        </Card>
      </div>
      {result && <TempPassword result={result} onClose={() => setResult(null)} />}
    </>
  );
}
