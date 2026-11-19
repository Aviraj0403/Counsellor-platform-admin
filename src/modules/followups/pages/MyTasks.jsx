import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Empty, PageHeader, Pager, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import * as api from '../api';
import CompleteTask from '../components/CompleteTask';

const LIMIT = 25;
const FILTERS = [
  { key: 'open', label: 'All open', params: { status: 'open' } },
  { key: 'today', label: 'Due today', params: { due: 'today' } },
  { key: 'overdue', label: 'Overdue', params: { due: 'overdue' } },
  { key: 'week', label: 'Next 7 days', params: { due: 'week' } },
];

export default function MyTasks() {
  const { can } = useAuth();
  const [filter, setFilter] = useState('open');
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [completing, setCompleting] = useState(null);

  const load = useCallback(async () => {
    try {
      const f = FILTERS.find((x) => x.key === filter);
      const [list, sum] = await Promise.all([api.listTasks({ mine: 1, page, limit: LIMIT, ...f.params }), api.getSummary()]);
      setData(list.data);
      setSummary(sum.data);
    } catch (e) {
      toastError(e);
    }
  }, [filter, page]);

  useEffect(() => {
    load();
  }, [load]);

  const now = Date.now();
  return (
    <>
      <PageHeader title="My tasks" subtitle="Calls and follow-ups assigned to you. New leads assigned to you get a task to contact them within an hour." />
      {summary && (
        <div className="mb-4 flex flex-wrap gap-2 text-sm">
          <Badge tone="blue">{summary.open} open</Badge>
          <Badge tone="amber">{summary.dueToday} due today</Badge>
          <Badge tone={summary.overdue ? 'red' : 'gray'}>{summary.overdue} overdue</Badge>
        </div>
      )}
      <Card>
        <div className="mb-4 flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <Button key={f.key} size="sm" variant={filter === f.key ? 'primary' : 'secondary'} onClick={() => { setPage(1); setFilter(f.key); }}>
              {f.label}
            </Button>
          ))}
        </div>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No tasks here. Nice and clear.</Empty>
        ) : (
          <>
            <Table head={['Task', 'Related to', 'Due', 'Status', '']}>
              {data.items.map((t) => {
                const late = t.status === 'open' && new Date(t.dueAt).getTime() < now;
                return (
                  <tr key={t._id}>
                    <td className="px-3 py-2.5 font-medium">{t.title}{t.notes && <span className="block text-xs font-normal text-fg-muted">{t.notes}</span>}</td>
                    <td className="px-3 py-2.5">
                      {t.entityType === 'lead' ? <Link className="text-accent underline" to={`/leads/${t.entityId}`}>Open lead</Link> : <span className="text-fg-muted capitalize">{t.entityType}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-fg-muted">{formatDate(t.dueAt)}</td>
                    <td className="px-3 py-2.5">{late ? <Badge tone="red">Overdue</Badge> : <Badge tone={t.status === 'done' ? 'green' : 'blue'}>{t.status}</Badge>}</td>
                    <td className="px-3 py-2.5 text-right">
                      {can('followups:write') && t.status === 'open' && <Button size="sm" onClick={() => setCompleting(t)}>Complete</Button>}
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>
      {completing && <CompleteTask task={completing} onClose={() => setCompleting(null)} onDone={() => { setCompleting(null); load(); }} />}
    </>
  );
}
