import { Link, Navigate } from 'react-router-dom';
import { Badge, Card, PageHeader, Spinner } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { useCatalog } from '../../catalog';
import { PlatformOverview } from '../../billing';
import { useI18n } from '../../../shared/i18n/languageContext.js';

/** Home: tells the person, in plain words, who they are, what their role allows, and which features are on. */
export default function Dashboard() {
  const { t } = useI18n();
  const { me, can } = useAuth();
  const catalog = useCatalog();
  // portal users (a student, a college employee) land on their own page, never on the staff dashboard
  if (can('portal:student')) return <Navigate to="/my-applications" replace />;
  if (can('portal:college')) return <Navigate to="/college-applications" replace />;
  if (!catalog) return <Spinner />;

  const role = catalog.roles.find((r) => r.key === me.user.role);
  const isTenant = me.scope === 'tenant';

  const shortcuts = [
    { to: '/organisations', label: 'Manage organisations', perm: 'platform:tenants:manage' },
    { to: '/plans', label: 'Plans and pricing', perm: 'platform:billing:manage' },
    { to: '/invoices', label: 'Invoices', perm: 'platform:billing:manage' },
    { to: '/costs', label: 'Platform costs', perm: 'platform:costs:manage' },
    { to: '/insights', label: 'Usage and conversion research', perm: 'platform:insights:read' },
    { to: '/platform-audit', label: 'See platform audit', perm: 'platform:audit:read' },
    { to: '/leads', label: 'Open leads', perm: 'leads:read', module: 'leads' },
    { to: '/ledger', label: 'Ledger', perm: 'ledger:read', module: 'ledger' },
    { to: '/team', label: 'Manage team', perm: 'team:read', module: 'team' },
  ].filter((s) => can(s.perm) && (!s.module || me.modules?.[s.module]));

  return (
    <>
      <PageHeader title={t('page.welcome', 'Welcome, {name}', { name: me.user.name })} subtitle={role ? `${role.label}: ${role.description}` : undefined} />

      {me.scope === 'platform' && can('platform:billing:manage') && (
        <div className="mb-6">
          <PlatformOverview />
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card title="What you can do now">
          {shortcuts.length ? (
            <ul className="space-y-2 text-sm">
              {shortcuts.map((s) => (
                <li key={s.to}>
                  <Link to={s.to} className="font-medium text-brand-600 dark:text-brand-300 hover:underline">
                    {s.label} →
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-fg-muted">Your role has no screens yet. Ask your administrator.</p>
          )}
        </Card>

        <Card title="Your access">
          <p className="mb-2 text-xs text-fg-muted">Permissions given by your role</p>
          <div className="flex flex-wrap gap-1.5">
            {me.permissions.length ? me.permissions.map((p) => <Badge key={p} tone="blue">{p}</Badge>) : <span className="text-sm text-fg-muted">None</span>}
          </div>
        </Card>
      </div>

      {isTenant && (
        <Card title="Features for your organisation" className="mt-5">
          <div className="grid gap-3 md:grid-cols-2">
            {catalog.modules.map((m) => {
              const on = !!me.modules?.[m.key];
              return (
                <div key={m.key} className="rounded-lg border border-line p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-fg">{m.label}</span>
                    {on ? <Badge tone="green">On</Badge> : <Badge>Off</Badge>}
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">{m.whatItDoes}</p>
                  {!on && m.stage === 'soon' && <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">Coming soon</p>}
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </>
  );
}
