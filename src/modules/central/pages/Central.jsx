import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import * as centralApi from '../api';
import CentralList from '../components/CentralList';
import SummaryCards from '../components/SummaryCards';

const TABS = [
  { key: 'leads', label: 'Leads' },
  { key: 'students', label: 'Students' },
  { key: 'applications', label: 'Applications' },
  { key: 'documents', label: 'Documents' },
];

/**
 * Central data: every organisation's leads, students, applications and document metadata in one place (superadmin only).
 * The records stay in each organisation's own database; this page reads them one organisation at a time.
 * Phones and emails are masked and documents are metadata only. "Open in organisation" starts acting in that organisation
 * (audited, see the acting banner) to see full detail.
 */
export default function Central() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { startActing } = useAuth();
  const [summary, setSummary] = useState(null);
  const [tab, setTab] = useState('leads');
  const [tenantId, setTenantId] = useState('');
  const [openingId, setOpeningId] = useState('');

  useEffect(() => {
    centralApi.summary().then(({ data }) => setSummary(data)).catch((e) => { toastError(e); setSummary({ organisations: [], totals: {}, truncated: false }); });
  }, []);

  const open = useCallback(
    async (organisation, path, rowKey) => {
      if (openingId) return;
      setOpeningId(rowKey);
      try {
        await startActing({ id: organisation.id, name: organisation.name });
        navigate(path);
      } catch (e) {
        toastError(e);
      } finally {
        setOpeningId('');
      }
    },
    [openingId, startActing, navigate],
  );

  const organisations = (summary?.organisations || []).map((o) => o.organisation);

  return (
    <>
      <PageHeader
        title={t('central.title', 'Central data')}
        subtitle={t('central.subtitle', 'Leads, students, applications and documents of every organisation in one place. The records stay in each organisation. Phone numbers and emails are masked and documents show details only, never the files. Use "Open in organisation" to see everything; that is recorded in the audit trail.')}
      />

      <SummaryCards data={summary} selected={tenantId} onSelect={setTenantId} />

      <div role="tablist" aria-label={t('central.title', 'Central data')} className="mb-3 flex flex-wrap gap-2">
        {TABS.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            aria-selected={tab === x.key}
            onClick={() => setTab(x.key)}
            className={`h-9 cursor-pointer rounded-xl px-4 text-sm font-medium ring-1 ring-inset ring-line transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${tab === x.key ? 'bg-surface-2 text-fg' : 'bg-surface text-fg-secondary hover:bg-surface-2'}`}
          >
            {t(`central.tab.${x.key}`, x.label)}
          </button>
        ))}
      </div>

      <CentralList key={tab} resource={tab} organisations={organisations} tenantId={tenantId} onTenant={setTenantId} onOpen={open} openingId={openingId} />
    </>
  );
}
