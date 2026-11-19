import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Field, Input, PageHeader, Pager, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';
import InviteTable from '../components/InviteTable';
import TempPassword from '../components/TempPassword';

const LIMIT = 25;

export default function StudentInvites() {
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [found, setFound] = useState([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const load = useCallback(async () => {
    try {
      setData((await api.listStudentInvites({ page, limit: LIMIT })).data);
    } catch (e) {
      toastError(e);
    }
  }, [page]);
  useEffect(() => {
    load();
  }, [load]);

  const find = async (text) => {
    setSearch(text);
    if (text.trim().length < 2) return setFound([]);
    try {
      setFound((await api.searchStudents(text.trim())).data.items);
    } catch (e) {
      toastError(e);
    }
  };

  const invite = async (student) => {
    setBusy(true);
    try {
      setResult((await api.inviteStudent(student._id)).data);
      setSearch('');
      setFound([]);
      load();
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  const disable = async (inv) => {
    if (!window.confirm(`Disable the portal login for ${inv.subjectName || inv.name}?`)) return;
    try {
      await api.disableStudentInvite(inv.id);
      load();
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <>
      <PageHeader title="Student portal invites" subtitle="Give a student a login to follow their application and upload documents. The student needs an email address on their record." />
      <Card title="Invite a student">
        <Field label="Search by name or phone" hint="Pick a student below to create their login.">
          <Input value={search} onChange={(e) => find(e.target.value)} placeholder="Type at least 2 letters" />
        </Field>
        {found.length > 0 && (
          <ul className="mt-3 divide-y divide-line rounded-xl border border-line">
            {found.map((s) => (
              <li key={s._id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span><b>{s.name}</b> <span className="text-fg-muted">{s.email || 'no email on record'}</span></span>
                <Button size="sm" disabled={busy || !s.email} onClick={() => invite(s)}>Invite</Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <div className="mt-5">
        <Card title="Invites">
          {!data ? <Spinner /> : (
            <>
              <InviteTable items={data.items} subjectLabel="Student" onDisable={disable} />
              <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
            </>
          )}
        </Card>
      </div>
      {result && <TempPassword result={result} onClose={() => setResult(null)} />}
    </>
  );
}
