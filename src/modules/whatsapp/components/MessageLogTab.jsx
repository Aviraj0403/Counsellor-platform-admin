import { Inbox } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import { Badge, Field, Input, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import * as api from '../api';
import { STATUS_TONE } from '../lib';

const LIMIT = 25;

/** Message log. The API pages by 25 and filters only by lead / student, so the status, direction and text filters apply to the page on screen. */
export default function MessageLogTab({ onLatest, refreshKey }) {
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('');
  const [direction, setDirection] = useState('');
  const [search, setSearch] = useState('');

  const load = useCallback(
    () => api.listMessages({ page, limit: LIMIT }).then((r) => { setData(r.data); if (page === 1) onLatest?.(r.data.items[0] || null); }).catch((e) => { toastError(e); setData({ items: [], total: 0, page: 1, limit: LIMIT }); }),
    [page, onLatest],
  );
  useEffect(() => { load(); }, [load, refreshKey]);

  if (!data) return <Spinner />;
  const q = search.trim().toLowerCase();
  const rows = data.items.filter((m) => (!status || m.status === status) && (!direction || m.direction === direction) && (!q || `${m.to} ${m.text || ''} ${m.template || ''}`.toLowerCase().includes(q)));

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="min-w-[180px] flex-1"><Field label="Search this page"><Input type="search" placeholder="Number, template or text" value={search} onChange={(e) => setSearch(e.target.value)} /></Field></div>
        <div className="w-40"><Field label="Status"><Select value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All</option>{Object.keys(STATUS_TONE).map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field></div>
        <div className="w-40"><Field label="Direction"><Select value={direction} onChange={(e) => setDirection(e.target.value)}><option value="">All</option><option value="out">Sent</option><option value="in">Received</option></Select></Field></div>
      </div>
      {data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-8 text-center">
          <span className="tone-sky tone-chip mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl"><Inbox size={20} aria-hidden="true" /></span>
          <p className="text-sm font-medium text-fg">No WhatsApp messages yet</p>
          <p className="text-caption mx-auto mt-1 max-w-md">Use the Send message tab, or open a lead and press Send WhatsApp. Every message and its delivery status will be listed here.</p>
        </div>
      ) : rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-sm text-fg-muted">No message on this page matches the filters.</p>
      ) : (
        <>
          <Table head={['When', 'Number', 'Message', 'Status']}>
            {rows.map((m) => (
              <tr key={m._id}>
                <td className="whitespace-nowrap px-3 py-2.5 text-fg-muted">{formatDate(m.at)}</td>
                <td className="px-3 py-2.5">{m.direction === 'in' ? <span><Badge tone="blue">Received</Badge> <span className="ml-1">{m.to}</span></span> : m.to}</td>
                <td className="px-3 py-2.5">
                  {m.template && <p className="font-mono text-[11px] text-fg-muted">{m.template}</p>}
                  <p className="max-w-md break-words">{m.text}</p>
                  {m.error && <p className="mt-0.5 text-xs text-rose-700 dark:text-rose-300">{m.error}</p>}
                </td>
                <td className="px-3 py-2.5"><Badge tone={STATUS_TONE[m.status] || 'gray'}>{m.status}</Badge></td>
              </tr>
            ))}
          </Table>
          <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
        </>
      )}
    </>
  );
}
