import { Check, ChevronRight, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TONE_STYLES } from '../../../shared/ui/tones.js';

/**
 * "Get started" card: what is set up, what is next. steps: [{ key, title, hint, to, cta, icon, tone, done }]
 * Hides itself once every step is done, so a finished workspace is just a clean dashboard.
 */
export default function SetupChecklist({ steps }) {
  const total = steps.length;
  const done = steps.filter((s) => s.done).length;
  if (total === 0 || done === total) return null;
  const pct = Math.round((done / total) * 100);
  const next = steps.find((s) => !s.done);

  return (
    <section className="surface-card mb-6 overflow-hidden">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line px-4 py-4 sm:px-5">
        <div className="min-w-0 flex-1">
          <h2 className="text-card-title">Get your workspace ready</h2>
          <p className="text-caption mt-0.5">
            {done} of {total} done. Next: <span className="font-medium text-fg">{next.title}</span>
          </p>
        </div>
        <div className="flex w-full items-center gap-3 sm:w-56">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-2 ring-1 ring-inset ring-line" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Setup progress">
            <div className="brand-gradient h-full rounded-full transition-[width] duration-500" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-xs font-semibold tabular-nums text-fg-secondary">{pct}%</span>
        </div>
      </div>

      <ol className="grid divide-line sm:grid-cols-2 sm:divide-x xl:grid-cols-4">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li key={s.key} className={`border-line ${i > 0 ? 'max-sm:border-t' : ''} ${i >= 2 ? 'sm:border-t xl:border-t-0' : ''}`}>
              <Link to={s.to} className="group flex h-full items-start gap-3 p-4 transition-colors hover:bg-surface-2 sm:p-5">
                <span className={`${TONE_STYLES[s.tone || 'indigo'].chip} relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}>
                  <Icon size={18} />
                  <span className={`absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full ring-2 ring-[var(--surface-solid)] ${s.done ? 'bg-emerald-500 text-white' : 'bg-surface-2 text-fg-muted'}`}>
                    {s.done ? <Check size={10} strokeWidth={3} /> : <Circle size={6} fill="currentColor" />}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block text-[13px] font-semibold ${s.done ? 'text-fg-muted line-through decoration-1' : 'text-fg'}`}>{s.title}</span>
                  <span className="text-caption mt-0.5 block">{s.hint}</span>
                  {!s.done && (
                    <span className="mt-2 inline-flex items-center gap-0.5 text-xs font-semibold text-brand-600 dark:text-brand-300">
                      {s.cta} <ChevronRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
