import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { TONE_STYLES } from '../../../shared/ui/tones.js';

/** Icon tiles that jump straight to a screen. items: [{ to, label, icon, tone }] */
export default function QuickLinks({ items }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
      {items.map(({ to, label, icon, tone = 'indigo' }) => {
        const Icon = icon;
        return (
          <li key={to}>
            <Link to={to} className="group flex min-h-11 items-center gap-3 rounded-xl border border-line bg-surface-2/60 px-3 py-2 transition-colors hover:border-[color-mix(in_srgb,var(--brand-500)_35%,var(--line))] hover:bg-surface-2">
              <span className={`${TONE_STYLES[tone].chip} flex h-8 w-8 shrink-0 items-center justify-center rounded-lg`}>
                <Icon size={16} />
              </span>
              <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-fg">{label}</span>
              <ChevronRight size={15} className="shrink-0 text-fg-muted transition-transform group-hover:translate-x-0.5" />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
