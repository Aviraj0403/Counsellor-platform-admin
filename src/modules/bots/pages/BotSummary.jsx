import { useEffect, useState } from 'react';
import { Card, PageHeader, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import { formatINR } from '../../../shared/lib/format';
import * as api from '../api';

const Stat = ({ label, value, hint }) => (
  <div className="rounded-xl border border-line p-4">
    <div className="text-xs text-fg-muted">{label}</div>
    <div className="mt-1 text-2xl font-semibold">{value}</div>
    {hint && <div className="mt-1 text-xs text-fg-muted">{hint}</div>}
  </div>
);

export default function BotSummary() {
  const { t } = useI18n();
  const [s, setS] = useState(null);
  useEffect(() => { api.getSummary().then(({ data }) => setS(data)).catch(toastError); }, []);
  if (!s) return <Spinner />;
  return (
    <div className="space-y-4">
      <PageHeader title={t('page.botSummary', 'Assistant results')} subtitle={`This month so far (${s.from} to ${s.to}).`} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Chats" value={s.conversations} hint={`${s.messages} student messages answered`} />
        <Stat label="Leads captured" value={s.leadsCaptured} />
        <Stat label="Appointments booked by the assistant" value={s.bookingsViaBot} hint={`${s.bookingRate}% of chats`} />
        <Stat label="Handed to a counsellor" value={s.handoffs} hint={`${s.handoffRate}% of chats`} />
      </div>
      <Card title="AI cost">
        <p className="text-sm">This period: <strong>{formatINR(s.costPaise)}</strong>. This month: <strong>{formatINR(s.monthCostPaise)}</strong>{s.monthlyBudgetPaise ? <> of your {formatINR(s.monthlyBudgetPaise)} limit</> : ' (no monthly limit set)'}.</p>
        <p className="mt-1 text-sm text-fg-muted">Today: {s.todayMessages} of {s.dailyMessageCap || 'unlimited'} messages. Model: {s.model}. {s.configured ? '' : 'The assistant is OFFLINE: no AI key is set on the server.'}</p>
      </Card>
      <p className="text-xs text-fg-muted">{s.note}</p>
    </div>
  );
}
