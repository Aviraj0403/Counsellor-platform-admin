import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button, Card, Field, Input, PageHeader, Spinner } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as api from '../api';

export default function SeoSettings() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getSettings().then(({ data }) => setS(data)).catch(toastError);
  }, []);

  if (!s) return <Spinner />;
  const set = (k) => (e) => setS({ ...s, [k]: e.target.value });
  const setContact = (k) => (e) => setS({ ...s, contact: { ...s.contact, [k]: e.target.value } });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...s };
      delete body.publicUrl;
      if (!body.orgSlug) delete body.orgSlug;
      const { data } = await api.saveSettings(body);
      setS(data);
      toast.success('Website settings saved.');
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Public website" subtitle="Search-friendly college pages with an enquiry form. Every enquiry becomes a lead." action={<Link to="/seo/pages"><Button variant="secondary">Edit college pages</Button></Link>} />
      <Card title="Your public site address">
        {s.publicUrl ? (
          <p className="text-sm">
            <a className="text-accent underline" href={s.publicUrl} target="_blank" rel="noreferrer">{s.publicUrl}</a>
            <span className="block text-xs text-fg-muted">Share this link, or point your own website to it. Sitemap: {s.publicUrl}/sitemap.xml</span>
          </p>
        ) : (
          <p className="text-sm text-fg-muted">Enter your organisation address below and save to see your public site link.</p>
        )}
      </Card>
      <form onSubmit={save} className="space-y-4">
        <Card title="Site details">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Organisation address" hint="The short address your platform contact gave you (for example my-counselling). Must match your organisation."><Input value={s.orgSlug} onChange={set('orgSlug')} maxLength={60} /></Field>
            <Field label="Site title" hint="Shown in the page header and search results. Defaults to your organisation name."><Input value={s.siteTitle} onChange={set('siteTitle')} maxLength={120} /></Field>
            <Field label="Tagline"><Input value={s.tagline} onChange={set('tagline')} maxLength={200} /></Field>
            <Field label="Logo link (https)"><Input value={s.logoUrl} onChange={set('logoUrl')} maxLength={400} placeholder="https://..." /></Field>
            <Field label="Theme colour"><Input type="color" value={s.themeColor} onChange={set('themeColor')} /></Field>
          </div>
        </Card>
        <Card title="Contact shown on the site">
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Phone"><Input value={s.contact.phone} onChange={setContact('phone')} maxLength={20} /></Field>
            <Field label="Email"><Input type="email" value={s.contact.email} onChange={setContact('email')} maxLength={160} /></Field>
            <Field label="WhatsApp number"><Input value={s.contact.whatsapp} onChange={setContact('whatsapp')} maxLength={20} /></Field>
          </div>
        </Card>
        <Card title="Enquiry form">
          <label className="mb-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={s.leadFormEnabled} onChange={(e) => setS({ ...s, leadFormEnabled: e.target.checked })} />
            Show the enquiry form on the site
          </label>
          <Field label="Consent text" hint="Students must tick this before we contact them. Keep it clear and honest."><Input value={s.consentText} onChange={set('consentText')} maxLength={400} /></Field>
        </Card>
        <Button type="submit" disabled={busy}>{busy ? 'Saving...' : 'Save settings'}</Button>
      </form>
    </div>
  );
}
