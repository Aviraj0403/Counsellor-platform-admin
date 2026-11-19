import { Badge, Empty, Spinner } from '../../../shared/ui/ui';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import OrgAvatar from '../../../shared/ui/OrgAvatar.jsx';

const Stat = ({ label, value, hint }) => (
  <div className="min-w-0">
    <div className="text-eyebrow">{label}</div>
    <div className="text-lg font-semibold text-fg">{value === null || value === undefined ? <span className="text-sm font-normal text-fg-muted">Module off</span> : value}</div>
    {hint && <div className="text-caption !text-[11px]">{hint}</div>}
  </div>
);

/** Totals, then one card per organisation. Choosing a card filters the lists below to that organisation. */
export default function SummaryCards({ data, selected, onSelect }) {
  const { t } = useI18n();
  if (!data) return <Spinner />;
  if (data.organisations.length === 0) return <Empty>{t('central.noOrganisations', 'No organisation has these features switched on yet.')}</Empty>;
  const tot = data.totals;
  const pending = tot.documentsByStatus?.pending_review ?? 0;

  return (
    <div className="mb-5">
      <div className="surface-card card-pad mb-3 grid grid-cols-2 gap-4 sm:grid-cols-5">
        <Stat label={t('central.leads', 'Leads')} value={tot.leads} />
        <Stat label={t('central.students', 'Students')} value={tot.students} />
        <Stat label={t('central.applications', 'Applications')} value={tot.applications} />
        <Stat label={t('central.documents', 'Documents')} value={tot.documents} hint={tot.documents ? `${pending} waiting for review` : undefined} />
        <Stat label={t('central.upcomingAppointments', 'Upcoming appointments')} value={tot.appointmentsUpcoming} />
      </div>
      {data.truncated && <p className="text-caption mb-3">{t('central.truncated', 'Only the first 100 organisations are shown. Pick one organisation to see the rest.')}</p>}
      {data.partial && <p className="text-caption mb-3">{t('central.partial', 'Some organisations could not be read just now, so these numbers may be incomplete.')}</p>}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.organisations.map((o) => {
          const on = selected === o.organisation.id;
          return (
            <button
              key={o.organisation.id}
              type="button"
              onClick={() => onSelect(on ? '' : o.organisation.id)}
              aria-pressed={on}
              className={`surface-card card-pad cursor-pointer text-left transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${on ? 'ring-2 ring-brand-500' : ''}`}
            >
              <div className="mb-3 flex items-center gap-3">
                <OrgAvatar name={o.organisation.name} logoUrl={o.organisation.logoUrl} size="md" />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-fg">{o.organisation.name}</div>
                  <div className="text-caption truncate !text-[11px]">{o.organisation.slug}</div>
                </div>
                {o.organisation.status !== 'active' && <Badge tone="red">{t('central.suspended', 'suspended')}</Badge>}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Stat label={t('central.leads', 'Leads')} value={o.leads} />
                <Stat label={t('central.students', 'Students')} value={o.students} />
                <Stat label={t('central.applications', 'Applications')} value={o.applications?.total ?? null} />
                <Stat label={t('central.documents', 'Documents')} value={o.documents?.total ?? null} hint={o.documents ? `${o.documents.byStatus?.pending_review ?? 0} to review` : undefined} />
                <Stat label={t('central.appointmentsShort', 'Upcoming appts')} value={o.appointmentsUpcoming} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
