import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Badge, Card, PageHeader, Select, Spinner } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { ActivityTimeline, TaskList } from '../../followups';
import { SendWhatsApp } from '../../whatsapp';
import * as leadsApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, humanize } from '../../../shared/lib/format';

const TONE = { new: 'blue', contacted: 'blue', qualified: 'amber', counselling_done: 'amber', application_started: 'amber', admitted: 'green', lost: 'red' };

export default function LeadDetail() {
  const { id } = useParams();
  const { can, hasModule } = useAuth();
  const [lead, setLead] = useState(null);
  const [failed, setFailed] = useState(false);
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    try {
      const { data } = await leadsApi.getLead(id);
      setLead(data);
    } catch (e) {
      setFailed(true);
      toastError(e);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const move = async (stage) => {
    try {
      await leadsApi.changeStage(id, stage);
      toast.success(`Moved to ${humanize(stage)}.`);
      await load();
      setTick((n) => n + 1); // the stage change adds a timeline entry
    } catch (e) {
      toastError(e);
    }
  };

  const back = <Link to="/leads" className="text-sm underline">Back to leads</Link>;
  if (failed) return <><PageHeader title="Lead" subtitle="This lead could not be opened. It may not exist or may not be assigned to you." action={back} /></>;
  if (!lead) return <Spinner />;

  const facts = [
    ['Phone', lead.phone],
    ['Email', lead.email],
    ['City', lead.city],
    ['Interested course', lead.interestedCourse],
    ['Source', humanize(lead.source?.channel)],
    ['Consent to contact', lead.consent?.given ? `Yes (${humanize(lead.consent.source || 'recorded')}) ${formatDate(lead.consent.at)}` : 'No'],
    ['Owner', lead.assignedTo ? 'Assigned' : 'Unassigned'],
    ['Added', formatDate(lead.createdAt)],
  ];
  const stages = [lead.stage, ...(lead.allowedNextStages || [])];
  const followups = hasModule('followups') && can('followups:read');
  const canFollow = can('followups:write');

  return (
    <>
      <PageHeader title={lead.name} subtitle="Lead details, stage, tasks and everything that happened with this student." action={<div className="flex flex-wrap items-center gap-2">{hasModule('whatsapp') && can('whatsapp:send') && <SendWhatsApp leadId={id} onSent={() => setTick((n) => n + 1)} />}{back}</div>} />
      <div className="grid gap-5 lg:grid-cols-3">
        <Card title="Lead" className="lg:col-span-1">
          <dl className="space-y-2 text-sm">
            {facts.filter(([, v]) => v).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3"><dt className="text-fg-muted">{k}</dt><dd className="text-right">{v}</dd></div>
            ))}
          </dl>
          <div className="mt-4 border-t border-line pt-4">
            <p className="label-gap mb-1 text-sm font-medium text-fg-secondary">Stage</p>
            {can('leads:write') && stages.length > 1 ? (
              <Select value={lead.stage} onChange={(e) => move(e.target.value)} aria-label="Move lead to stage">
                {stages.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
              </Select>
            ) : (
              <Badge tone={TONE[lead.stage]}>{humanize(lead.stage)}</Badge>
            )}
            <p className="mt-1 text-xs text-fg-muted">Stages move step by step. Only the allowed next steps are listed.</p>
          </div>
        </Card>
        <div className="space-y-5 lg:col-span-2">
          {followups ? (
            <>
              <Card title="Tasks"><TaskList entityType="lead" entityId={id} canWrite={canFollow} key={`t${tick}`} /></Card>
              <Card title="Activity"><ActivityTimeline entityType="lead" entityId={id} canWrite={canFollow} reloadKey={tick} /></Card>
            </>
          ) : (
            <Card title="Activity"><p className="text-sm text-fg-muted">Follow-ups are not switched on for your organisation or your role.</p></Card>
          )}
        </div>
      </div>
    </>
  );
}
