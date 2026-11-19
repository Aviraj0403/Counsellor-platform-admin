import { Badge, Button, Empty, Table } from '../../../shared/ui/ui';
import { formatDate } from '../../../shared/lib/format';

export default function InviteTable({ items, subjectLabel, onDisable }) {
  if (items.length === 0) return <Empty>No invites yet.</Empty>;
  return (
    <Table head={[subjectLabel, 'Login email', 'Status', 'Invited', '']}>
      {items.map((i) => (
        <tr key={i.id}>
          <td className="px-3 py-2.5 font-medium">{i.subjectName || i.name}</td>
          <td className="px-3 py-2.5 text-fg-secondary">{i.email}</td>
          <td className="px-3 py-2.5"><Badge tone={i.status === 'active' ? 'green' : 'gray'}>{i.status}</Badge></td>
          <td className="px-3 py-2.5 text-fg-muted">{formatDate(i.createdAt)}</td>
          <td className="px-3 py-2.5 text-right">{i.status === 'active' && <Button variant="secondary" size="sm" onClick={() => onDisable(i)}>Disable</Button>}</td>
        </tr>
      ))}
    </Table>
  );
}
