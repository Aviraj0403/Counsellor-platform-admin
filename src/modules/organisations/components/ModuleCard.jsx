import { AlertTriangle } from 'lucide-react';
import { Badge } from '../../../shared/ui/ui';
import { formatValue, iconFor, statusOf } from '../lib/workspaceMeta';

/** One module: what it does, an on/off switch, its health and (when on) a few non-personal setup facts. */
export default function ModuleCard({ module: m, labelOf, canToggle, busy, onToggle, showWhat = true }) {
  const Icon = iconFor(m.key);
  const status = statusOf(m);
  const c = m.enabled ? m.config : null;
  const blocked = !m.enabled && m.dependsOnUnmet.length > 0;
  const needsAttention = c?.health === 'attention';
  return (
    <article className={`surface-card flex flex-col gap-3 p-4 ${needsAttention ? 'ring-1 ring-inset ring-line' : ''}`} aria-label={m.label}>
      <div className="flex items-start gap-3">
        <span className={`tone-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${needsAttention ? 'tone-amber' : m.enabled ? 'tone-emerald' : 'tone-neutral'}`}>
          <Icon size={18} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">{m.label}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <Badge tone={status.tone}>{status.label}</Badge>
            {m.core && <Badge tone="blue">Core</Badge>}
            {m.stage === 'soon' && <Badge tone="amber">Coming soon</Badge>}
          </div>
        </div>
        {!m.core && (
          <button
            type="button"
            role="switch"
            aria-checked={m.enabled}
            aria-label={`${m.label} on or off`}
            disabled={!canToggle || busy}
            onClick={() => onToggle(m, !m.enabled)}
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full ring-1 ring-inset ring-line transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-60 ${m.enabled ? 'brand-gradient' : 'bg-surface-2'}`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${m.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        )}
      </div>

      {showWhat && <p className="text-caption">{m.whatItDoes}</p>}

      {blocked && (
        <p className="flex items-start gap-2 text-xs text-fg-muted">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <span>Needs {m.dependsOnUnmet.map(labelOf).join(', ')} switched on first{m.requested ? ' (this one is already marked on and will start working then)' : ''}.</span>
        </p>
      )}
      {!m.enabled && !blocked && !m.core && m.priceMonthlyInr > 0 && <p className="text-caption">₹{m.priceMonthlyInr}/month when switched on{m.priceOverridden ? ' (negotiated price)' : ''}.</p>}

      {c && (
        <div className="border-t border-line pt-3">
          <p className="text-sm text-fg-secondary">{c.summary}</p>
          {needsAttention && c.nextStep && (
            <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-fg">
              <span className="font-semibold">Next step: </span>
              {c.nextStep}
            </p>
          )}
          {c.items.length > 0 && (
            <dl className="mt-3 grid grid-cols-[1fr_auto] gap-x-3 gap-y-1 text-xs">
              {c.items.map((i) => (
                <div key={i.label} className="contents">
                  <dt className="text-fg-muted">{i.label}</dt>
                  <dd className="text-right font-medium text-fg">{formatValue(i.value)}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      )}
    </article>
  );
}
