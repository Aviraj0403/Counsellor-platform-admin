import { MessageCircle, ShieldCheck } from 'lucide-react';
import { Badge } from '../../../shared/ui/ui';

/**
 * Sticky strip at the top of the WhatsApp page. The platform runs ONE shared WhatsApp Business number for every organisation:
 * an organisation never enters WhatsApp credentials. There is no API call that reports the number's connection, so the live
 * line is derived from the latest messages the organisation sent (delivered = working, failed = show the reason).
 */
export default function StatusStrip({ latest }) {
  let tone = 'gray';
  let label = 'No messages sent yet';
  let detail = 'Send a template message to check that everything works.';
  if (latest) {
    if (latest.status === 'failed') {
      tone = 'red';
      label = 'Last message failed';
      detail = latest.error || 'WhatsApp could not send the last message.';
    } else {
      tone = 'green';
      label = 'Sending works';
      detail = `Latest message: ${latest.status}.`;
    }
  }
  return (
    <div className="surface-card sticky top-0 z-10 mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 p-3" role="status">
      <span className="tone-emerald tone-chip flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
        <MessageCircle size={18} aria-hidden="true" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-medium text-fg">
          Shared platform WhatsApp number
          <Badge tone={tone}>{label}</Badge>
        </p>
        <p className="text-caption !text-[11px]">
          <ShieldCheck size={12} aria-hidden="true" className="mr-1 inline align-[-2px]" />
          One shared number serves every organisation. You do not enter any WhatsApp credentials. {detail}
        </p>
      </div>
    </div>
  );
}
