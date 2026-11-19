import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, Field, Input, PageHeader } from '../../../shared/ui/ui';
import MfaCard from '../components/MfaCard';
import useAuth from '../hooks/useAuth';
import * as authApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { setToken } from '../../../shared/api/session';
import { useI18n } from '../../../shared/i18n/languageContext.js';

export default function Account() {
  const { t } = useI18n();
  const { me, staff, logout, refresh } = useAuth();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState(false);

  const change = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await authApi.changePassword(form.currentPassword, form.newPassword);
      setToken(data.token, data.refreshToken); // this device stays signed in; every other session is ended
      setForm({ currentPassword: '', newPassword: '' });
      toast.success('Password changed. Other devices were signed out.');
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const everywhere = async () => {
    try {
      await authApi.logoutEverywhere();
      logout();
    } catch (err) {
      toastError(err);
    }
  };

  return (
    <>
      <PageHeader title={t('page.account', 'My account')} subtitle={`${staff.name} · ${staff.email} · ${me.platformUser ? 'Platform staff' : me.user.roleLabel || me.user.role}`} />
      <div className="grid gap-5 md:grid-cols-2">
        <Card title="Change password">
          <form onSubmit={change} className="space-y-4">
            <Field label="Current password"><Input type="password" required autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} /></Field>
            <Field label="New password" hint="At least 10 characters."><Input type="password" required minLength={10} autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} /></Field>
            <Button type="submit" loading={busy}>Change password</Button>
          </form>
        </Card>
        <MfaCard enabled={!!me.mfa?.enabled} onChanged={refresh} />
        <Card title="Sessions">
          <p className="mb-4 text-sm text-fg-muted">Lost a device or think someone has your login? End every session, including this one.</p>
          <Button variant="danger" onClick={everywhere}>Log out of all devices</Button>
        </Card>
      </div>
    </>
  );
}
