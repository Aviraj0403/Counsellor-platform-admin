import { Link } from 'react-router-dom';
import { Card } from '../../../shared/ui/Card.jsx';
import { TONE_STYLES } from '../../../shared/ui/tones.js';

/** One headline number: icon in a tone chip, big value, short hint. Stacks icon-over-text on phones so two fit per row. Link when `to` is given. */
export default function Stat({ icon, label, value, hint, tone = 'indigo', to }) {
  const Icon = icon;
  const body = (
    <Card interactive={!!to} padded className="h-full">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:gap-3">
        <span className={`${TONE_STYLES[tone].chip} flex h-9 w-9 shrink-0 items-center justify-center rounded-xl sm:h-10 sm:w-10`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-eyebrow !text-[10.5px] sm:!text-[11px]">{label}</p>
          <p className="mt-1 text-xl font-semibold leading-tight text-fg sm:text-2xl" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</p>
          {hint && <p className="text-caption mt-1">{hint}</p>}
        </div>
      </div>
    </Card>
  );
  return to ? (
    <Link to={to} className="block h-full rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)]">
      {body}
    </Link>
  ) : (
    body
  );
}
