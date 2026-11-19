import { CalendarCheck, ClipboardList, GraduationCap, ListChecks } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { humanize } from '../../../shared/lib/format';
import { Badge, Card, Empty, PageHeader, Spinner } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { useCatalog } from '../../catalog';
import * as api from '../api';
import Stat from '../components/Stat';

const STATUS_TONE = { admitted: 'green', fee_paid: 'green', rejected: 'red', declined: 'red', draft: 'gray', withdrawn: 'gray' };

/** Home for organisation users: only cards for features that are on and permissions the person has. */
export default function TenantDashboard() {
  const { t } = useI18n();
  const { me, can, hasModule } = useAuth();
  const catalog = useCatalog();
  const [d, setD] = useState({});

  const show = {
    tasks: can('followups:read') && hasModule('followups'),
    leads: can('leads:read') && hasModule('leads'),
    appts: can('appointments:read') && hasModule('appointments'),
    apps: can('applications:read') && hasModule('applications'),
  };

  useEffect(() => {
    let live = true;
    const put = (key) => ({ data }) => live && setD((x) => ({ ...x, [key]: data }));
    if (show.tasks) api.myTaskSummary().then(put('tasks')).catch(toastError);
    if (show.leads) api.newLeads().then(put('leads')).catch(toastError);
    if (show.appts) api.appointmentSummary().then(put('appts')).catch(toastError);
    if (show.apps) api.latestApplications().then(put('apps')).catch(toastError);
    return () => {
      live = false;
    };
  }, [show.tasks, show.leads, show.appts, show.apps]);

  if (!catalog) return <Spinner />;
  const role = catalog.roles.find((r) => r.key === me.user.role);
  const byStatus = {};
  (d.apps?.items || []).forEach((a) => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  });
  const statusRows = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const anyCard = Object.values(show).some(Boolean);

  return (
    <>
      <PageHeader title={t('page.welcome', 'Welcome, {name}', { name: me.user.name })} subtitle={role ? `${role.label}: ${role.description}` : undefined} />

      {anyCard && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {show.tasks && (
            <Stat icon={ListChecks} tone={d.tasks?.overdue ? 'rose' : 'amber'} label="My follow-ups due today" value={d.tasks ? d.tasks.dueToday : '...'} hint={d.tasks ? `${d.tasks.overdue} overdue · ${d.tasks.open} open` : undefined} to="/followups" />
          )}
          {show.leads && <Stat icon={ClipboardList} tone="orange" label="New leads" value={d.leads ? d.leads.total : '...'} hint="Not contacted yet" to="/leads" />}
          {show.appts && (
            <Stat icon={CalendarCheck} tone="indigo" label="Appointments today" value={d.appts ? d.appts.today.total : '...'} hint={d.appts ? `${d.appts.upcoming7Days} in the next 7 days` : undefined} to="/appointments" />
          )}
          {show.apps && <Stat icon={GraduationCap} tone="violet" label="Applications" value={d.apps ? d.apps.total : '...'} hint="All statuses" to="/applications" />}
        </div>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        {show.apps && (
          <Card title="Applications by status">
            {!d.apps ? (
              <Spinner />
            ) : statusRows.length === 0 ? (
              <Empty>No applications yet.</Empty>
            ) : (
              <>
                <ul className="space-y-2 text-sm">
                  {statusRows.map(([s, n]) => (
                    <li key={s} className="flex items-center justify-between gap-2">
                      <Badge tone={STATUS_TONE[s] || 'blue'}><span className="capitalize">{humanize(s)}</span></Badge>
                      <span className="font-medium text-fg">{n}</span>
                    </li>
                  ))}
                </ul>
                {d.apps.total > d.apps.items.length && <p className="text-caption mt-3">Counted from the latest {d.apps.items.length} of {d.apps.total} applications.</p>}
              </>
            )}
          </Card>
        )}

        <Card title="Your access">
          <p className="mb-2 text-xs text-fg-muted">Permissions given by your role ({me.permissions.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {me.permissions.length ? me.permissions.map((p) => <Badge key={p} tone="blue">{p}</Badge>) : <span className="text-sm text-fg-muted">None</span>}
          </div>
        </Card>
      </div>

      <Card title="Features for your organisation" className="mt-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {catalog.modules.map((m) => {
            const on = !!me.modules?.[m.key];
            return (
              <div key={m.key} className="rounded-xl border border-line p-3">
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
        <p className="text-caption mt-3">Want a feature that is off? Ask your account manager.</p>
      </Card>
    </>
  );
}
