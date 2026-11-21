import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  Globe,
  Share2,
  Copy,
  Check,
  Code,
  Zap,
  Radio,
  ExternalLink,
  MessageSquare,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Sliders,
  PhoneCall,
} from 'lucide-react';
import { Badge, Button, Card, Field, Input, PageHeader } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';

export default function LeadSourcesHub() {
  const { organisation, acting } = useAuth();
  const [copiedKey, setCopiedKey] = useState(null);

  const slug = organisation?.slug || acting?.tenantName?.toLowerCase().replace(/\s+/g, '-') || 'demo-counsellor';
  const apiBase = window.location.origin;

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const universalWebhookUrl = `${apiBase}/public/leads/webhook/${slug}`;
  const predictorUrl = `${apiBase}/public/predict/${slug}`;
  const poptinSdkSnippet = `<script async src="${apiBase}/public/poptin/poptin-sdk.js" data-counsellor="${slug}"></script>`;

  return (
    <>
      <PageHeader
        title="Lead Inflow & Acquisition Hub"
        subtitle="Every channel that feeds live, high-intent prospective students into your counselling team. All sources auto-assign to counsellors and verify consent."
      />

      {/* Overview Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Real-time Inbound</span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-bold text-fg">Active</div>
          <p className="text-caption mt-1">Webhooks & public capture listening</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-purple-600">Cutoff Predictor</div>
          <div className="mt-2 text-2xl font-bold text-purple-700">Viral Magnet</div>
          <p className="text-caption mt-1">Students checking JEE / CET cutoffs</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Lead Portals & Ads</div>
          <div className="mt-2 text-2xl font-bold text-blue-700">Universal API</div>
          <p className="text-caption mt-1">Justdial, Meta Ads, Google Ads</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-600">DPDP & TRAI Safe</div>
          <div className="mt-2 text-2xl font-bold text-emerald-700">100% Consent</div>
          <p className="text-caption mt-1">Zero spam ban risk on WhatsApp</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Source 1: Universal Inbound Webhook (Justdial, Sulekha, Google Ads, Zapier) */}
        <Card
          title="1. Universal Inbound Webhook (Justdial, Meta Ads, Sulekha, Portals)"
          action={<Badge tone="blue">Instant Inflow</Badge>}
        >
          <p className="text-sm text-fg-muted mb-4">
            Connect your paid lead portals (Justdial, Sulekha, Shiksha, CollegeDekho) or ad forms (Meta Lead Ads, Google Ads, Zapier, Make). Any JSON POST to this URL instantly creates a lead and notifies your counsellors.
          </p>

          <div className="rounded-xl bg-surface-2 p-3 border border-line mb-4">
            <div className="text-xs font-semibold text-fg-muted mb-1">YOUR UNIQUE WEBHOOK URL:</div>
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono font-medium text-brand-600 break-all">
                {universalWebhookUrl}
              </code>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(universalWebhookUrl, 'webhook')}
                className="shrink-0"
              >
                {copiedKey === 'webhook' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedKey === 'webhook' ? 'Copied' : 'Copy URL'}
              </Button>
            </div>
          </div>

          <div className="rounded-xl border border-line p-3 bg-surface text-xs space-y-1.5 font-mono text-fg-muted">
            <div className="font-semibold text-fg">Sample JSON Payload:</div>
            <pre className="overflow-x-auto text-[11px] text-fg-secondary">
{`{
  "name": "Rohan Gupta",
  "phone": "+919820011223",
  "email": "rohan@gmail.com",
  "city": "Pune",
  "course": "B.Tech Computer Science",
  "channel": "justdial" // or "meta_ads", "google_ads", "sulekha"
}`}
            </pre>
          </div>
        </Card>

        {/* Source 2: B.Tech College Predictor Public Link */}
        <Card
          title="2. College Predictor & Cutoff Engine (High Organic Viral Search)"
          action={<Badge tone="green">Highest Intent</Badge>}
        >
          <p className="text-sm text-fg-muted mb-3">
            Students searching for <i>"coep cutoff 2026"</i> or <i>"which college at 91 percentile"</i> find this tool. They enter their rank/percentile and submit their phone number to unlock the detailed recommendation report.
          </p>

          <div className="flex flex-wrap items-center gap-2 mb-3">
            <a
              href={predictorUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-purple-700"
            >
              <ExternalLink size={14} /> Open Public Predictor Link
            </a>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => copyToClipboard(predictorUrl, 'predictor')}
            >
              {copiedKey === 'predictor' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              {copiedKey === 'predictor' ? 'Copied Link' : 'Copy Student Share Link'}
            </Button>
          </div>

          <p className="text-xs text-fg-muted">
            Tip: Share this link in your Instagram bio, YouTube video descriptions, and WhatsApp groups on exam result days.
          </p>
        </Card>

        {/* Source 3: Website Exit-Intent Popup (Poptin) */}
        <Card
          title="3. Website Exit-Intent & Delay Popup"
          action={<Badge tone="blue">Conversion Optimizer</Badge>}
        >
          <p className="text-sm text-fg-muted mb-3">
            Paste this 1-line script on your agency’s website or landing page. When a student tries to close the tab or spends 10 seconds reading, a high-converting admission enquiry modal appears.
          </p>

          <div className="rounded-xl bg-surface-2 p-3 border border-line">
            <div className="flex items-center justify-between gap-2">
              <code className="text-xs font-mono font-medium text-fg break-all">
                {poptinSdkSnippet}
              </code>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => copyToClipboard(poptinSdkSnippet, 'poptin')}
                className="shrink-0"
              >
                {copiedKey === 'poptin' ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                {copiedKey === 'poptin' ? 'Copied' : 'Copy Script'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Source 4: Missed Call & WhatsApp Poster QR Code */}
        <Card
          title="4. Standees, Offline Posters & Missed-Call Inflow"
          action={<Badge tone="purple">Offline to Online</Badge>}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-line p-4 bg-surface-2/40">
              <div className="flex items-center gap-2 mb-2 font-semibold text-fg text-sm">
                <QrCode size={18} className="text-brand-600" />
                WhatsApp Direct Chat QR
              </div>
              <p className="text-xs text-fg-muted mb-3">
                Print this on college fair standees and coaching noticeboards. Students scan and say "Hi" on WhatsApp to immediately receive cutoff brochures and trigger counsellor auto-assignment.
              </p>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(`https://wa.me/?text=Hi%2C%20I%20want%20admission%20guidance%20for%20B.Tech`, 'waLink')}
                >
                  {copiedKey === 'waLink' ? 'Copied!' : 'Copy WhatsApp QR Link'}
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-line p-4 bg-surface-2/40">
              <div className="flex items-center gap-2 mb-2 font-semibold text-fg text-sm">
                <PhoneCall size={18} className="text-emerald-600" />
                Missed-Call Campaign Setup
              </div>
              <p className="text-xs text-fg-muted mb-3">
                Print on newspaper flyers: <i>"Give a missed call to get cutoff list on WhatsApp"</i>. Integrate your virtual number (Exotel / Tata Tele / Twilio) to our webhook.
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                ⚡ Auto-replies with PDF Brochure via WhatsApp
              </span>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}

