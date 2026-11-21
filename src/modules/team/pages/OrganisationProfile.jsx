import { useState } from 'react';
import toast from 'react-hot-toast';
import { toastError } from '../../../shared/lib/AxiosToastError';
import BrandingForm from '../../../shared/ui/BrandingForm.jsx';
import { Button, Card, PageHeader } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import * as api from '../api';

/** "My organisation profile": the owner sets the logo, brand colour and team visibility settings. */
export default function OrganisationProfile() {
  const { organisation, refresh } = useAuth();
  const [saving, setSaving] = useState(false);
  const org = organisation || {};
  const [counsellorAllStudentsVisible, setCounsellorAllStudentsVisible] = useState(
    org.settings?.counsellorAllStudentsVisible !== false,
  );

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

  const saveVisibility = async () => {
    await save({ settings: { counsellorAllStudentsVisible } });
  };

  return (
    <>
      <PageHeader title="My organisation profile" subtitle="Your logo and brand colour appear in the menu of everyone in your organisation." />
      <Card title="Branding">
        <BrandingForm key={`${org.logoUrl || ''}|${org.brandColor || ''}`} name={org.name || 'Organisation'} logoUrl={org.logoUrl} brandColor={org.brandColor} saving={saving} onSave={save} />
      </Card>

      <Card title="Student Visibility for Counsellors" className="mt-5">
        <div className="space-y-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded accent-indigo-600"
              checked={counsellorAllStudentsVisible}
              onChange={(e) => setCounsellorAllStudentsVisible(e.target.checked)}
            />
            <div>
              <span className="text-sm font-medium text-fg">Allow counsellors to see all organisation students</span>
              <p className="text-xs text-fg-muted mt-0.5">
                When enabled, counsellors can view and assist with any student in your organisation (with clear assignment badges). When disabled, counsellors can only view students strictly assigned to them.
              </p>
            </div>
          </label>
          <Button variant="secondary" loading={saving} onClick={saveVisibility}>
            Save visibility preference
          </Button>
        </div>
      </Card>
    </>
  );
}
