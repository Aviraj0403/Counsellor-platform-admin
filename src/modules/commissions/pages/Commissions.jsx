import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as api from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, formatINR, humanize, rupeesToPaise } from '../../../shared/lib/format';

const TONE = { accrued: 'amber', collected: 'green', reversed: 'gray' };
const LIMIT = 25;
const bpsToPct = (b) => String((b || 0) / 100);
const pctToBps = (t) => {
  const s = String(t).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(Number(s) * 100);
};

/** One small modal that asks for a single text value (reference / reason). */
function Ask({ title, label, hint, onClose, onSubmit, confirmLabel = 'Confirm' }) {
  const [v, setV] = useState('');
  const [busy, setBusy] = useState(false);
  return (
    <Modal title={title} onClose={onClose}>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          try {
            await onSubmit(v.trim());
          } finally {
            setBusy(false);
          }
        }}
      >
        <Field label={label} hint={hint}><Input value={v} onChange={(e) => setV(e.target.value)} maxLength={500} /></Field>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>{confirmLabel}</Button>
        </div>
      </form>
    </Modal>
  );
}

function RuleForm({ rule, colleges, onClose, onSaved }) {
  const [f, setF] = useState(
    rule
      ? { collegeId: rule.collegeId, mode: rule.mode, percent: bpsToPct(rule.percentBps), flat: String((rule.flatPaise || 0) / 100), trigger: rule.trigger, share: bpsToPct(rule.counsellorShareBps), active: rule.active !== false }
      : { collegeId: '', mode: 'percent_of_fee', percent: '', flat: '', trigger: 'admitted', share: '0', active: true },
  );
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const body = { mode: f.mode, trigger: f.trigger, active: f.active, counsellorShareBps: pctToBps(f.share) };
    if (Number.isNaN(body.counsellorShareBps) || body.counsellorShareBps > 10000) return toast.error('Counsellor share must be a percentage between 0 and 100.');
    if (f.mode === 'percent_of_fee') {
      body.percentBps = pctToBps(f.percent);
      if (Number.isNaN(body.percentBps) || body.percentBps <= 0) return toast.error('Enter the commission percentage, for example 10 or 7.5.');
    }
    if (f.mode === 'flat') {
      body.flatPaise = rupeesToPaise(f.flat);
      if (Number.isNaN(body.flatPaise) || body.flatPaise <= 0) return toast.error('Enter the flat amount in rupees.');
    }
    if (!rule && !f.collegeId) return toast.error('Choose a college.');
    setBusy(true);
    try {
      if (rule) await api.updateRule(rule._id, body);
      else await api.createRule({ collegeId: f.collegeId, ...body });
      toast.success('Rule saved.');
      onSaved();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={rule ? `Edit rule: ${rule.collegeName || 'college'}` : 'New commission rule'} onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        {!rule && (
          <Field label="College">
            <Select value={f.collegeId} onChange={(e) => setF({ ...f, collegeId: e.target.value })}>
              <option value="">Choose a college</option>
              {colleges.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </Select>
          </Field>
        )}
        <Field label="How the college pays us">
          <Select value={f.mode} onChange={(e) => setF({ ...f, mode: e.target.value })}>
            <option value="percent_of_fee">Percentage of the fee paid</option>
            <option value="flat">Flat amount per admission</option>
            <option value="none">No commission</option>
          </Select>
        </Field>
        {f.mode === 'percent_of_fee' && <Field label="Commission (% of fee paid)"><Input inputMode="decimal" value={f.percent} onChange={(e) => setF({ ...f, percent: e.target.value })} /></Field>}
        {f.mode === 'flat' && <Field label="Flat commission (rupees)"><Input inputMode="decimal" value={f.flat} onChange={(e) => setF({ ...f, flat: e.target.value })} /></Field>}
        <Field label="Earned when the application is" hint="The commission is recorded once, at this status.">
          <Select value={f.trigger} onChange={(e) => setF({ ...f, trigger: e.target.value })}>
            <option value="fee_paid">Fee paid</option>
            <option value="admitted">Admitted</option>
          </Select>
        </Field>
        <Field label="Counsellor's share (%)" hint="The rest is the organisation's income."><Input inputMode="decimal" value={f.share} onChange={(e) => setF({ ...f, share: e.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="accent-indigo-600" checked={f.active} onChange={(e) => setF({ ...f, active: e.target.checked })} />
          Rule is active
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={busy}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function Commissions() {
  const { can } = useAuth();
  const manage = can('commissions:manage');
  const [tab, setTab] = useState('accruals');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [acc, setAcc] = useState(null);
  const [summary, setSummary] = useState(null);
  const [rules, setRules] = useState(null);
  const [colleges, setColleges] = useState([]);
  const [ruleForm, setRuleForm] = useState(null); // {} = new rule, or the rule being edited
  const [ask, setAsk] = useState(null); // { kind, row }
  const [pay, setPay] = useState(null); // { row, amount, reference }
  const [busy, setBusy] = useState(false);

  const loadAcc = useCallback(async () => {
    try {
      const { data } = await api.listAccruals({ page, limit: LIMIT, ...(status && { status }) });
      setAcc(data);
    } catch (e) {
      toastError(e);
    }
  }, [page, status]);
  const loadSummary = useCallback(() => api.getSummary().then(({ data }) => setSummary(data.items)).catch(toastError), []);
  const loadRules = useCallback(() => api.listRules().then(({ data }) => setRules(data)).catch(toastError), []);

  useEffect(() => {
    loadAcc();
  }, [loadAcc]);
  useEffect(() => {
    loadSummary();
    loadRules();
  }, [loadSummary, loadRules]);
  useEffect(() => {
    api.listColleges().then(({ data }) => setColleges(data.items)).catch(() => {});
  }, []);

  const refresh = () => {
    loadAcc();
    loadSummary();
  };

  const doAsk = async (text) => {
    try {
      if (ask.kind === 'collect') await api.collect(ask.row._id, { reference: text });
      else await api.reverse(ask.row._id, { reason: text });
      toast.success(ask.kind === 'collect' ? 'Marked as collected.' : 'Commission reversed.');
      setAsk(null);
      refresh();
    } catch (e) {
      toastError(e);
    }
  };

  const doPay = async (e) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(pay.amount);
    if (Number.isNaN(amountPaise) || amountPaise <= 0) return toast.error('Enter the amount in rupees, for example 2500 or 2500.50.');
    setBusy(true);
    try {
      await api.payout({ counsellorId: pay.row.counsellorId, amountPaise, reference: pay.reference.trim() });
      toast.success('Payout recorded.');
      setPay(null);
      refresh();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const removeRule = async (r) => {
    try {
      await api.deleteRule(r._id);
      toast.success('Rule removed.');
      loadRules();
    } catch (e) {
      toastError(e);
    }
  };

  const tabBtn = (k, label) => <Button key={k} variant={tab === k ? 'primary' : 'secondary'} size="sm" onClick={() => setTab(k)}>{label}</Button>;
  const modeText = (r) => (r.mode === 'percent_of_fee' ? `${bpsToPct(r.percentBps)}% of fee paid` : r.mode === 'flat' ? `${formatINR(r.flatPaise)} flat` : 'No commission');

  return (
    <>
      <PageHeader
        title="Commissions"
        subtitle="What colleges owe us, what counsellors have earned, and what is still to be paid out."
        action={manage && <Button onClick={() => { setTab('rules'); setRuleForm({}); }}>+ Commission rule</Button>}
      />
      <div className="mb-4 flex gap-2">
        {tabBtn('accruals', 'Commissions')}
        {tabBtn('summary', 'Per counsellor')}
        {tabBtn('rules', 'Rules by college')}
      </div>

      {tab === 'accruals' && (
        <Card>
          <div className="mb-4 w-48">
            <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
              <option value="">All</option>
              <option value="accrued">Waiting for college</option>
              <option value="collected">Collected</option>
              <option value="reversed">Reversed</option>
            </Select>
          </div>
          {!acc ? (
            <Spinner />
          ) : acc.items.length === 0 ? (
            <Empty>No commissions yet. They appear when an application reaches the status set in a college's rule.</Empty>
          ) : (
            <>
              <Table head={['College', 'Counsellor', 'Total', 'Counsellor share', 'Organisation share', 'Status', 'Date', 'Actions']}>
                {acc.items.map((r) => (
                  <tr key={r._id}>
                    <td className="px-3 py-2.5 font-medium">{r.collegeName}</td>
                    <td className="px-3 py-2.5 text-fg-secondary">{r.counsellorName || ','}</td>
                    <td className="px-3 py-2.5">{formatINR(r.totalPaise)}</td>
                    <td className="px-3 py-2.5">{formatINR(r.counsellorSharePaise)}</td>
                    <td className="px-3 py-2.5">{formatINR(r.organisationSharePaise)}</td>
                    <td className="px-3 py-2.5"><Badge tone={TONE[r.status]}>{humanize(r.status)}</Badge></td>
                    <td className="px-3 py-2.5 text-fg-muted">{formatDate(r.createdAt)}</td>
                    <td className="px-3 py-2.5">
                      {manage && r.status !== 'reversed' && (
                        <div className="flex gap-2">
                          {r.status === 'accrued' && <Button size="sm" variant="secondary" onClick={() => setAsk({ kind: 'collect', row: r })}>Collect</Button>}
                          <Button size="sm" variant="ghost" onClick={() => setAsk({ kind: 'reverse', row: r })}>Reverse</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </Table>
              <Pager page={acc.page} limit={acc.limit} total={acc.total} onPage={setPage} />
            </>
          )}
        </Card>
      )}

      {tab === 'summary' && (
        <Card>
          {!summary ? (
            <Spinner />
          ) : summary.length === 0 ? (
            <Empty>No counsellor has earned a commission yet.</Empty>
          ) : (
            <Table head={['Counsellor', 'Commissions', 'Earned', 'Paid out', 'Payable now', 'Actions']}>
              {summary.map((s) => (
                <tr key={s.counsellorId}>
                  <td className="px-3 py-2.5 font-medium">{s.counsellorName || s.counsellorId}</td>
                  <td className="px-3 py-2.5">{s.accrualCount}</td>
                  <td className="px-3 py-2.5">{formatINR(s.accruedPaise)}</td>
                  <td className="px-3 py-2.5">{formatINR(s.paidPaise)}</td>
                  <td className="px-3 py-2.5 font-medium">{formatINR(s.payablePaise)}</td>
                  <td className="px-3 py-2.5">
                    {manage && s.payablePaise > 0 && <Button size="sm" onClick={() => setPay({ row: s, amount: String(s.payablePaise / 100), reference: '' })}>Pay out</Button>}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {tab === 'rules' && (
        <Card>
          {!rules ? (
            <Spinner />
          ) : rules.length === 0 ? (
            <Empty>No rules yet. Add one per college to start earning commission automatically.</Empty>
          ) : (
            <Table head={['College', 'Commission', 'Earned when', 'Counsellor share', 'Status', 'Actions']}>
              {rules.map((r) => (
                <tr key={r._id}>
                  <td className="px-3 py-2.5 font-medium">{r.collegeName || r.collegeId}</td>
                  <td className="px-3 py-2.5">{modeText(r)}</td>
                  <td className="px-3 py-2.5 text-fg-secondary">{humanize(r.trigger)}</td>
                  <td className="px-3 py-2.5">{bpsToPct(r.counsellorShareBps)}%</td>
                  <td className="px-3 py-2.5"><Badge tone={r.active ? 'green' : 'gray'}>{r.active ? 'Active' : 'Off'}</Badge></td>
                  <td className="px-3 py-2.5">
                    {manage && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setRuleForm(r)}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => removeRule(r)}>Remove</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      )}

      {ruleForm && (
        <RuleForm
          rule={ruleForm._id ? ruleForm : null}
          colleges={colleges}
          onClose={() => setRuleForm(null)}
          onSaved={() => {
            setRuleForm(null);
            loadRules();
          }}
        />
      )}
      {ask && (
        <Ask
          title={ask.kind === 'collect' ? 'Mark as collected from the college' : 'Reverse this commission'}
          label={ask.kind === 'collect' ? 'Payment reference (cheque / UTR)' : 'Reason'}
          hint={ask.kind === 'reverse' ? 'The ledger entries are reversed. This cannot be undone.' : undefined}
          confirmLabel={ask.kind === 'collect' ? 'Mark collected' : 'Reverse'}
          onClose={() => setAsk(null)}
          onSubmit={doAsk}
        />
      )}
      {pay && (
        <Modal title={`Pay out: ${pay.row.counsellorName || 'counsellor'}`} onClose={() => setPay(null)}>
          <form onSubmit={doPay} className="space-y-3">
            <Field label="Amount (rupees)" hint={`Payable now: ${formatINR(pay.row.payablePaise)}`}>
              <Input inputMode="decimal" value={pay.amount} onChange={(e) => setPay({ ...pay, amount: e.target.value })} />
            </Field>
            <Field label="Payment reference (UTR / cheque)" hint="Using the same reference twice will not pay twice.">
              <Input value={pay.reference} onChange={(e) => setPay({ ...pay, reference: e.target.value })} />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setPay(null)}>Cancel</Button>
              <Button type="submit" loading={busy} disabled={pay.reference.trim().length < 2}>Record payout</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
