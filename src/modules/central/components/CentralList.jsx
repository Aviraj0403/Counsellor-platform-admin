import { ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Badge, Button, Card, Empty, Input, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, humanize } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import OrgAvatar from '../../../shared/ui/OrgAvatar.jsx';
import * as centralApi from '../api';
import OrgSelect from './OrgSelect';

const LIMIT = 25;
const LEAD_STAGES = ['new', 'contacted', 'qualified', 'counselling_done', 'application_started', 'admitted', 'lost'];
const APP_STATUSES = ['draft', 'documents_pending', 'ready_to_submit', 'submitted', 'under_review', 'offered', 'rejected', 'accepted', 'declined', 'fee_paid', 'admitted', 'withdrawn'];
const DOC_STATUSES = ['pending_review', 'verified', 'rejected'];

const STATUS_OPTIONS = { leads: LEAD_STAGES, students: ['active'], applications: APP_STATUSES, documents: DOC_STATUSES };
const TONE = { new: 'blue', contacted: 'blue', qualified: 'amber', counselling_done: 'amber', application_started: 'amber', admitted: 'green', lost: 'red', verified: 'green', rejected: 'red', pending_review: 'amber', active: 'green', fee_paid: 'green', accepted: 'green', declined: 'red', withdrawn: 'red' };

/** Where "Open in organisation" lands for each kind of row. */
const TARGET = {
  leads: (r) => `/leads/${r.id}`,
  students: (r) => `/students/${r.id}`,
  applications: (r) => `/applications/${r.id}`,
  documents: () => '/documents/queue',
};

const OrgCell = ({ org }) => (
  <td className="px-3 py-2.5">
    <div className="flex items-center gap-2">
      <OrgAvatar name={org.name} logoUrl={org.logoUrl} size="xs" />
      <span className="truncate">{org.name}</span>
      {org.status !== 'active' && <Badge tone="red">suspended</Badge>}
    </div>
  </td>
);

const Counsellor = ({ c }) => <td className="px-3 py-2.5 text-fg-muted">{c ? c.name || 'Staff member' : 'Unassigned'}</td>;
const StatusBadge = ({ s }) => <Badge tone={TONE[s]}>{humanize(s)}</Badge>;

const COLUMNS = {
  leads: {
    head: ['Organisation', 'Student', 'Phone', 'City / course', 'Stage', 'Counsellor', 'Added'],
    cells: (r) => (
      <>
        <td className="px-3 py-2.5 font-medium">{r.name}<div className="text-caption !text-[11px]">{r.email}</div></td>
        <td className="px-3 py-2.5 text-fg-secondary">{r.phone}</td>
        <td className="px-3 py-2.5 text-fg-muted">{[r.city, r.interestedCourse].filter(Boolean).join(' · ') || ','}</td>
        <td className="px-3 py-2.5"><StatusBadge s={r.status} /></td>
        <Counsellor c={r.counsellor} />
        <td className="px-3 py-2.5 text-fg-muted">{formatDate(r.createdAt)}</td>
      </>
    ),
  },
  students: {
    head: ['Organisation', 'Student', 'Phone', 'City', 'Status', 'Counsellor', 'Added'],
    cells: (r) => (
      <>
        <td className="px-3 py-2.5 font-medium">{r.name}<div className="text-caption !text-[11px]">{r.email}</div></td>
        <td className="px-3 py-2.5 text-fg-secondary">{r.phone}</td>
        <td className="px-3 py-2.5 text-fg-muted">{r.city || ','}</td>
        <td className="px-3 py-2.5"><StatusBadge s={r.status} /></td>
        <Counsellor c={r.counsellor} />
        <td className="px-3 py-2.5 text-fg-muted">{formatDate(r.createdAt)}</td>
      </>
    ),
  },
  applications: {
    head: ['Organisation', 'Student', 'College / course', 'Intake', 'Status', 'Counsellor', 'Added'],
    cells: (r) => (
      <>
        <td className="px-3 py-2.5 font-medium">{r.studentName || ','}</td>
        <td className="px-3 py-2.5 text-fg-muted">{[r.collegeName, r.courseName].filter(Boolean).join(' · ') || ','}</td>
        <td className="px-3 py-2.5 text-fg-muted">{r.intake ? `${r.intake.month}/${r.intake.year}` : ','}</td>
        <td className="px-3 py-2.5"><StatusBadge s={r.status} /></td>
        <Counsellor c={r.counsellor} />
        <td className="px-3 py-2.5 text-fg-muted">{formatDate(r.createdAt)}</td>
      </>
    ),
  },
  documents: {
    head: ['Organisation', 'Student', 'Document type', 'Status', 'Uploaded'],
    cells: (r) => (
      <>
        <td className="px-3 py-2.5 font-medium">{r.studentName || ','}</td>
        <td className="px-3 py-2.5 text-fg-secondary capitalize">{humanize(r.type)}</td>
        <td className="px-3 py-2.5"><StatusBadge s={r.status} /></td>
        <td className="px-3 py-2.5 text-fg-muted">{formatDate(r.uploadedAt)}</td>
      </>
    ),
  },
};

const EMPTY = { leads: 'No leads match these filters.', students: 'No students match these filters.', applications: 'No applications match these filters.', documents: 'No documents match these filters.' };

/** One tab: filter bar, paged table, and the "Open in organisation" action. */
export default function CentralList({ resource, organisations, tenantId, onTenant, onOpen, openingId }) {
  const { t } = useI18n();
  const [filters, setFilters] = useState({ status: '', q: '', createdFrom: '', createdTo: '', counsellor: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const col = COLUMNS[resource];
  const hasCounsellor = resource !== 'documents';

  const load = useCallback(async () => {
    setData(null);
    try {
      const params = { page, limit: LIMIT, ...(tenantId && { tenantId }) };
      for (const [k, v] of Object.entries(filters)) if (v && (hasCounsellor || k !== 'counsellor')) params[k] = v;
      const { data: d } = await centralApi.list(resource, params);
      setData(d);
    } catch (e) {
      toastError(e);
      setData({ items: [], total: 0, page, limit: LIMIT, organisations: {} });
    }
  }, [resource, page, tenantId, filters, hasCounsellor]);

  useEffect(() => {
    load();
  }, [load]);

  const set = (patch) => {
    setPage(1);
    setFilters((f) => ({ ...f, ...patch }));
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div className="w-60">
          <OrgSelect organisations={organisations} value={tenantId} onChange={(id) => { setPage(1); onTenant(id); }} />
        </div>
        <div className="w-48">
          <Select value={filters.status} onChange={(e) => set({ status: e.target.value })} aria-label={t('central.filterStatus', 'Filter by status')}>
            <option value="">{t('central.allStatuses', 'All statuses')}</option>
            {STATUS_OPTIONS[resource].map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </Select>
        </div>
        <div className="w-56">
          <Input placeholder={resource === 'documents' ? t('central.searchStudent', 'Search student name or phone') : t('central.search', 'Search name or phone')} value={filters.q} onChange={(e) => set({ q: e.target.value })} aria-label={t('central.search', 'Search name or phone')} />
        </div>
        {hasCounsellor && (
          <div className="w-44">
            <Input placeholder={t('central.counsellor', 'Counsellor name')} value={filters.counsellor} onChange={(e) => set({ counsellor: e.target.value })} aria-label={t('central.counsellor', 'Counsellor name')} />
          </div>
        )}
        <label className="text-caption flex items-center gap-2">
          {t('central.from', 'From')}
          <Input type="date" value={filters.createdFrom} onChange={(e) => set({ createdFrom: e.target.value })} className="w-40" />
        </label>
        <label className="text-caption flex items-center gap-2">
          {t('central.to', 'To')}
          <Input type="date" value={filters.createdTo} onChange={(e) => set({ createdTo: e.target.value })} className="w-40" />
        </label>
      </div>

      {data?.truncated && <p className="text-caption mb-3">{t('central.truncated', 'Only the first 100 organisations are shown. Pick one organisation to see the rest.')}</p>}
      {data?.partial && <p className="text-caption mb-3">{t('central.partial', 'Some organisations could not be read just now, so these numbers may be incomplete.')}</p>}

      {!data ? (
        <Spinner />
      ) : data.items.length === 0 ? (
        <Empty>{t(`central.empty.${resource}`, EMPTY[resource])}</Empty>
      ) : (
        <>
          <Table head={[...col.head, '']}>
            {data.items.map((r) => (
              <tr key={`${r.organisation.id}-${r.id}`}>
                <OrgCell org={r.organisation} />
                {col.cells(r)}
                <td className="px-3 py-2.5 text-right">
                  <Button variant="secondary" size="sm" icon={ExternalLink} loading={openingId === `${r.organisation.id}-${r.id}`} onClick={() => onOpen(r.organisation, TARGET[resource](r), `${r.organisation.id}-${r.id}`)}>
                    {t('central.open', 'Open in organisation')}
                  </Button>
                </td>
              </tr>
            ))}
          </Table>
          <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
        </>
      )}
    </Card>
  );
}
