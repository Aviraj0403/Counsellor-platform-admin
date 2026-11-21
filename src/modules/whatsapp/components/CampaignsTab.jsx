import { useEffect, useState } from 'react';
import { Badge, Button, Empty, Field, Input, Select, Table } from '../../../shared/ui/ui';
import * as api from '../api';

const AUDIENCES = [
  { value: 'leads', label: 'Leads Only' },
  { value: 'students', label: 'Enrolled Students Only' },
  { value: 'all', label: 'All Contacts (Leads + Students)' },
];

export default function CampaignsTab({ manage }) {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [err, setErr] = useState('');

  const [form, setForm] = useState({
    name: '',
    template: '',
    audience: 'leads',
    stage: '',
    city: '',
    course: '',
    paramMapping: 'name,course',
  });

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, tRes] = await Promise.all([api.listCampaigns(), api.listTemplates()]);
      setCampaigns(cRes.data.items || []);
      setTemplates(tRes.data.items || []);
      if (!form.template && tRes.data.items?.length) {
        setForm((f) => ({ ...f, template: tRes.data.items[0].name }));
      }
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const params = form.paramMapping.split(',').map((s) => s.trim()).filter(Boolean);
      await api.createCampaign({
        name: form.name,
        template: form.template,
        audience: form.audience,
        filters: {
          stage: form.stage || undefined,
          city: form.city || undefined,
          course: form.course || undefined,
        },
        paramMapping: params,
      });
      setShowCreate(false);
      setForm({
        name: '',
        template: templates[0]?.name || '',
        audience: 'leads',
        stage: '',
        city: '',
        course: '',
        paramMapping: 'name,course',
      });
      load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to create campaign');
    }
  };

  const handleExecute = async (id) => {
    if (!confirm('Start sending broadcast messages to the matching audience now?')) return;
    setRunningId(id);
    setErr('');
    try {
      await api.executeCampaign(id);
      await load();
    } catch (e) {
      setErr(e.response?.data?.message || 'Campaign execution failed');
    } finally {
      setRunningId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge tone="success">Completed</Badge>;
      case 'processing':
        return <Badge tone="warn">Processing...</Badge>;
      case 'failed':
        return <Badge tone="danger">Failed</Badge>;
      case 'scheduled':
        return <Badge tone="info">Scheduled</Badge>;
      default:
        return <Badge tone="neutral">Draft</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-fg">Broadcast Campaigns</h2>
          <p className="text-sm text-fg-muted">
            Blast targeted WhatsApp template messages to filtered leads or students with consent.
          </p>
        </div>
        {manage && (
          <Button variant="primary" onClick={() => setShowCreate(!showCreate)}>
            {showCreate ? 'Cancel' : 'New Broadcast'}
          </Button>
        )}
      </div>

      {err && <div className="rounded-md bg-rose-50 dark:bg-rose-500/10 p-3 text-sm text-rose-800 dark:text-rose-300">{err}</div>}

      {showCreate && (
        <form onSubmit={handleCreate} className="space-y-4 rounded-lg border border-line bg-surface p-4">
          <h3 className="font-medium text-fg">Launch WhatsApp Broadcast</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Campaign Name" required>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. B.Tech Spot Round Reminder"
                required
              />
            </Field>

            <Field label="WhatsApp Template" required>
              <Select
                value={form.template}
                onChange={(e) => setForm({ ...form, template: e.target.value })}
                required
              >
                {templates.map((t) => (
                  <option key={t._id} value={t.name}>
                    {t.name} ({t.language})
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Target Audience" required>
              <Select
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              >
                {AUDIENCES.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </Field>

            <Field label="Filter by City">
              <Input
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                placeholder="e.g. Pune, Mumbai (optional)"
              />
            </Field>

            <Field label="Filter by Course / Stream">
              <Input
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                placeholder="e.g. Computer Science (optional)"
              />
            </Field>

            <Field label="Template Parameters Mapping">
              <Input
                value={form.paramMapping}
                onChange={(e) => setForm({ ...form, paramMapping: e.target.value })}
                placeholder="comma-separated: name, course, city"
              />
            </Field>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Save Campaign
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-8 text-center text-sm text-fg-muted">Loading campaigns...</div>
      ) : campaigns.length === 0 ? (
        <Empty
          title="No WhatsApp campaigns yet"
          description="Create and launch targeted WhatsApp campaigns to engage your prospective students at scale."
        />
      ) : (
        <Table
          head={[
            'Campaign',
            'Audience',
            'Template',
            'Status',
            'Stats',
            'Created',
            'Actions',
          ]}
        >
          {campaigns.map((c) => (
              <tr key={c._id}>
                <td className="font-medium text-fg">{c.name}</td>
                <td className="capitalize text-fg-muted">{c.audience}</td>
                <td>
                  <span className="font-mono text-xs">{c.template}</span>
                </td>
                <td>{getStatusBadge(c.status)}</td>
                <td className="text-xs text-fg-muted">
                  {c.status === 'completed' ? (
                    <span>
                      <strong className="text-emerald-700 dark:text-emerald-300">{c.stats?.sent || 0}</strong> sent / {c.stats?.total || 0} total ({c.stats?.skippedNoConsent || 0} skipped)
                    </span>
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td className="text-xs text-fg-muted">
                  {new Date(c.createdAt).toLocaleDateString()}
                </td>
                <td className="text-right">
                  {manage && (c.status === 'draft' || c.status === 'scheduled') && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={runningId === c._id}
                      onClick={() => handleExecute(c._id)}
                    >
                      {runningId === c._id ? 'Dispatching...' : 'Send Now'}
                    </Button>
                  )}
                </td>
              </tr>
            ))}
        </Table>
      )}
    </div>
  );
}

