import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Empty, Input, PageHeader, Pager, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as api from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';

const LIMIT = 25;

export default function Students() {
  const { can } = useAuth();
  const [search, setSearch] = useState('');
  const [includeErased, setIncludeErased] = useState(false);
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  const load = useCallback(async () => {
    try {
      const { data: d } = await api.listStudents({ page, limit: LIMIT, ...(search && { search }), ...(includeErased && { includeErased: 1 }) });
      setData(d);
    } catch (e) {
      toastError(e);
    }
  }, [page, search, includeErased]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <PageHeader
        title="Students"
        subtitle="Full student profiles: marks, preferences, family details and consent. Under-18 students need a parent or guardian's consent."
        action={can('students:write') && <Link to="/students/new"><Button>+ Add student</Button></Link>}
      />
      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="w-64">
            <Input placeholder="Search name or phone" value={search} onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="accent-indigo-600" checked={includeErased} onChange={(e) => { setPage(1); setIncludeErased(e.target.checked); }} />
            Show erased students
          </label>
        </div>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No students found.</Empty>
        ) : (
          <>
            <Table head={['Student', 'Phone', 'City', 'Status', 'Added']}>
              {data.items.map((s) => (
                <tr key={s._id}>
                  <td className="px-3 py-2.5 font-medium"><Link className="underline" to={`/students/${s._id}`}>{s.name}</Link></td>
                  <td className="px-3 py-2.5 text-fg-secondary">{s.phone || ','}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{s.address?.city || ','}</td>
                  <td className="px-3 py-2.5"><Badge tone={s.status === 'erased' ? 'red' : 'green'}>{s.status}</Badge></td>
                  <td className="px-3 py-2.5 text-fg-muted">{formatDate(s.createdAt)}</td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
