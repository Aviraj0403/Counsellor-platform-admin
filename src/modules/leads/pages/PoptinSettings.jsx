import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Sparkles, Globe, Eye, UserCheck, Code2, ExternalLink, Sliders } from 'lucide-react';
import { Badge, Button, Card, Field, Input, PageHeader, Spinner } from '../../../shared/ui/ui';
import { API_ORIGIN } from '../../../shared/api/apiConfig';
import { useAuth } from '../../auth';
import * as api from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';

export default function PoptinSettings() {
  const { organisation, can } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [domainsText, setDomainsText] = useState('');

  const slug = organisation?.slug || 'my-counsellor';
  const apiBase = API_ORIGIN;

  const embedCode = `<script src="${apiBase}/public/poptin/poptin-sdk.js" data-tenant-slug="${slug}" data-api-base="${apiBase}" async></script>`;

  useEffect(() => {
    let live = true;
    api
      .getPoptinConfig()
      .then((res) => {
        if (!live) return;
        setConfig(res.data);
        setDomainsText((res.data.allowedDomains || []).join(', '));
      })
      .catch(toastError)
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  const save = async (patch = {}) => {
    setSaving(true);
    try {
      const allowedDomains = domainsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const body = {
        ...config,
        ...patch,
        allowedDomains,
      };

      const res = await api.savePoptinConfig(body);
      setConfig(res.data);
      toast.success('Popup settings saved.');
    } catch (e) {
      toastError(e);
    } finally {
      setSaving(false);
    }
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success('Embed script copied to clipboard!');
  };

  if (loading || !config) return <Spinner />;

  const views = config.viewsCount || 0;
  const conversions = config.conversionsCount || 0;
  const rate = views > 0 ? ((conversions / views) * 100).toFixed(1) : '0.0';

  return (
    <>
      <PageHeader
        title="Lead Popups & Exit-Intent Engine"
        subtitle="Capture admission leads on your website with high-converting exit-intent modals and floating enquiry popups."
        action={
          can('leads:write') && (
            <Button
              variant={config.enabled ? 'danger' : 'primary'}
              loading={saving}
              onClick={() => save({ enabled: !config.enabled })}
            >
              {config.enabled ? 'Disable Popup' : 'Enable Popup Engine'}
            </Button>
          )
        }
      />

      {/* Analytics Metric Cards */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-600 dark:text-blue-300 rounded-xl">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <p className="text-caption">Total Impressions</p>
            <p className="text-2xl font-bold text-fg">{views.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 rounded-xl">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-caption">Leads Converted</p>
            <p className="text-2xl font-bold text-fg">{conversions.toLocaleString()}</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-300 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-caption">Conversion Rate</p>
            <p className="text-2xl font-bold text-fg">{rate}%</p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Settings Form */}
        <div className="space-y-6">
          <Card title="Popup Content & Trigger Behaviour">
            <div className="space-y-4">
              <Field label="Modal Headline">
                <Input
                  value={config.headline || ''}
                  onChange={(e) => setConfig({ ...config, headline: e.target.value })}
                  placeholder="e.g. Looking for Direct B.Tech Admission?"
                />
              </Field>

              <Field label="Modal Subheadline">
                <Input
                  value={config.subheadline || ''}
                  onChange={(e) => setConfig({ ...config, subheadline: e.target.value })}
                  placeholder="Brief value proposition for the student..."
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-line">
                <Field label="Button Text">
                  <Input
                    value={config.design?.buttonText || ''}
                    onChange={(e) =>
                      setConfig({ ...config, design: { ...config.design, buttonText: e.target.value } })
                    }
                  />
                </Field>
                <Field label="Button Colour">
                  <div className="flex gap-2">
                    <input
                      type="color"
                      className="h-10 w-12 rounded border border-line bg-transparent cursor-pointer"
                      value={config.design?.buttonColor || '#2563eb'}
                      onChange={(e) =>
                        setConfig({ ...config, design: { ...config.design, buttonColor: e.target.value } })
                      }
                    />
                    <Input
                      value={config.design?.buttonColor || '#2563eb'}
                      onChange={(e) =>
                        setConfig({ ...config, design: { ...config.design, buttonColor: e.target.value } })
                      }
                    />
                  </div>
                </Field>
              </div>

              <div className="pt-2 border-t border-line space-y-3">
                <p className="text-xs font-semibold text-fg-muted uppercase tracking-wider">Triggers</p>
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="accent-indigo-600 rounded"
                    checked={config.triggers?.exitIntent !== false}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        triggers: { ...config.triggers, exitIntent: e.target.checked },
                      })
                    }
                  />
                  <span>Trigger on Exit Intent (when mouse moves towards browser top / exit)</span>
                </label>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <Field label="Time Delay (seconds)" hint="0 = disabled">
                    <Input
                      type="number"
                      min={0}
                      max={120}
                      value={config.triggers?.timeDelaySeconds ?? 5}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          triggers: { ...config.triggers, timeDelaySeconds: Number(e.target.value) },
                        })
                      }
                    />
                  </Field>
                  <Field label="Scroll Depth (%)" hint="0 = disabled">
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={config.triggers?.scrollPercentage ?? 40}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          triggers: { ...config.triggers, scrollPercentage: Number(e.target.value) },
                        })
                      }
                    />
                  </Field>
                </div>
              </div>

              <Field
                label="Whitelisted Website Domains (Comma-separated)"
                hint="Domains allowed to display this popup (e.g. counsellingagency.com, admissions.org). Leave blank to allow any origin."
              >
                <div className="relative">
                  <Globe className="w-4 h-4 absolute left-3 top-3 text-fg-muted pointer-events-none" />
                  <Input
                    className="pl-9"
                    value={domainsText}
                    onChange={(e) => setDomainsText(e.target.value)}
                    placeholder="mycounsellingsite.com, directadmission.in"
                  />
                </div>
              </Field>

              {can('leads:write') && (
                <Button loading={saving} onClick={() => save()}>
                  Save changes
                </Button>
              )}
            </div>
          </Card>

          {/* Embed Script Box */}
          <Card title="Website Embed Code">
            <p className="text-xs text-fg-muted mb-3">
              Paste this one-line script snippet into the <code className="px-1.5 py-0.5 bg-surface-2 rounded text-fg font-mono">&lt;head&gt;</code> or footer of your admission landing page or agency website. Leads captured will automatically route into your leads pipeline with round-robin counsellor assignment.
            </p>
            <div className="bg-slate-900 text-slate-100 p-3.5 rounded-xl text-xs font-mono break-all flex items-center justify-between gap-3 border border-slate-800">
              <code>{embedCode}</code>
              <Button variant="secondary" onClick={copyEmbed} className="shrink-0 !py-1 text-xs">
                Copy
              </Button>
            </div>
          </Card>
        </div>

        {/* Live Interactive Preview */}
        <div>
          <Card title="Live Modal Preview">
            <div className="p-6 bg-slate-900/40 rounded-xl flex items-center justify-center min-h-[460px] border border-dashed border-line">
              <div
                className="w-full max-w-sm rounded-2xl p-6 shadow-2xl border"
                style={{
                  background: config.design?.backgroundColor || '#ffffff',
                  color: config.design?.textColor || '#0f172a',
                  borderColor: '#e2e8f0',
                }}
              >
                <div className="inline-block px-2.5 py-1 text-[10px] font-bold uppercase rounded-full tracking-wider mb-2" style={{ background: `${config.design?.buttonColor || '#2563eb'}18`, color: config.design?.buttonColor || '#2563eb' }}>
                  Admissions 2026 Guidance
                </div>
                <h4 className="text-lg font-extrabold mb-1.5 leading-snug">{config.headline}</h4>
                <p className="text-xs text-fg-muted mb-4 leading-relaxed">{config.subheadline}</p>

                <div className="space-y-2.5">
                  <input
                    readOnly
                    placeholder="Student Full Name *"
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-surface border-line text-fg placeholder:text-fg-muted"
                  />
                  <input
                    readOnly
                    placeholder="10-digit Mobile Number *"
                    className="w-full px-3 py-2 text-xs border rounded-lg bg-surface border-line text-fg placeholder:text-fg-muted"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      readOnly
                      placeholder="Branch (e.g. CSE)"
                      className="w-full px-3 py-2 text-xs border rounded-lg bg-surface border-line text-fg placeholder:text-fg-muted"
                    />
                    <input
                      readOnly
                      placeholder="City"
                      className="w-full px-3 py-2 text-xs border rounded-lg bg-surface border-line text-fg placeholder:text-fg-muted"
                    />
                  </div>
                  <button
                    disabled
                    className="w-full py-2.5 rounded-lg text-xs font-bold text-white shadow-md mt-1 cursor-default"
                    style={{ background: config.design?.buttonColor || '#2563eb' }}
                  >
                    {config.design?.buttonText || 'Get Free Counselling Call'}
                  </button>
                </div>
                <p className="text-[10px] text-center text-fg-muted mt-3">
                  🔒 Safe & Verified • Expert counsellor will call within 15 minutes
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}

