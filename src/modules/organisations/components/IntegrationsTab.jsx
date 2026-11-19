import { Badge, Card, Empty, Table } from '../../../shared/ui/ui';
import { INTEGRATION_KEYS, iconFor } from '../lib/workspaceMeta';

const stateOf = (m) => {
  if (!m.enabled) return { tone: 'gray', label: 'Not switched on' };
  const c = m.config;
  if (!c || c.configured === null) return { tone: 'gray', label: 'Status not reported yet' };
  return c.configured ? { tone: 'green', label: 'Connected' } : { tone: 'amber', label: 'Not connected' };
};

export default function IntegrationsTab({ ws }) {
  const rows = INTEGRATION_KEYS.map((k) => ws.modules.find((m) => m.key === k)).filter(Boolean);
  if (!rows.length) return <Empty>This platform version has no integrations.</Empty>;
  return (
    <Card title="Integrations" action={<span className="text-caption">Whether each outside connection is set up, and the last problem seen.</span>}>
      <Table head={['Integration', 'State', 'Last problem', 'What to do next']}>
        {rows.map((m) => {
          const s = stateOf(m);
          const Icon = iconFor(m.key);
          const problem = m.enabled && m.config?.health === 'attention' ? m.config.summary : null;
          return (
            <tr key={m.key}>
              <td className="px-3 py-2">
                <span className="flex items-center gap-2 font-medium text-fg">
                  <Icon size={15} aria-hidden="true" /> {m.label}
                </span>
              </td>
              <td className="px-3 py-2"><Badge tone={s.tone}>{s.label}</Badge></td>
              <td className="px-3 py-2 text-fg-secondary">{m.enabled ? (problem || 'None') : '-'}</td>
              <td className="px-3 py-2 text-fg-secondary">{m.enabled && m.config?.nextStep ? m.config.nextStep : m.enabled ? '-' : 'Switch it on in the Modules tab if the organisation bought it.'}</td>
            </tr>
          );
        })}
      </Table>
    </Card>
  );
}
