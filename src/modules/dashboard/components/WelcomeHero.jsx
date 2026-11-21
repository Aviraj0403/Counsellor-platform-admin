import { CalendarDays } from 'lucide-react';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

/** Brand banner at the top of each home screen: greeting, who/what this is, and the primary actions. */
export default function WelcomeHero({ name, subtitle, chip, actions }) {
  const today = new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <section className="relative mb-6 overflow-hidden rounded-2xl p-5 text-white shadow-[0_18px_40px_-22px_rgba(6,26,63,0.7)] sm:p-7" style={{ background: 'linear-gradient(120deg, #061a3f 0%, #0b3f8f 52%, #0a96d0 120%)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.16]" style={{ backgroundImage: "url('/login-hero.webp')", backgroundSize: '520px', mixBlendMode: 'screen' }} />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full blur-3xl" style={{ background: 'rgba(245,166,35,0.22)' }} />
      <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-100/90">
            <CalendarDays size={14} /> {today}
            {chip && <span className="ml-1 rounded-full bg-white/15 px-2 py-0.5 text-[11px] font-semibold text-white ring-1 ring-inset ring-white/25">{chip}</span>}
          </p>
          <h1 className="mt-2 text-2xl leading-tight sm:text-[28px]" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
            {greeting()}, {name}
          </h1>
          {subtitle && <p className="mt-1.5 max-w-[62ch] text-sm text-sky-50/80">{subtitle}</p>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </section>
  );
}
