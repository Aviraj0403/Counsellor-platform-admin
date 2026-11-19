import { useCallback, useEffect, useState } from 'react';
import { Button, Card, Empty, Spinner, Table } from '../../../shared/ui/ui';
import { platformAudit } from '../../audit';
import { formatDate, humanize } from '../../../shared/lib/format';

export default function ActivityTab({ tenantId, refreshKey }) {
  const [items, setItems] = useState(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    setFailed(false);
    try {
      const { data } = await platformAudit({ tenantId, limit: 30 });
      setItems(data.items);
    } catch {
      setFailed(true);
    }
  }, [tenantId]);
  useEffect(() => {
    setItems(null);
    load();
  }, [load, refreshKey]);

  if (failed) {
    return (
      <Card title="Activity">
        <Empty>The activity list could not be loaded.</Empty>
        <div className="mt-3"><Button variant="secondary" onClick={load}>Try again</Button></div>
      </Card>
    );
  }
  if (!items) return <Spinner />;
  return (
    <Card title="Recent platform changes">
      {items.length === 0 ? (
        <Empty>Nothing has been changed for this organisation yet.</Empty>
      ) : (
        <Table head={['When', 'What', 'Ref']}>
          {items.map((a) => (
            <tr key={a._id}>
              <td className="px-3 py-2 text-fg-muted">{formatDate(a.at)}</td>
              <td className="px-3 py-2 capitalize">{humanize(a.action)}</td>
              <td className="px-3 py-2 font-mono text-xs text-fg-muted">{a.requestId?.slice(0, 8)}</td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}
