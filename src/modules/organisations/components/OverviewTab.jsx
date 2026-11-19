import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Empty, Input } from '../../../shared/ui/ui';
import { formatINR, formatDate } from '../../../shared/lib/format';
import BrandingForm from '../../../shared/ui/BrandingForm.jsx';

const Stat = ({ label, value, hint, tone }) => (
  <div className="surface-card p-4">
    <p className="text-eyebrow">{label}</p>
    <p className={`mt-1 text-2xl font-semibold text-fg ${tone || ''}`}>{value}</p>
    {hint && <p className="text-caption mt-1">{hint}</p>}
  </div>
);

export default function OverviewTab({ ws, base, canRename, onRename, onStatus, onBranding }) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(ws.organisation.name);
  const attention = ws.modules.filter((m) => m.enabled && m.config?.health === 'attention');
  const addOnTotal = ws.modules.filter((m) => !m.core).length;
  const suspended = ws.organisation.status !== 'active';
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Add-ons on" value={`${ws.health.addOnsOn} of ${addOnTotal}`} hint="Core features are always on." />
        <Stat label="Need attention" value={ws.health.needsAttention} hint={ws.health.needsAttention ? 'Set-up is incomplete, see below.' : 'Nothing is waiting on set-up.'} />
        <Stat label="Plan" value={ws.plan.name || 'No plan'} hint={ws.plan.name ? 'Assigned plan' : 'Custom or trial (priced per add-on)'} />
        <Stat label="Monthly estimate" value={formatINR(ws.plan.monthlySubtotalPaise)} hint="Before GST, from the current plan and add-ons." />
      </div>

      <Card title="Needs attention">
        {attention.length === 0 ? (
          ws.health.addOnsOn === 0 ? (
            <Empty>No add-on is switched on yet. Open the Modules tab to switch on what this organisation bought.</Empty>
          ) : (
            <p className="flex items-center gap-2 text-sm text-fg-secondary">
              <CheckCircle2 size={16} aria-hidden="true" /> Everything that is switched on is set up.
            </p>
          )
        ) : (
          <ul className="divide-y divide-line">
            {attention.map((m) => (
              <li key={m.key} className="flex flex-wrap items-start justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg">{m.label}</p>
                  <p className="text-caption">{m.config.summary}</p>
                  {m.config.nextStep && <p className="mt-1 text-xs text-fg">Next step: {m.config.nextStep}</p>}
                </div>
                <Link to={`${base}/modules`} className="text-sm text-brand-600 dark:text-brand-300 hover:underline">Open modules</Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {canRename && onBranding && (
        <Card title="Branding">
          <BrandingForm
            name={ws.organisation.name}
            logoUrl={ws.organisation.logoUrl}
            brandColor={ws.organisation.brandColor}
            saving={saving}
            onSave={async (body) => {
              setSaving(true);
              try {
                await onBranding(body);
              } finally {
                setSaving(false);
              }
            }}
          />
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Organisation">
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt className="text-fg-muted">Address (slug)</dt>
            <dd className="font-mono text-fg">{ws.organisation.slug}</dd>
            <dt className="text-fg-muted">Status</dt>
            <dd>{suspended ? <Badge tone="red">Suspended</Badge> : <Badge tone="green">Active</Badge>}</dd>
            <dt className="text-fg-muted">Created</dt>
            <dd className="text-fg">{formatDate(ws.organisation.createdAt)}</dd>
            <dt className="text-fg-muted">Staff</dt>
            <dd className="text-fg">
              {ws.team.active} active{ws.team.blocked ? `, ${ws.team.blocked} blocked` : ''}
            </dd>
          </dl>
          {canRename && (
            <div className="mt-4 flex max-w-md gap-2">
              <Input value={name} onChange={(e) => setName(e.target.value)} aria-label="Organisation name" />
              <Button variant="secondary" disabled={name.trim() === ws.organisation.name || name.trim().length < 2} onClick={() => onRename(name.trim())}>Save name</Button>
            </div>
          )}
        </Card>
        <Card title="Access">
          <p className="mb-3 text-sm text-fg-secondary">
            {suspended ? 'Suspended: nobody in this organisation can log in until you reactivate it.' : 'Active: the organisation team can log in and work.'}
          </p>
          {suspended ? <Button onClick={() => onStatus('active')}>Reactivate</Button> : <Button variant="danger" onClick={() => onStatus('suspended')}>Suspend</Button>}
          <p className="text-caption mt-4">This page shows set-up and health only. Students, leads, applications, documents and ledgers of an organisation are never shown to platform staff.</p>
        </Card>
      </div>
    </div>
  );
}
