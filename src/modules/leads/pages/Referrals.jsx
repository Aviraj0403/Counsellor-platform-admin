import { useEffect, useState } from 'react';
import { Badge, Button, Card, Empty, Field, Input, PageHeader, Select, Table } from '../../../shared/ui/ui';
import Axios from '../../../shared/api/Axios';

export default function Referrals() {
  const [referrals, setReferrals] = useState([]);
  const [config, setConfig] = useState({ enabled: true, rewardAmountRupees: 2000, rewardDescription: '' });
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        Axios.get('/leads/referrals', { params: { status: statusFilter || undefined } }),
        Axios.get('/leads/referrals/config'),
      ]);
      setReferrals(rRes.data.items || []);
      setConfig(cRes.data || { enabled: true, rewardAmountRupees: 2000 });
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to load referral data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [statusFilter]);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    setErr('');
    try {
      await Axios.put('/leads/referrals/config', {
        enabled: config.enabled,
        rewardAmountRupees: Number(config.rewardAmountRupees),
        rewardDescription: config.rewardDescription,
      });
      alert('Referral program settings updated');
    } catch (e) {
      setErr(e.response?.data?.message || 'Failed to save settings');
    } finally {
      setSavingConfig(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await Axios.patch(`/leads/referrals/${id}/status`, { status });
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update referral');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'rewarded':
        return <Badge tone="success">Rewarded</Badge>;
      case 'enrolled':
        return <Badge tone="info">Enrolled</Badge>;
      case 'rejected':
        return <Badge tone="danger">Rejected</Badge>;
      default:
        return <Badge tone="neutral">Pending</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Student Referral Program"
        subtitle="Track student referrals, measure viral word-of-mouth admissions, and disburse rewards."
      />

      {err && <div className="rounded-md bg-rose-50 p-3 text-sm text-rose-800">{err}</div>}

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <h3 className="font-medium text-fg">Program Configuration</h3>
            <label className="flex items-center gap-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
              />
              Enable Referral Program
            </label>

            <Field label="Reward Amount (₹)" required>
              <Input
                type="number"
                min="0"
                value={config.rewardAmountRupees}
                onChange={(e) => setConfig({ ...config, rewardAmountRupees: e.target.value })}
                required
              />
            </Field>

            <Field label="Reward Description">
              <Input
                value={config.rewardDescription || ''}
                onChange={(e) => setConfig({ ...config, rewardDescription: e.target.value })}
                placeholder="e.g. ₹2,000 Amazon Gift Card"
              />
            </Field>

            <Button type="submit" variant="primary" disabled={savingConfig}>
              {savingConfig ? 'Saving...' : 'Save Settings'}
            </Button>
          </form>
        </Card>

        <Card className="md:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-medium text-fg">Referral Tracker</h3>
            <div className="w-48">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="enrolled">Enrolled</option>
                <option value="rewarded">Rewarded</option>
                <option value="rejected">Rejected</option>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-fg-muted">Loading referrals...</div>
          ) : referrals.length === 0 ? (
            <Empty
              title="No referrals recorded yet"
              description="When students share their referral link with prospective friends and family, referrals will appear here."
            />
          ) : (
            <Table
              head={[
                'Referrer (Student)',
                'Referred Contact',
                'Code',
                'Status',
                'Reward',
                'Action',
              ]}
            >
              {referrals.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="font-medium text-fg">{r.referrerName}</div>
                      <div className="text-xs text-fg-muted">{r.referrerPhone}</div>
                    </td>
                    <td>
                      <div className="font-medium text-fg">{r.referredName}</div>
                      <div className="text-xs text-fg-muted">{r.referredPhone}</div>
                    </td>
                    <td>
                      <span className="font-mono text-xs">{r.referralCode}</span>
                    </td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td className="text-sm font-medium text-emerald-700">₹{r.rewardAmountRupees}</td>
                    <td className="text-right space-x-1">
                      {r.status === 'pending' && (
                        <Button size="xs" variant="secondary" onClick={() => handleUpdateStatus(r._id, 'enrolled')}>
                          Mark Enrolled
                        </Button>
                      )}
                      {r.status === 'enrolled' && (
                        <Button size="xs" variant="primary" onClick={() => handleUpdateStatus(r._id, 'rewarded')}>
                          Mark Rewarded
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

