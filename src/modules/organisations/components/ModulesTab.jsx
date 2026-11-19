import { Empty } from '../../../shared/ui/ui';
import { GROUPS } from '../lib/workspaceMeta';
import ModuleCard from './ModuleCard';

export default function ModulesTab({ ws, canToggle, busyKey, onToggle }) {
  const labelOf = (k) => ws.modules.find((m) => m.key === k)?.label || k;
  const order = [...Object.keys(GROUPS), ...new Set(ws.modules.map((m) => m.group).filter((g) => !GROUPS[g]))];
  const groups = order.map((g) => ({ key: g, label: GROUPS[g] || g, items: ws.modules.filter((m) => m.group === g) })).filter((g) => g.items.length);
  if (!groups.length) return <Empty>No modules are listed.</Empty>;
  return (
    <div className="space-y-6">
      <p className="text-caption">Core features are always on. Add-ons are off until you switch them on. A feature marked "coming soon" is not built yet: do not sell it yet.</p>
      {groups.map((g) => (
        <section key={g.key} aria-label={g.label}>
          <p className="text-eyebrow mb-2">
            {g.label} <span className="text-caption">({g.items.filter((m) => m.enabled).length}/{g.items.length} on)</span>
          </p>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {g.items.map((m) => (
              <ModuleCard key={m.key} module={m} labelOf={labelOf} canToggle={canToggle} busy={busyKey === m.key} onToggle={onToggle} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

