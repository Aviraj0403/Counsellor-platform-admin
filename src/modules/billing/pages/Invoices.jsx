import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Pager, Select, Spinner, Table } from '../../../shared/ui/ui';
import * as billingApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate, formatINR } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const LIMIT = 25;
const TONE = { issued: 'amber', paid: 'green', void: 'gray' };

export default function Invoices() {
  const { t } = useI18n();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [data, setData] = useState(null);
  const [paying, setPaying] = useState(null); // { id, invoiceNo, ref }

  const load = useCallback(async () => {
    try {
      setData((await billingApi.listInvoices({ page, limit: LIMIT, ...(status && { status }) })).data);
    } catch (e) {
      toastError(e);
    }
  }, [page, status]);

  useEffect(() => {
    load();
  }, [load]);

  const downloadPdf = async (i) => {
    try {
      const { data } = await billingApi.invoicePdf(i.id);
      const url = URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${i.invoiceNo}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      toastError(e);
    }
  };

  const makeLink = async (i) => {
    try {
      const { data } = await billingApi.createPaymentLink(i.id);
      toast.success('Payment link ready.');
      setData((d) => ({ ...d, items: d.items.map((x) => (x.id === i.id ? data : x)) }));
    } catch (e) {
      toastError(e);
    }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied.');
    } catch {
      toast.error('Could not copy. Select the link and copy it by hand.');
    }
  };

  const act = async (id, next, ref) => {
    try {
      await billingApi.setInvoiceStatus(id, next, ref || undefined);
      toast.success(next === 'paid' ? 'Marked as paid.' : 'Invoice voided.');
      setPaying(null);
      load();
    } catch (e) {
      toastError(e);
    }
  };

  return (
    <>
      <PageHeader title={t('page.invoices', 'Invoices')} subtitle="One invoice per organisation per month, created from the organisation’s page. An issued invoice never changes: it is marked paid or voided." />
      <Card>
        <div className="mb-4 w-48">
          <Select value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }} aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="issued">Issued (unpaid)</option>
            <option value="paid">Paid</option>
            <option value="void">Void</option>
          </Select>
        </div>
        {!data ? (
          <Spinner />
        ) : data.items.length === 0 ? (
          <Empty>No invoices yet.</Empty>
        ) : (
          <>
            <Table head={['Invoice', 'Month', 'Organisation', 'Subtotal', 'GST', 'Total', 'Status', '']}>
              {data.items.map((i) => (
                <tr key={i.id}>
                  <td className="px-3 py-2.5 font-medium">{i.invoiceNo}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{i.period}</td>
                  <td className="px-3 py-2.5"><Link to={`/organisations/${i.tenantId}`} className="text-brand-600 dark:text-brand-300 hover:underline">Open</Link></td>
                  <td className="px-3 py-2.5">{formatINR(i.subtotalPaise)}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{formatINR(i.gstPaise)}</td>
                  <td className="px-3 py-2.5 font-medium">{formatINR(i.totalPaise)}</td>
                  <td className="px-3 py-2.5">
                    <Badge tone={TONE[i.status]}>{i.status}</Badge>
                    {i.paidAt && <span className="ml-2 text-xs text-fg-muted">{formatDate(i.paidAt)}</span>}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button variant="secondary" onClick={() => downloadPdf(i)}>Download PDF</Button>
                      {i.paymentLink && (
                        <span className="flex items-center gap-1 text-xs">
                          <Badge tone={i.paymentLink.status === 'paid' ? 'green' : 'gray'}>{i.paymentLink.status}</Badge>
                          <input readOnly value={i.paymentLink.url} aria-label="Payment link" className="w-40 rounded border border-line bg-transparent px-1 py-0.5" onFocus={(e) => e.target.select()} />
                          <Button variant="secondary" onClick={() => copyLink(i.paymentLink.url)}>Copy</Button>
                        </span>
                      )}
                      {i.status === 'issued' && (!i.paymentLink || !['created', 'partially_paid'].includes(i.paymentLink.status)) && (
                        <Button variant="secondary" onClick={() => makeLink(i)}>Create payment link</Button>
                      )}
                    </div>
                    {i.status === 'issued' && (
                      <div className="mt-2 flex gap-2">
                        <Button variant="secondary" onClick={() => setPaying({ id: i.id, invoiceNo: i.invoiceNo, ref: '' })}>Mark paid</Button>
                        <Button variant="secondary" onClick={() => window.confirm(`Void ${i.invoiceNo}? This cannot be undone.`) && act(i.id, 'void')}>Void</Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
            <Pager page={data.page} limit={data.limit} total={data.total} onPage={setPage} />
          </>
        )}
      </Card>

      {paying && (
        <Modal title={`Mark ${paying.invoiceNo} as paid`} onClose={() => setPaying(null)}>
          <form onSubmit={(e) => { e.preventDefault(); act(paying.id, 'paid', paying.ref); }} className="space-y-4">
            <Field label="Payment reference (optional)" hint="UPI id, bank reference or cheque number">
              <Input value={paying.ref} onChange={(e) => setPaying({ ...paying, ref: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Mark paid</Button>
              <Button variant="secondary" onClick={() => setPaying(null)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
