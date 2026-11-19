import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, Field, Input, PageHeader, Spinner } from '../../../shared/ui/ui';
import * as billingApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';

const EMPTY = { legalName: '', gstin: '', pan: '', address: '', state: '', email: '', phone: '', invoiceFooter: '', bankName: '', bankAccount: '', bankIfsc: '', gstRatePct: '18' };

/** Our own company details, printed on every invoice. Super Admin / Platform Finance. */
export default function CompanySettings() {
  const [f, setF] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    billingApi
      .getSettings()
      .then(({ data }) =>
        setF({ ...EMPTY, ...data, bankName: data.bank?.name || '', bankAccount: data.bank?.account || '', bankIfsc: data.bank?.ifsc || '', gstRatePct: String((data.gstRateBps ?? 1800) / 100) }),
      )
      .catch(toastError);
  }, []);

  if (!f) return <Spinner />;
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const save = async (e) => {
    e.preventDefault();
    const rate = Number(f.gstRatePct);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) return toast.error('GST rate must be between 0 and 100.');
    setBusy(true);
    try {
      await billingApi.saveSettings({
        legalName: f.legalName, gstin: f.gstin, pan: f.pan, address: f.address, state: f.state, email: f.email, phone: f.phone, invoiceFooter: f.invoiceFooter,
        bank: { name: f.bankName, account: f.bankAccount, ifsc: f.bankIfsc },
        gstRateBps: Math.round(rate * 100),
      });
      toast.success('Company details saved. New invoices will use them.');
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Company settings" subtitle="Printed on every invoice. Issued invoices keep the details they were issued with. Confirm the GST rate and format with your accountant." />
      <Card>
        <form onSubmit={save} className="grid max-w-3xl gap-4 sm:grid-cols-2">
          <Field label="Legal name"><Input value={f.legalName} onChange={set('legalName')} /></Field>
          <Field label="State" hint="Decides CGST+SGST (same state) or IGST"><Input value={f.state} onChange={set('state')} /></Field>
          <Field label="GSTIN"><Input value={f.gstin} onChange={set('gstin')} placeholder="29ABCDE1234F1Z5" /></Field>
          <Field label="PAN"><Input value={f.pan} onChange={set('pan')} /></Field>
          <Field label="Address"><Input value={f.address} onChange={set('address')} /></Field>
          <Field label="GST rate (%)"><Input inputMode="decimal" value={f.gstRatePct} onChange={set('gstRatePct')} /></Field>
          <Field label="Email"><Input value={f.email} onChange={set('email')} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={set('phone')} /></Field>
          <Field label="Bank name"><Input value={f.bankName} onChange={set('bankName')} /></Field>
          <Field label="Account number"><Input value={f.bankAccount} onChange={set('bankAccount')} /></Field>
          <Field label="IFSC"><Input value={f.bankIfsc} onChange={set('bankIfsc')} /></Field>
          <Field label="Invoice footer"><Input value={f.invoiceFooter} onChange={set('invoiceFooter')} /></Field>
          <div className="sm:col-span-2"><Button type="submit" loading={busy}>Save</Button></div>
        </form>
      </Card>
    </>
  );
}
