import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Badge, Button, Card, Empty, Field, Input, Modal, PageHeader, Select, Spinner, Table } from '../../../shared/ui/ui';
import { useAuth } from '../../auth';
import { useCatalog } from '../../catalog';
import * as teamApi from '../api';
import { toastError } from '../../../shared/lib/AxiosToastError';
import { formatDate } from '../../../shared/lib/format';
import { useI18n } from '../../../shared/i18n/languageContext.js';

const BLANK = { name: '', email: '', password: '', role: 'counsellor' };

export default function Team() {
  const { t } = useI18n();
  const { can, me } = useAuth();
  const catalog = useCatalog();
  const [team, setTeam] = useState(null);
  const [form, setForm] = useState(null);
  const [reset, setReset] = useState(null); // { id, name, password }
  const [busy, setBusy] = useState(false);
  const manage = can('team:manage');

  const load = useCallback(async () => {
    try {
      const { data } = await teamApi.listTeam();
      setTeam(data.team);
    } catch (e) {
      toastError(e);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!team || !catalog) return <Spinner />;

  // Owners are created with the organisation; staff roles are the other organisation roles.
  const staffRoles = catalog.roles.filter((r) => r.scope === 'tenant' && r.key !== 'owner');

  const act = async (fn, okMsg) => {
    try {
      await fn();
      if (okMsg) toast.success(okMsg);
      load();
    } catch (e) {
      toastError(e);
    }
  };

  const add = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await teamApi.addMember(form);
      toast.success('Team member added. Share their login with them.');
      setForm(null);
      load();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const doReset = async (e) => {
    e.preventDefault();
    await act(() => teamApi.resetMemberPassword(reset.id, reset.password), `Password reset. ${reset.name} was signed out everywhere.`);
    setReset(null);
  };

  return (
    <>
      <PageHeader
        title={t('page.team', 'Team & roles')}
        subtitle="Your staff and what each role is allowed to do. A role change takes effect on their very next click; blocking is immediate."
        action={manage && !form && <Button onClick={() => setForm(BLANK)}>+ Add team member</Button>}
      />

      {form && (
        <Card title="New team member" className="mb-5">
          <form onSubmit={add} className="grid gap-4 md:grid-cols-2">
            <Field label="Name"><Input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Email"><Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field label="Temporary password" hint="At least 10 characters."><Input type="password" required minLength={10} autoComplete="new-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></Field>
            <Field label="Role" hint={staffRoles.find((r) => r.key === form.role)?.description}>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {staffRoles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
              </Select>
            </Field>
            <div className="flex gap-2 md:col-span-2">
              <Button type="submit" loading={busy}>Add member</Button>
              <Button variant="secondary" onClick={() => setForm(null)}>Cancel</Button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {team.length === 0 ? (
          <Empty>No team members yet.</Empty>
        ) : (
          <Table head={['Name', 'Email', 'Role', 'Status', 'Last login', manage ? 'Actions' : ''].filter(Boolean)}>
            {team.map((u) => {
              const isOwner = u.role === 'owner';
              const isMe = u.id === me.user.id;
              return (
                <tr key={u.id}>
                  <td className="px-3 py-2.5 font-medium">{u.name}{isMe && <span className="ml-1 text-xs text-fg-muted">(you)</span>}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{u.email}</td>
                  <td className="px-3 py-2.5">
                    {manage && !isOwner ? (
                      <Select value={u.role} onChange={(e) => act(() => teamApi.setMemberRole(u.id, e.target.value), 'Role updated.')} className="!py-1">
                        {staffRoles.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
                      </Select>
                    ) : (
                      u.roleLabel || u.role
                    )}
                  </td>
                  <td className="px-3 py-2.5">{u.status === 'active' ? <Badge tone="green">Active</Badge> : <Badge tone="red">Blocked</Badge>}</td>
                  <td className="px-3 py-2.5 text-fg-muted">{formatDate(u.lastLoginAt) || 'Never'}</td>
                  {manage && (
                    <td className="px-3 py-2.5">
                      {!isOwner && (
                        <div className="flex gap-2">
                          <Button variant="secondary" onClick={() => setReset({ id: u.id, name: u.name, password: '' })}>Reset password</Button>
                          {u.status === 'active' ? (
                            <Button variant="secondary" onClick={() => window.confirm(`Block ${u.name}? They are signed out immediately.`) && act(() => teamApi.setMemberStatus(u.id, 'blocked'), 'Blocked.')}>Block</Button>
                          ) : (
                            <Button variant="secondary" onClick={() => act(() => teamApi.setMemberStatus(u.id, 'active'), 'Unblocked.')}>Unblock</Button>
                          )}
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </Table>
        )}
      </Card>

      {reset && (
        <Modal title={`Reset password for ${reset.name}`} onClose={() => setReset(null)}>
          <form onSubmit={doReset} className="space-y-4">
            <Field label="New password" hint="At least 10 characters. They will be signed out of every device.">
              <Input type="password" required minLength={10} autoComplete="new-password" value={reset.password} onChange={(e) => setReset({ ...reset, password: e.target.value })} />
            </Field>
            <div className="flex gap-2">
              <Button type="submit">Reset password</Button>
              <Button variant="secondary" onClick={() => setReset(null)}>Cancel</Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
