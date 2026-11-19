import { useState } from 'react';
import toast from 'react-hot-toast';
import { toastError } from '../../../shared/lib/AxiosToastError';
import BrandingForm from '../../../shared/ui/BrandingForm.jsx';
import { Card, PageHeader } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as api from '../api';

/** "My organisation profile": the owner sets the logo and brand colour that appear in the menu and to platform support. */
export default function OrganisationProfile() {
  const { organisation, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const org = organisation || {};

  const save = async (body) => {
    setSaving(true);
    try {
      await api.updateOrganisationProfile(body);
      await refresh();
      toast.success('Organisation profile saved.');
    } catch (e) {
      toastError(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader title="My organisation profile" subtitle="Your logo and brand colour appear in the menu of everyone in your organisation." />
      <Card title="Branding">
        <BrandingForm key={`${org.logoUrl || ''}|${org.brandColor || ''}`} name={org.name || 'Organisation'} logoUrl={org.logoUrl} brandColor={org.brandColor} saving={saving} onSave={save} />
      </Card>
    </>
  );
}
