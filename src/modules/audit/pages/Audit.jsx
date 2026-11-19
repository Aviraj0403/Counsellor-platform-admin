import { useEffect, useState } from 'react';
import { Card, Empty, PageHeader, Pager, Spinner, Table } from '../../../shared/ui/ui';
import * as auditApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, humanize } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const LIMIT = 30;

export default function Audit() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);

  useEffect(() => {
    auditApi.orgAudit({ page, limit: LIMIT }).then(({ data: d }) => setData(d)).catch(toastError);
  }, [page]);

  return (
    <>
      <PageHeader title={t('page.activity', 'Activity log')} subtitle="Who did what in your organisation: leads created, assigned or moved, and every ledger posting." />
      <Card>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No activity yet.</Empty>
        ) : (
          <>
            <Table head={['When', 'What', 'Record', 'By (user id)']}>
              {data.items.map((a) => (
                <tr key={a._id}>
                  <td className="px-3 py-2 text-fg-muted">{formatDate(a.at)}</td>
                  <td className="px-3 py-2 capitalize">{humanize(a.action)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-fg-muted">{a.entityId?.slice(-8)}</td>
                  <td className="px-3 py-2 font-mono text-xs text-fg-muted">{a.actorId?.slice(-8)}</td>
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
