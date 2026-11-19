import { Building2, CheckCircle2, Coins, Layers, PauseCircle, PiggyBank, Plus, TrendingUp, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import OrgAvatar from '../../../shared/ui/OrgAvatar.jsx';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, formatINR, thisMonth } from '../../../shared/lib/format';
import { Badge, Button, Card, Empty, PageHeader, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { useCatalog } from '../../catalog';
import * as api from '../api';
import Stat from '../components/Stat';

const ACTIONS = [
  { to: '/organisations', label: 'Organisations and their features', perm: 'platform:tenants:manage' },
  { to: '/plans', label: 'Plans and pricing', perm: 'platform:billing:manage' },
  { to: '/invoices', label: 'Invoices', perm: 'platform:billing:manage' },
  { to: '/costs', label: 'Platform costs', perm: 'platform:costs:manage' },
  { to: '/insights', label: 'Usage and conversion research', perm: 'platform:insights:read' },
  { to: '/platform-audit', label: 'Platform audit', perm: 'platform:audit:read' },
];

/** Home for platform staff: organisations, money and what customers use. Only organisation and finance numbers, never student data. */
export default function PlatformDashboard() {
  const { t } = useI18n();
  const { me, can } = useAuth();
  const catalog = useCatalog();
  const [money, setMoney] = useState(null);
  const [orgs, setOrgs] = useState(null);
  const month = thisMonth();
  const wantMoney = can('platform:billing:manage');
  const wantOrgs = can('platform:tenants:manage');

  useEffect(() => {
    let live = true;
    if (wantMoney) api.platformMoney(month).then(({ data }) => live && setMoney(data)).catch(toastError);
    if (wantOrgs) api.recentOrganisations().then(({ data }) => live && setOrgs(data)).catch(toastError);
    return () => {
      live = false;
    };
  }, [wantMoney, wantOrgs, month]);

  if (!catalog) return <Spinner />;
  const addOnKeys = new Set(catalog.modules.filter((m) => !m.core).map((m) => m.key));
  const addOnsOn = (mods = {}) => Object.entries(mods).filter(([k, v]) => v && addOnKeys.has(k));
  const label = (key) => catalog.modules.find((m) => m.key === key)?.label || key;
  const moduleSwitches = orgs ? orgs.tenants.reduce((n, o) => n + addOnsOn(o.modules).length, 0) : null;
  const o = money?.organisations;
  const total = o ? o.active + o.suspended : orgs?.total;
  const adoption = money ? Object.entries(money.moduleAdoption).sort((a, b) => b[1] - a[1]) : [];
  const actions = ACTIONS.filter((a) => can(a.perm));

  return (
    <>
      <PageHeader
        title={t('page.welcome', 'Welcome, {name}', { name: me.user.name })}
        subtitle="Platform overview: organisations, revenue and costs for this month."
        action={wantOrgs && <Link to="/organisations"><Button><Plus size={16} /> New organisation</Button></Link>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {(wantOrgs || wantMoney) && <Stat icon={Building2} tone="violet" label="Organisations" value={total ?? '...'} hint={o ? `${o.newLast30Days} new in the last 30 days` : undefined} to="/organisations" />}
        {o && <Stat icon={CheckCircle2} tone="emerald" label="Active" value={o.active} hint={`${o.activeStaffAccounts} staff accounts`} />}
        {o && <Stat icon={PauseCircle} tone={o.suspended ? 'rose' : 'amber'} label="Suspended" value={o.suspended} hint={o.suspended ? 'Locked out until reactivated' : 'None suspended'} />}
        {moduleSwitches !== null && <Stat icon={Layers} tone="sky" label="Add-on features on" value={moduleSwitches} hint={orgs.total > orgs.tenants.length ? `Across the ${orgs.tenants.length} newest organisations` : 'Across all organisations'} />}
        {money && <Stat icon={TrendingUp} tone="emerald" label="Monthly recurring revenue" value={formatINR(money.revenue.mrrPaise)} hint="Active organisations, before GST" to="/invoices" />}
        {money && <Stat icon={Coins} tone="indigo" label="Collected this month" value={formatINR(money.revenue.collectedPaise)} hint={`Outstanding ${formatINR(money.revenue.outstandingPaise)} incl. GST`} to="/invoices" />}
        {money && <Stat icon={Wallet} tone="amber" label="Platform costs" value={formatINR(money.costs.totalPaise)} hint="Entered by finance" to="/costs" />}
        {money && <Stat icon={PiggyBank} tone={money.marginPaise < 0 ? 'rose' : 'teal'} label="Margin" value={formatINR(money.marginPaise)} hint="Invoiced before GST, minus costs" />}
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        {wantOrgs && (
          <div className="xl:col-span-2">
            <Card title="Newest organisations" action={<Link to="/organisations" className="text-caption underline">View all</Link>}>
              {!orgs ? (
                <Spinner />
              ) : orgs.tenants.length === 0 ? (
                <Empty>No organisations yet. Create the first one.</Empty>
              ) : (
                <Table head={['Name', 'Status', 'Add-ons on', 'Created']}>
                  {orgs.tenants.slice(0, 8).map((x) => (
                    <tr key={x.id} className="hover:bg-surface-2">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <OrgAvatar name={x.name} logoUrl={x.logoUrl} brandColor={x.brandColor} size="sm" />
                          <div className="min-w-0">
                            <Link to={`/organisations/${x.id}`} className="font-medium text-brand-600 hover:underline dark:text-brand-300">{x.name}</Link>
                            <p className="text-caption">{x.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">{x.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Suspended</Badge>}</td>
                      <td className="px-3 py-2.5 text-fg-muted">{addOnsOn(x.modules).length}</td>
                      <td className="px-3 py-2.5 text-fg-muted">{formatDate(x.createdAt)}</td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>
          </div>
        )}

        <div className="space-y-5">
          <Card title="Quick actions">
            {actions.length ? (
              <ul className="space-y-2 text-sm">
                {actions.map((a) => (
                  <li key={a.to}>
                    <Link to={a.to} className="font-medium text-brand-600 hover:underline dark:text-brand-300">{a.label} →</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-fg-muted">Your role has no platform screens yet. Ask your administrator.</p>
            )}
          </Card>
          {money && (
            <Card title="Which features customers use">
              {adoption.length === 0 ? (
                <Empty>No add-ons switched on yet.</Empty>
              ) : (
                <ul className="space-y-2 text-sm">
                  {adoption.map(([key, n]) => (
                    <li key={key} className="flex items-center justify-between gap-2">
                      <span>{label(key)}</span>
                      <span className="text-fg-muted">{n} organisation{n === 1 ? '' : 's'}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
