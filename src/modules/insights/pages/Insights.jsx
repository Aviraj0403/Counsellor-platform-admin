import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, PageHeader, Spinner, Table } from '../../../shared/ui/ui';
import * as insightsApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, humanize } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const STAGES = ['new', 'contacted', 'qualified', 'counselling_done', 'application_started', 'admitted', 'lost'];

/** Research across all organisations. Counts only: no student names, phones or documents are ever shown here. */
export default function Insights() {
  const { t } = useI18n();
  const [funnel, setFunnel] = useState(null);
  const [usage, setUsage] = useState(null);

  useEffect(() => {
    insightsApi.funnel().then(({ data }) => setFunnel(data)).catch(toastError);
    insightsApi.usage().then(({ data }) => setUsage(data.organisations)).catch(toastError);
  }, []);

  return (
    <>
      <PageHeader title={t('page.research', 'Usage and conversion research')} subtitle="Which lead sources actually become admissions, and how much each organisation uses the platform. Counts only, never student-level data." />

      <Card title="Lead source performance (all organisations)" className="mb-5">
        {!funnel ? (
          <Spinner />
        ) : funnel.totals.total === 0 ? (
          <Empty>No leads yet.</Empty>
        ) : (
          <>
            <p className="mb-3 text-sm text-fg-secondary">
              {funnel.totals.total} leads · {funnel.totals.admitted} admitted · {funnel.totals.lost} lost · overall conversion <b>{funnel.totals.conversionPct}%</b>
            </p>
            <Table head={['Source', 'Leads', 'Admitted', 'Lost', 'Conversion', ...STAGES.slice(0, 5).map(humanize)]}>
              {funnel.byChannel.map((c) => (
                <tr key={c.channel}>
                  <td className="px-3 py-2.5 font-medium capitalize">{humanize(c.channel)}</td>
                  <td className="px-3 py-2.5">{c.total}</td>
                  <td className="px-3 py-2.5">{c.admitted}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{c.lost}</td>
                  <td className="px-3 py-2.5 font-medium">{c.conversionPct}%</td>
                  {STAGES.slice(0, 5).map((s) => <td key={s} className="px-3 py-2.5 text-fg-muted">{c.byStage[s] ?? 0}</td>)}
                </tr>
              ))}
            </Table>
          </>
        )}
      </Card>

      <Card title="Conversion by organisation" className="mb-5">
        {!funnel ? (
          <Spinner />
        ) : funnel.byOrganisation.length === 0 ? (
          <Empty>No active organisations.</Empty>
        ) : (
          <Table head={['Organisation', 'Leads', 'Admitted', 'Conversion']}>
            {funnel.byOrganisation.map((o) => (
              <tr key={o.tenantId}>
                <td className="px-3 py-2.5"><Link to={`/organisations/${o.tenantId}`} className="text-brand-600 dark:text-brand-300 hover:underline">{o.name}</Link></td>
                <td className="px-3 py-2.5">{o.total}</td>
                <td className="px-3 py-2.5">{o.admitted}</td>
                <td className="px-3 py-2.5 font-medium">{o.conversionPct}%</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <Card title="Platform usage by organisation">
        {!usage ? (
          <Spinner />
        ) : (
          <Table head={['Organisation', 'Leads', 'Ledger entries', 'Last activity']}>
            {usage.map((o) => (
              <tr key={o.tenantId}>
                <td className="px-3 py-2.5"><Link to={`/organisations/${o.tenantId}`} className="text-brand-600 dark:text-brand-300 hover:underline">{o.name}</Link>{o.status !== 'active' && <span className="ml-2 text-xs text-red-600 dark:text-red-300">suspended</span>}</td>
                <td className="px-3 py-2.5">{o.leads}</td>
                <td className="px-3 py-2.5">{o.ledgerEntries}</td>
                <td className="px-3 py-2.5 text-fg-muted">{formatDate(o.lastActivityAt) || 'No activity yet'}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </>
  );
}
