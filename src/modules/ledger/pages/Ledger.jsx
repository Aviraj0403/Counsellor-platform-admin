import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as ledgerApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, formatINR, rupeesToPaise } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const KINDS = [
  ['bank', 'Bank / cash'],
  ['student', 'Student'],
  ['college', 'College'],
  ['counsellor', 'Counsellor'],
  ['platform', 'Platform / company'],
  ['tax', 'Tax (GST)'],
];
const LIMIT = 20;
const newKey = () => crypto.randomUUID();
const blank = () => ({ fromKind: 'student', fromId: '', toKind: 'bank', toId: 'main', amount: '', reference: '', description: '', key: newKey() });

/**
 * Plain-language ledger. Every posting moves money FROM one account TO another, so debits always equal credits.
 * Entries are never edited: a mistake is fixed with a reversal, so the history stays honest.
 */
export default function Ledger() {
  const { t } = useI18n();
  const { can } = useAuth();
  const [tb, setTb] = useState(null);
  const [page, setPage] = useState(1);
  const [account, setAccount] = useState('');
  const [list, setList] = useState(null);
  const [form, setForm] = useState(null);
  const [reversing, setReversing] = useState(null); // { id, reference, reason, key }
  const [busy, setBusy] = useState(false);
  const canPost = can('ledger:post');

  const loadTb = useCallback(async () => {
    try {
      setTb((await ledgerApi.trialBalance()).data);
    } catch (e) {
      toastError(e);
    }
  }, []);

  const loadList = useCallback(async () => {
    try {
      setList((await ledgerApi.entries({ page, limit: LIMIT, ...(account && { account }) })).data);
    } catch (e) {
      toastError(e);
    }
  }, [page, account]);

  useEffect(() => {
    loadTb();
  }, [loadTb]);
  useEffect(() => {
    loadList();
  }, [loadList]);

  const refresh = () => {
    loadTb();
    loadList();
  };

  const post = async (e) => {
    e.preventDefault();
    const amountPaise = rupeesToPaise(form.amount);
    if (Number.isNaN(amountPaise) || amountPaise < 1) return toast.error('Enter the amount in rupees, like 5000 or 5000.50.');
    const from = `${form.fromKind}:${form.fromId.trim()}`;
    const to = `${form.toKind}:${form.toId.trim()}`;
    if (from === to) return toast.error('From and To must be different accounts.');
    setBusy(true);
    try {
      // credit = money leaves "from", debit = money arrives in "to"
      const lines = [{ account: to, debit: amountPaise, credit: 0 }, { account: from, debit: 0, credit: amountPaise }];
      const { data } = await ledgerApi.postEntry({ idempotencyKey: form.key, reference: form.reference, description: form.description || undefined, lines });
      toast.success(data.replayed ? 'This entry was already posted, nothing duplicated.' : 'Entry posted.');
      setForm(null);
      setPage(1);
      refresh();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const reverse = async (e) => {
    e.preventDefault();
    try {
      await ledgerApi.reverseEntry(reversing.id, reversing.key, reversing.reason);
      toast.success('Reversal posted.');
      setReversing(null);
      refresh();
    } catch (err) {
      toastError(err);
    }
  };

  const idHint = { bank: 'main', student: 'student id or name', college: 'college id', counsellor: 'user id', platform: 'revenue', tax: 'gst' };

  const AccountPicker = ({ label, kindKey, idKey }) => (
    <div className="grid grid-cols-2 gap-2">
      <Field label={label}>
        <Select value={form[kindKey]} onChange={(e) => setForm({ ...form, [kindKey]: e.target.value })}>
          {KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </Select>
      </Field>
      <Field label="Account id"><Input required pattern="[A-Za-z0-9_.\-]{1,64}" placeholder={idHint[form[kindKey]]} value={form[idKey]} onChange={(e) => setForm({ ...form, [idKey]: e.target.value })} /></Field>
    </div>
  );

  return (
    <>
      <PageHeader
        title={t('page.ledger', 'Ledger')}
        subtitle="Every money movement is written once and never edited. To fix a mistake, post a reversal: the history always shows what really happened."
        action={canPost && !form && <Button onClick={() => setForm(blank())}>+ Post entry</Button>}
      />

      <Card title="Trial balance" className="mb-5">
        {!tb ? (
          <Spinner />
        ) : (
          <>
            <p className="mb-3">
              {tb.isBalanced ? <Badge tone="green">Balanced: every debit has a matching credit</Badge> : <Badge tone="red">NOT balanced: stop posting and call support</Badge>}
            </p>
            {tb.accounts.length === 0 ? (
              <Empty>No entries yet.</Empty>
            ) : (
              <Table head={['Account', 'Net (debit − credit)']}>
                {tb.accounts.map((a) => (
                  <tr key={a.account}>
                    <td className="px-3 py-2"><button type="button" className="text-brand-600 dark:text-brand-300 hover:underline" onClick={() => { setPage(1); setAccount(a.account); }}>{a.account}</button></td>
                    <td className={`px-3 py-2 ${a.netPaise < 0 ? 'text-red-700 dark:text-red-300' : ''}`}>{formatINR(a.netPaise)}</td>
                  </tr>
                ))}
              </Table>
            )}
          </>
        )}
      </Card>

      {form && (
        <Card title="Post an entry" className="mb-5">
          <form onSubmit={post} className="grid gap-4 md:grid-cols-2">
            <AccountPicker label="Money comes FROM" kindKey="fromKind" idKey="fromId" />
            <AccountPicker label="Money goes TO" kindKey="toKind" idKey="toId" />
            <Field label="Amount (₹)"><Input required inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
            <Field label="Reference" hint="Receipt or fee number, e.g. FEE-0042"><Input required maxLength={120} value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} /></Field>
            <div className="md:col-span-2"><Field label="Description (optional)"><Input maxLength={300} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field></div>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" loading={busy}>Post entry</Button>
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card
        title={account ? `Entries for ${account}` : 'All entries'}
        action={account && <Button variant="secondary" onClick={() => { setPage(1); setAccount(''); }}>Show all</Button>}
      >
        {!list ? (
          <Spinner />
        ) : list.items.length === 0 ? (
          <Empty>No entries.</Empty>
        ) : (
          <>
            <Table head={['When', 'Reference', 'Movement', 'Amount', '']}>
              {list.items.map((en) => {
                const to = en.lines.filter((l) => l.debit > 0).map((l) => l.account).join(', ');
                const from = en.lines.filter((l) => l.credit > 0).map((l) => l.account).join(', ');
                return (
                  <tr key={en._id} className={en.reversed ? 'text-fg-muted' : ''}>
                    <td className="px-3 py-2.5 text-fg-muted">{formatDate(en.postedAt)}</td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium">{en.reference}</span>
                      {en.reversalOf && <span className="ml-2"><Badge tone="amber">Reversal</Badge></span>}
                      {en.reversed && <span className="ml-2"><Badge>Reversed</Badge></span>}
                      {en.description && <span className="block text-xs text-fg-muted">{en.description}</span>}
                    </td>
                    <td className="px-3 py-2.5 text-xs">{from} → {to}</td>
                    <td className="px-3 py-2.5">{formatINR(en.totalPaise)}</td>
                    <td className="px-3 py-2.5">
                      {canPost && !en.reversed && !en.reversalOf && (
                        <Button variant="secondary" onClick={() => setReversing({ id: en._id, reference: en.reference, reason: '', key: newKey() })}>Reverse</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
            <Pager page={list.page} limit={list.limit} total={list.total} onPage={setPage} />
          </>
        )}
      </Card>

      {reversing && (
        <Modal title={`Reverse ${reversing.reference}`} onClose={() => setReversing(null)}>
          <form onSubmit={reverse} className="space-y-4">
            <p className="text-sm text-fg-secondary">This posts an equal and opposite entry. The original stays visible, and an entry can be reversed only once.</p>
            <Field label="Reason"><Input required minLength={3} maxLength={300} value={reversing.reason} onChange={(e) => setReversing({ ...reversing, reason: e.target.value })} /></Field>
            <div className="flex gap-2">
              <Button type="submit" variant="danger">Post reversal</Button>
              <Button variant="secondary" onClick={() => setReversing(null)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
