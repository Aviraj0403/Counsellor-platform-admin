import { useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  Palette,
  Layers,
  Key,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { Badge, Button, Card, Field, Input, PageHeader, Select } from '../../../shared/ui/ui';
import { slugify } from '../../../shared/lib/format';
import * as platformApi from '../api';
import { useCatalog } from '../../catalog';

const STEPS = [
  { id: 'basics', label: 'Basics & Admin', icon: Building2, desc: 'Organisation details and owner login' },
  { id: 'branding', label: 'Branding & Theme', icon: Palette, desc: 'Logo URL and theme brand colour' },
  { id: 'modules', label: 'Modules & Features', icon: Layers, desc: 'Select initial active features' },
  { id: 'review', label: 'Review & Launch', icon: ShieldCheck, desc: 'Verify and create organisation' },
];

const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const array = new Uint32Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join('') + 'Aa1!';
};

export default function OnboardOrganisation() {
  const navigate = useNavigate();
  const catalog = useCatalog();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    slugTouched: false,
    ownerName: '',
    ownerEmail: '',
    ownerPassword: generatePassword(),
    logoUrl: '',
    brandColor: '#2563eb',
    modules: {
      leads: true,
      team: true,
      followups: true,
      students: true,
      colleges: true,
      applications: true,
      documents: true,
      reports: true,
      whatsapp: true,
      studentPortal: true,
      appointments: true,
    },
  });

  const setField = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      ...(field === 'name' && !prev.slugTouched ? { slug: slugify(value) } : {}),
    }));
  };

  const toggleModule = (modKey) => {
    setForm((prev) => ({
      ...prev,
      modules: {
        ...prev.modules,
        [modKey]: !prev.modules[modKey],
      },
    }));
  };

  const validateStep = (s) => {
    if (s === 0) {
      if (!form.name.trim()) return 'Organisation name is required';
      if (!form.slug.trim()) return 'Slug URL is required';
      if (!/^[a-z0-9-]{3,40}$/.test(form.slug)) return 'Slug must be 3-40 lowercase characters or hyphens';
      if (!form.ownerName.trim()) return 'Owner name is required';
      if (!form.ownerEmail.trim() || !form.ownerEmail.includes('@')) return 'Valid owner email is required';
      if (form.ownerPassword.length < 10) return 'Password must be at least 10 characters';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep(step);
    if (err) {
      toast.error(err);
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validateStep(0);
    if (err) {
      toast.error(err);
      setStep(0);
      return;
    }

    setBusy(true);
    try {
      // 1. Create tenant + owner in core
      const res = await platformApi.createTenant({
        name: form.name.trim(),
        slug: form.slug.trim(),
        ownerName: form.ownerName.trim(),
        ownerEmail: form.ownerEmail.trim(),
        ownerPassword: form.ownerPassword,
      });

      const tenantId = res.data.tenantId;

      // 2. Set branding if provided
      if (form.logoUrl.trim() || form.brandColor) {
        await platformApi.updateTenantBranding(tenantId, {
          logoUrl: form.logoUrl.trim() || undefined,
          brandColor: form.brandColor || undefined,
        }).catch(() => {});
      }

      // 3. Set initial module flags
      await platformApi.setTenantModules(tenantId, form.modules).catch(() => {});

      setCreated({
        tenantId,
        name: form.name,
        slug: form.slug,
        ownerEmail: form.ownerEmail,
        ownerPassword: form.ownerPassword,
      });
      toast.success(`Organisation ${form.name} onboarded successfully!`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to onboard organisation');
    } finally {
      setBusy(false);
    }
  };

  const copyCreds = () => {
    if (!created) return;
    const text = `Organisation: ${created.name}\nSlug: ${created.slug}\nOwner Login: ${created.ownerEmail}\nTemporary Password: ${created.ownerPassword}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied to clipboard!');
  };

  if (created) {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <Card className="border-t-4 border-t-emerald-600 p-6 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="mt-4 text-xl font-bold text-fg">Organisation Onboarded!</h2>
          <p className="mt-1 text-sm text-fg-muted">
            <strong className="text-fg">{created.name}</strong> is live with dedicated tenant database isolation.
          </p>

          <div className="my-6 rounded-lg border border-line bg-surface-2 p-4 text-left">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Owner Credentials</span>
              <Button size="xs" variant="secondary" onClick={copyCreds}>
                <Copy size={13} className="mr-1" /> Copy Login Info
              </Button>
            </div>
            <dl className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <dt className="text-fg-muted">Platform URL:</dt>
              <dd className="col-span-2 font-mono text-fg">/{created.slug}</dd>
              <dt className="text-fg-muted">Owner Email:</dt>
              <dd className="col-span-2 font-medium text-fg">{created.ownerEmail}</dd>
              <dt className="text-fg-muted">One-time Password:</dt>
              <dd className="col-span-2 font-mono font-bold text-brand-600">{created.ownerPassword}</dd>
            </dl>
          </div>

          <div className="flex justify-center gap-3">
            <Link to={`/organisations/${created.tenantId}`}>
              <Button variant="primary">Manage Organisation Workspace</Button>
            </Link>
            <Link to="/organisations">
              <Button variant="secondary">Back to Organisations</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader
          title="Onboard New Organisation"
          subtitle="Guided multi-tenant onboarding wizard for counselling agencies and institutions."
        />
        <Link to="/organisations">
          <Button variant="secondary" size="sm">Back to List</Button>
        </Link>
      </div>

      {/* Stepper Progress Bar */}
      <div className="grid grid-cols-4 gap-2">
        {STEPS.map((s, idx) => {
          const Icon = s.icon;
          const isDone = idx < step;
          const isCurrent = idx === step;
          return (
            <div
              key={s.id}
              onClick={() => {
                if (idx < step) setStep(idx);
              }}
              className={`flex items-center gap-2.5 rounded-lg border p-3 transition-colors ${
                isCurrent
                  ? 'border-brand-500 bg-brand-50/40 text-brand-700 shadow-sm'
                  : isDone
                  ? 'cursor-pointer border-emerald-300 bg-emerald-50/30 text-emerald-700'
                  : 'border-line bg-surface text-fg-muted opacity-60'
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  isCurrent
                    ? 'bg-brand-600 text-white'
                    : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-surface-2 text-fg-muted'
                }`}
              >
                {isDone ? <CheckCircle2 size={16} /> : idx + 1}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-semibold">{s.label}</p>
                <p className="truncate text-[10px] text-fg-muted">{s.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      <Card className="p-6">
        {/* Step 1: Basics & Owner */}
        {step === 0 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-fg">Organisation & Primary Admin Details</h3>
            <p className="text-sm text-fg-muted">
              Configure the business entity and primary owner account. A dedicated database <code className="text-xs">cp_t_&lt;tenantId&gt;</code> will be created.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Organisation Name" required>
                <Input
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  placeholder="e.g. Apex Overseas & Engineering Counsellors"
                  required
                />
              </Field>

              <Field label="URL Slug" hint="Unique subdomain identifier" required>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase(), slugTouched: true })}
                  placeholder="e.g. apex-counselling"
                  required
                />
              </Field>

              <Field label="Owner Full Name" required>
                <Input
                  value={form.ownerName}
                  onChange={(e) => setField('ownerName', e.target.value)}
                  placeholder="e.g. Rajesh Khurana"
                  required
                />
              </Field>

              <Field label="Owner Email Address" required>
                <Input
                  type="email"
                  value={form.ownerEmail}
                  onChange={(e) => setField('ownerEmail', e.target.value)}
                  placeholder="rajesh@apexcounselling.com"
                  required
                />
              </Field>

              <Field label="Initial Temporary Password" hint="Generated secure password" className="sm:col-span-2" required>
                <div className="flex gap-2">
                  <Input
                    value={form.ownerPassword}
                    onChange={(e) => setField('ownerPassword', e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setField('ownerPassword', generatePassword())}
                  >
                    Regenerate
                  </Button>
                </div>
              </Field>
            </div>
          </div>
        )}

        {/* Step 2: Branding */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-fg">White-Label Branding & Theme</h3>
            <p className="text-sm text-fg-muted">
              Customize the organisation logo and brand theme displayed to students and staff.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo URL (HTTPS)" hint="PNG, SVG or JPEG logo link">
                <Input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => setField('logoUrl', e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </Field>

              <Field label="Brand Accent Colour" hint="Hex code (#RRGGBB)">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={form.brandColor}
                    onChange={(e) => setField('brandColor', e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-line bg-transparent p-1"
                  />
                  <Input
                    value={form.brandColor}
                    onChange={(e) => setField('brandColor', e.target.value)}
                    placeholder="#2563eb"
                  />
                </div>
              </Field>
            </div>

            {/* Live Preview */}
            <div className="mt-4 rounded-lg border border-line bg-surface-2 p-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-fg-muted">Theme Preview</span>
              <div className="mt-3 flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold"
                  style={{ backgroundColor: form.brandColor }}
                >
                  {form.name ? form.name.slice(0, 2).toUpperCase() : 'CO'}
                </div>
                <div>
                  <h4 className="font-bold text-fg">{form.name || 'Sample Organisation'}</h4>
                  <p className="text-xs text-fg-muted">Powered by Counsellor Platform</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Modules */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-fg">Configure Active Modules</h3>
                <p className="text-sm text-fg-muted">
                  Enable the modules included in the client package. Modules can also be toggled anytime from Workspace.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(catalog?.modules || []).map((m) => {
                const isEnabled = m.core || form.modules[m.key];
                return (
                  <div
                    key={m.key}
                    onClick={() => {
                      if (!m.core) toggleModule(m.key);
                    }}
                    className={`flex flex-col justify-between rounded-lg border p-3.5 transition-all ${
                      m.core
                        ? 'border-line bg-surface-2 opacity-90 cursor-default'
                        : isEnabled
                        ? 'cursor-pointer border-brand-500 bg-brand-50/30'
                        : 'cursor-pointer border-line bg-surface hover:border-fg-muted'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-fg">{m.label}</span>
                        {m.core ? (
                          <Badge tone="blue">Core</Badge>
                        ) : isEnabled ? (
                          <Badge tone="success">Enabled</Badge>
                        ) : (
                          <Badge tone="neutral">Disabled</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-fg-muted line-clamp-2">{m.whatItDoes}</p>
                    </div>
                    {!m.core && (
                      <div className="mt-2 text-right">
                        <span className="text-xs font-medium text-brand-600">
                          {isEnabled ? 'Click to Disable' : 'Click to Enable'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-base font-semibold text-fg">Review & Confirm Onboarding</h3>
            <p className="text-sm text-fg-muted">
              Double check the organisation setup before provisioning database and admin account.
            </p>

            <div className="divide-y divide-line rounded-lg border border-line bg-surface-2">
              <div className="grid grid-cols-3 p-3 text-xs">
                <span className="text-fg-muted">Organisation Name:</span>
                <span className="col-span-2 font-semibold text-fg">{form.name}</span>
              </div>
              <div className="grid grid-cols-3 p-3 text-xs">
                <span className="text-fg-muted">Slug Address:</span>
                <span className="col-span-2 font-mono text-fg">{form.slug}</span>
              </div>
              <div className="grid grid-cols-3 p-3 text-xs">
                <span className="text-fg-muted">Owner Administrator:</span>
                <span className="col-span-2 font-semibold text-fg">{form.ownerName} ({form.ownerEmail})</span>
              </div>
              <div className="grid grid-cols-3 p-3 text-xs">
                <span className="text-fg-muted">Brand Colour:</span>
                <span className="col-span-2 flex items-center gap-2 font-mono text-fg">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: form.brandColor }} />
                  {form.brandColor}
                </span>
              </div>
              <div className="grid grid-cols-3 p-3 text-xs">
                <span className="text-fg-muted">Active Modules:</span>
                <div className="col-span-2 flex flex-wrap gap-1">
                  {Object.entries(form.modules)
                    .filter(([_, v]) => v)
                    .map(([k]) => (
                      <Badge key={k} tone="blue">{k}</Badge>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
            disabled={step === 0 || busy}
          >
            <ChevronLeft size={16} className="mr-1" /> Back
          </Button>

          {step < STEPS.length - 1 ? (
            <Button type="button" variant="primary" onClick={handleNext}>
              Next <ChevronRight size={16} className="ml-1" />
            </Button>
          ) : (
            <Button
              type="button"
              variant="primary"
              disabled={busy}
              onClick={handleSubmit}
            >
              {busy ? 'Provisioning Organisation...' : 'Create & Onboard Organisation'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
