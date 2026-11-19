import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Badge, Button, Empty } from '../../../shared/ui/ui';
import { OrganisationBilling } from '../../billing';
import { useAuth } from '../../auth';
import * as platformApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import ActivityTab from '../components/ActivityTab';
import IntegrationsTab from '../components/IntegrationsTab';
import ModulesTab from '../components/ModulesTab';
import OverviewTab from '../components/OverviewTab';
import TeamTab from '../components/TeamTab';
import WorkspaceSkeleton from '../components/WorkspaceSkeleton';
import { rememberOrganisation } from '../lib/recent';
import { TABS, TAB_KEYS } from '../lib/workspaceMeta';

/**
 * One organisation's workspace for platform staff: set-up and health of its modules and integrations, billing, staff counts and
 * platform changes. Configuration and health ONLY: never the organisation's students, leads, applications, documents or ledgers.
 * The tab is part of the address (/organisations/:id/:tab) so the switcher can stay on the same tab when you change organisation.
 */
export default function OrganisationDetail() {
  const { id, tab } = useParams();
  const { can } = useAuth();
  const [ws, setWs] = useState(null);
  const [error, setError] = useState('');
  const [busyKey, setBusyKey] = useState('');
  const [activityKey, setActivityKey] = useState(0);
  const latest = useRef(id);
  latest.current = id;

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await platformApi.getWorkspace(id);
      if (latest.current === id) setWs(data);
    } catch (e) {
      if (latest.current !== id) return;
      setError(e?.response?.status === 404 ? 'This organisation does not exist (it may have been removed).' : 'The organisation could not be loaded. Check your connection and try again.');
      if (e?.response?.status !== 404) toastError(e);
    }
  }, [id]);

  useEffect(() => {
    setWs(null);
    load();
    rememberOrganisation(id);
  }, [id, load]);

  const visibleTabs = TABS.filter((t) => (t.key === 'billing' ? can('platform:billing:manage') : t.key === 'activity' ? can('platform:audit:read') : true));
  if (!tab) return <Navigate to={`/organisations/${id}/overview`} replace />;
  if (!TAB_KEYS.includes(tab) || !visibleTabs.some((t) => t.key === tab)) return <Navigate to={`/organisations/${id}/overview`} replace />;
  const base = `/organisations/${id}`;

  const toggleModule = async (m, on) => {
    setBusyKey(m.key);
    try {
      const { data } = await platformApi.setTenantModules(id, { [m.key]: on });
      data.warnings.forEach((w) => toast(w, { icon: '⚠️', duration: 8000 }));
      if (!data.warnings.length) toast.success(`${m.label} ${on ? 'switched on' : 'switched off'}.`);
      await load();
      setActivityKey((k) => k + 1);
    } catch (e) {
      toastError(e);
    } finally {
      setBusyKey('');
    }
  };

  const setStatus = async (status) => {
    const name = ws.organisation.name;
    if (!window.confirm(status === 'suspended' ? `Suspend ${name}? Everyone in it is locked out immediately.` : `Reactivate ${name}?`)) return;
    try {
      await platformApi.setTenantStatus(id, status);
      toast.success(status === 'suspended' ? 'Organisation suspended.' : 'Organisation reactivated.');
      await load();
      setActivityKey((k) => k + 1);
    } catch (e) {
      toastError(e);
    }
  };

  const rename = async (name) => {
    try {
      await platformApi.renameTenant(id, name);
      toast.success('Name updated.');
      await load();
      setActivityKey((k) => k + 1);
    } catch (e) {
      toastError(e);
    }
  };

  if (error) {
    return (
      <>
        <p className="mb-2 text-sm"><Link to="/organisations" className="text-brand-600 dark:text-brand-300 hover:underline">← Organisations</Link></p>
        <Empty>{error}</Empty>
        <div className="mt-3"><Button variant="secondary" onClick={load}>Try again</Button></div>
      </>
    );
  }
  if (!ws) return <WorkspaceSkeleton />;

  const o = ws.organisation;
  const suspended = o.status !== 'active';
  return (
    <>
      <p className="mb-2 text-sm"><Link to="/organisations" className="text-brand-600 dark:text-brand-300 hover:underline">← Organisations</Link></p>

      <header className="surface-card mb-4 flex flex-wrap items-center justify-between gap-3 p-4" aria-label="Organisation">
        <div className="min-w-0">
          <p className="text-eyebrow">Organisation workspace</p>
          <h1 className="flex flex-wrap items-center gap-3 text-xl font-semibold text-fg">
            <span className="truncate">{o.name}</span>
            {suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}
            {ws.health.needsAttention > 0 && <Badge tone="amber">{ws.health.needsAttention} need attention</Badge>}
          </h1>
          <p className="text-caption mt-1">
            Address: <span className="font-mono">{o.slug}</span> · {ws.plan.name || 'no plan'} · created {formatDate(o.createdAt)}
          </p>
        </div>
        <p className="text-caption max-w-xs">Set-up and health only. This organisation's students, leads and records are not visible here.</p>
      </header>

      <nav role="tablist" aria-label="Organisation sections" className="mb-5 flex gap-1 overflow-x-auto border-b border-line">
        {visibleTabs.map((t) => {
          const active = t.key === tab;
          return (
            <Link
              key={t.key}
              to={`${base}/${t.key}`}
              role="tab"
              aria-selected={active}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${active ? 'border-brand-500 text-fg' : 'border-transparent text-fg-muted hover:text-fg'}`}
            >
              {t.label}
              {t.key === 'modules' && ws.health.needsAttention > 0 ? <span className="ml-2 inline-block h-2 w-2 rounded-full bg-brand-500" aria-label={`${ws.health.needsAttention} need attention`} /> : null}
            </Link>
          );
        })}
      </nav>

      <div role="tabpanel" aria-label={tab}>
        {tab === 'overview' && <OverviewTab ws={ws} base={base} canRename onRename={rename} onStatus={setStatus} key={o.name} />}
        {tab === 'modules' && <ModulesTab ws={ws} canToggle={can('platform:modules:manage')} busyKey={busyKey} onToggle={toggleModule} />}
        {tab === 'integrations' && <IntegrationsTab ws={ws} />}
        {tab === 'billing' && can('platform:billing:manage') && <OrganisationBilling tenantId={id} modulesOn={JSON.stringify(ws.modules.filter((m) => m.enabled).map((m) => m.key))} />}
        {tab === 'team' && <TeamTab ws={ws} />}
        {tab === 'activity' && can('platform:audit:read') && <ActivityTab tenantId={id} refreshKey={activityKey} />}
      </div>
    </>
  );
}
