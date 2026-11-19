import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, Empty, PageHeader, Pager, Spinner, Table } from '../../../shared/ui/ui';
import * as auditApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, humanize } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const LIMIT = 30;

export default function PlatformAudit() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    auditApi.platformAudit({ page, limit: LIMIT }).then(({ data: d }) => setData(d)).catch(toastError);
  }, [page]);

  return (
    <>
      <PageHeader title={t('page.platformAudit', 'Platform audit')} subtitle="Who created, changed or suspended organisations, modules and staff. The ref matches the API log line for that request." />
      <Card>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No activity recorded yet.</Empty>
        ) : (
          <>
            <Table head={['When', 'What', 'Organisation', 'By (user id)', 'Ref']}>
              {data.items.map((a) => (
                <tr key={a._id}>
                  <td className="px-3 py-2 text-fg-muted">{formatDate(a.at)}</td>
                  <td className="px-3 py-2 capitalize">{humanize(a.action)}</td>
                  <td className="px-3 py-2">
                    {a.tenantId ? (
                      <Link to={`/organisations/${a.tenantId}`} className="text-brand-600 dark:text-brand-300 hover:underline">Open</Link>
                    ) : (
                      <span className="text-fg-muted">,</span>
                    )}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs text-fg-muted">{a.actorId?.slice(-8)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-fg-muted">{a.requestId?.slice(0, 8)}</td>
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
