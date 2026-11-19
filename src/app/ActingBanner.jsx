import { LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../modules/auth';
import { useI18n } from '../shared/i18n/languageContext.js';
import { toastError } from '../shared/lib/AxiosToastError';
import { Badge, Button } from '../shared/ui/ui';
import OrgAvatar from '../shared/ui/OrgAvatar.jsx';

const HEX = /^#[0-9a-f]{6}$/i;

/**
 * Always-visible strip while platform staff work inside an organisation. It says whose admin this is, that the actions are
 * recorded, and gives one clear way back to the console. The brand colour is only a thin accent edge; text stays on theme tokens.
 */
export default function ActingBanner() {
  const { acting, organisation, actingStatus, stopActing } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  if (!acting) return null;

  const name = organisation?.name || acting.tenantName;
  const accent = HEX.test(organisation?.brandColor || '') ? organisation.brandColor : '';
  const exit = async () => {
    setBusy(true);
    try {
      await stopActing();
      navigate('/');
    } catch (e) {
      toastError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      role="region"
      aria-label={t('acting.region', 'Viewing an organisation')}
      className="surface-card mx-4 mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-l-4 border-brand-500 px-3 py-2 lg:mx-6"
      style={accent ? { borderLeftColor: accent } : undefined}
    >
      <OrgAvatar name={name} logoUrl={organisation?.logoUrl} brandColor={organisation?.brandColor} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] font-medium text-fg">
          <span className="truncate">{t('acting.viewing', 'Viewing {name} as platform support', { name })}</span>
          {actingStatus && actingStatus !== 'active' && <Badge tone="red">{t('acting.suspended', 'Suspended')}</Badge>}
        </p>
        <p className="text-caption flex items-center gap-1 !text-[11px]">
          <ShieldCheck size={12} aria-hidden="true" className="shrink-0" />
          {t('acting.audit', "Your actions here are recorded in this organisation's audit log.")}
        </p>
      </div>
      <Button size="sm" variant="secondary" onClick={exit} loading={busy} icon={LogOut}>
        {t('acting.exit', 'Exit to console')}
      </Button>
    </div>
  );
}
