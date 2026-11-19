import { Link } from 'react-router-dom';
import { Card } from '../../../shared/ui/Card.jsx';
import { TONE_STYLES } from '../../../shared/ui/tones.js';

/** One headline number: icon in a tone chip, big value, short hint. Becomes a link when `to` is given. */
export default function Stat({ icon, label, value, hint, tone = 'indigo', to }) {
  const Icon = icon;
  const body = (
    <Card interactive={!!to} padded className="h-full">
      <div className="flex items-start gap-3">
        <span className={`${TONE_STYLES[tone].chip} flex h-10 w-10 shrink-0 items-center justify-center rounded-xl`}>
          <Icon size={18} />
        </span>
        <div className="min-w-0">
          <p className="text-eyebrow !text-[11px]">{label}</p>
          <p className="mt-1 text-2xl font-semibold leading-tight text-fg">{value}</p>
          {hint && <p className="text-caption mt-1">{hint}</p>}
        </div>
      </div>
    </Card>
  );
  return to ? (
    <Link to={to} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-500)]">
      {body}
    </Link>
  ) : (
    body
  );
}
