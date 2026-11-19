import { Card, Empty, Table } from '../../../shared/ui/ui';

export default function TeamTab({ ws }) {
  const { team } = ws;
  return (
    <div className="space-y-5">
      <Card title="Staff accounts">
        <p className="text-sm text-fg-secondary">
          {team.active} active{team.blocked ? `, ${team.blocked} blocked` : ''}
          {team.maxStaff ? ` · plan allows ${team.maxStaff}` : ' · no staff limit on this plan'}.
        </p>
        <p className="text-caption mt-1">Names and e-mails are managed by the organisation owner; platform staff only see counts.</p>
      </Card>
      <Card title="Active staff by role">
        {team.byRole.length === 0 ? (
          <Empty>Nobody can log in to this organisation. Ask the owner to be unblocked or create an owner account.</Empty>
        ) : (
          <Table head={['Role', 'Active people']}>
            {team.byRole.map((r) => (
              <tr key={r.role}>
                <td className="px-3 py-2">{r.label}</td>
                <td className="px-3 py-2">{r.count}</td>
              </tr>
            ))}
          </Table>
        )}
      </Card>
    </div>
  );
}
