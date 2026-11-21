import { CalendarCheck, ChevronDown, ClipboardList, GraduationCap, ListChecks, Megaphone, ShieldCheck, Upload, UserPlus, Users, Wallet, Building2, Globe } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { humanize } from '../../../shared/lib/format';
import { Badge, Card, Empty, Spinner } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { useCatalog } from '../../catalog';
import * as api from '../api';
import QuickLinks from '../components/QuickLinks';
import SetupChecklist from '../components/SetupChecklist';
import Stat from '../components/Stat';
import WelcomeHero from '../components/WelcomeHero';

const STATUS_TONE = { admitted: 'green', fee_paid: 'green', rejected: 'red', declined: 'red', draft: 'gray', withdrawn: 'gray' };

/** Home for organisation users: only cards for features that are on and permissions the person has. */
export default function TenantDashboard() {
  const { me, can, hasModule } = useAuth();
  const catalog = useCatalog();
  const [d, setD] = useState({});

  const show = {
    tasks: can('followups:read') && hasModule('followups'),
    leads: can('leads:read') && hasModule('leads'),
    appts: can('appointments:read') && hasModule('appointments'),
    apps: can('applications:read') && hasModule('applications'),
    // setup checks (owner-level screens)
    meta: can('integrations:manage') && hasModule('metaAds'),
    team: can('team:manage'),
    colleges: can('colleges:write') && hasModule('colleges'),
    anyLeads: can('leads:read') && hasModule('leads'),
  };

  useEffect(() => {
    let live = true;
    const put = (key) => ({ data }) => live && setD((x) => ({ ...x, [key]: data }));
    if (show.tasks) api.myTaskSummary().then(put('tasks')).catch(toastError);
    if (show.leads) api.newLeads().then(put('leads')).catch(toastError);
    if (show.appts) api.appointmentSummary().then(put('appts')).catch(toastError);
    if (show.apps) api.latestApplications().then(put('apps')).catch(toastError);
    // setup state is best-effort: a failed check just leaves that step un-ticked
    if (show.meta) api.metaConfig().then(put('metaCfg')).catch(() => {});
    if (show.team) api.teamList().then(put('teamList')).catch(() => {});
    if (show.colleges) api.anyColleges().then(put('collegeList')).catch(() => {});
    if (show.anyLeads) api.anyLeads().then(put('leadList')).catch(() => {});
    return () => {
      live = false;
    };
  }, [show.tasks, show.leads, show.appts, show.apps, show.meta, show.team, show.colleges, show.anyLeads]);

  if (!catalog) return <Spinner />;
  const role = catalog.roles.find((r) => r.key === me.user.role);
  const byStatus = {};
  (d.apps?.items || []).forEach((a) => {
    byStatus[a.status] = (byStatus[a.status] || 0) + 1;
  });
  const statusRows = Object.entries(byStatus).sort((a, b) => b[1] - a[1]);
  const anyCard = Object.values(show).some(Boolean);
  const loaded = (k) => d[k] !== undefined;
  const setup = [
    show.anyLeads && { key: 'site', title: 'Connect lead sources', hint: 'Website form, Justdial, Google Ads or any portal via one webhook.', to: '/leads/sources', cta: 'Open lead sources', icon: Globe, tone: 'sky', done: loaded('leadList') && d.leadList.total > 0 },
    show.meta && { key: 'meta', title: 'Connect Meta Ads', hint: 'Pixel, access token and lead-ads webhook, step by step.', to: '/integrations/meta', cta: 'Start Meta setup', icon: Megaphone, tone: 'indigo', done: loaded('metaCfg') && !!d.metaCfg.tokenSet && !!d.metaCfg.enabled },
    show.team && { key: 'team', title: 'Invite your team', hint: 'Counsellors, sales, accounts and admissions, each with their own access.', to: '/team', cta: 'Add team', icon: Users, tone: 'violet', done: loaded('teamList') && (d.teamList.team?.length || 0) > 1 },
    show.colleges && { key: 'colleges', title: 'Add your colleges', hint: 'Directory with fees and courses, used by applications and the predictor.', to: '/colleges', cta: 'Add colleges', icon: Building2, tone: 'emerald', done: loaded('collegeList') && d.collegeList.total > 0 },
  ].filter(Boolean).map((x) => ({ ...x, done: !!x.done }));
  const setupReady = setup.length > 0 && (!show.anyLeads || loaded('leadList')) && (!show.meta || loaded('metaCfg')) && (!show.team || loaded('teamList')) && (!show.colleges || loaded('collegeList'));
  const quick = [
    can('leads:write') && hasModule('leads') && { to: '/leads', label: 'Add or import leads', icon: UserPlus, tone: 'orange' },
    can('followups:read') && hasModule('followups') && { to: '/followups', label: 'My follow-up tasks', icon: ListChecks, tone: 'amber' },
    can('appointments:write') && hasModule('appointments') && { to: '/appointments', label: 'Book an appointment', icon: CalendarCheck, tone: 'indigo' },
    can('applications:read') && hasModule('applications') && { to: '/applications', label: 'Track applications', icon: GraduationCap, tone: 'violet' },
    can('documents:read') && hasModule('documents') && { to: '/documents/queue', label: 'Verify documents', icon: Upload, tone: 'sky' },
    can('ledger:read') && hasModule('ledger') && { to: '/ledger', label: 'Ledger and payments', icon: Wallet, tone: 'emerald' },
  ].filter(Boolean);

  return (
    <>
      <WelcomeHero name={me.user.name} chip={role?.label} subtitle={role?.description} />

      {setupReady && <SetupChecklist steps={setup} />}

      {anyCard && (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        {show.apps && (
          <Card title="Applications by status" className="lg:col-span-2">
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

        {quick.length > 0 && (
          <Card title="Quick actions">
            <QuickLinks items={quick} />
          </Card>
        )}
      </div>

      <details className="group mt-5">
        <summary className="surface-card flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
          <span className="tone-brand tone-chip flex h-8 w-8 items-center justify-center rounded-lg"><ShieldCheck size={16} /></span>
          <span className="flex-1">
            <span className="text-card-title block">Your access</span>
            <span className="text-caption">{me.permissions.length} permissions given by your role</span>
          </span>
          <ChevronDown size={16} className="text-fg-muted transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          {me.permissions.length ? me.permissions.map((p) => <Badge key={p} tone="blue">{p}</Badge>) : <span className="text-sm text-fg-muted">None</span>}
        </div>
      </details>

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
