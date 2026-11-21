import { Check, ExternalLink } from 'lucide-react';
import { Card } from '../../../shared/ui/ui';

const link = 'inline-flex items-center gap-1 font-medium text-brand-600 hover:underline dark:text-brand-300';

/** Four-step Meta connection guide. Each step ticks itself from the saved configuration, so the page doubles as a progress check. */
export default function MetaSetupGuide({ cfg, events }) {
  const sentOk = (events || []).some((e) => e.status === 'sent');
  const steps = [
    {
      title: 'Create the Meta app and Pixel',
      done: !!cfg.pixelId,
      body: (
        <>
          In <a className={link} href="https://business.facebook.com/events_manager" target="_blank" rel="noreferrer">Events Manager <ExternalLink size={12} /></a> create or open your Pixel (dataset) and copy its ID. For lead ads also create an app at{' '}
          <a className={link} href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">Meta for Developers <ExternalLink size={12} /></a> with the Marketing API and Webhooks products.
        </>
      ),
    },
    {
      title: 'Generate a long-lived access token',
      done: !!cfg.tokenSet,
      body: <>In Business Settings, System users, create a system user, give it your Pixel/ad account and Page, and generate a token with <b>ads_management</b> and <b>leads_retrieval</b>. Paste it in the form below; it is stored encrypted.</>,
    },
    {
      title: 'Add the lead-ads webhook',
      done: !!cfg.appSecretConfigured && !!cfg.pageId,
      body: <>In your app, Webhooks, choose <b>Page</b>, subscribe to <b>leadgen</b>, and paste the Callback URL and Verify token shown in the Lead ads webhook card. Enter your Facebook Page ID below. {!cfg.appSecretConfigured && <span className="text-amber-700 dark:text-amber-300">The server still needs META_APP_SECRET (ask your administrator).</span>}</>,
    },
    {
      title: 'Switch on and send a test event',
      done: !!cfg.enabled && sentOk,
      body: <>Add the Test event code from Events Manager, press <b>Save and switch on</b>, then <b>Send test event</b>. A green “sent” row in Last events means Meta is receiving your conversions.</>,
    },
  ];
  const done = steps.filter((s) => s.done).length;
  const firstOpen = steps.findIndex((s) => !s.done);

  return (
    <Card title="Connect Meta in 4 steps" action={<span className="text-caption tabular-nums">{done} / {steps.length} done</span>} className="mb-4">
      <ol className="grid gap-4 md:grid-cols-2">
        {steps.map((s, i) => (
          <li key={s.title} className={`flex gap-3 rounded-xl border p-3.5 ${i === firstOpen ? 'border-[color-mix(in_srgb,var(--brand-500)_45%,var(--line))] bg-[color-mix(in_srgb,var(--brand-500)_5%,transparent)]' : 'border-line'}`}>
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${s.done ? 'bg-emerald-500 text-white' : i === firstOpen ? 'brand-gradient text-white' : 'bg-surface-2 text-fg-muted ring-1 ring-inset ring-line'}`}>
              {s.done ? <Check size={14} strokeWidth={3} /> : i + 1}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-fg">{s.title}</p>
              <p className="text-caption mt-1 leading-relaxed">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Card>
  );
}
