import { useState } from 'react';
import toast from 'react-hot-toast';
import { Button, Card, Field, Input } from '../../../shared/ui/ui';
import { toastError } from '../../../shared/lib/AxiosToastError';
import * as authApi from '../api';

/** Two-step verification: enrol (secret + otpauth URL as text, confirm with a code, recovery codes shown once) or disable. */
export default function MfaCard({ enabled, onChanged }) {
  const [setup, setSetup] = useState(null); // { secret, otpauthUrl }
  const [code, setCode] = useState('');
  const [recovery, setRecovery] = useState(null);
  const [disable, setDisable] = useState({ password: '', code: '' });
  const [busy, setBusy] = useState(false);

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  const start = () => run(async () => setSetup((await authApi.mfaSetup()).data));

  const confirm = (e) => {
    e.preventDefault();
    return run(async () => {
      const { data } = await authApi.mfaEnable(code.trim());
      setRecovery(data.recoveryCodes);
      setSetup(null);
      setCode('');
      toast.success('Two-step verification is on.');
      await onChanged();
    });
  };

  const turnOff = (e) => {
    e.preventDefault();
    return run(async () => {
      await authApi.mfaDisable(disable.password, disable.code.trim());
      setDisable({ password: '', code: '' });
      toast.success('Two-step verification is off.');
      await onChanged();
    });
  };

  return (
    <Card title="Two-step verification">
      {recovery && (
        <div className="mb-4 space-y-2 rounded-lg border border-border p-3">
          <p className="text-sm font-medium">Save these recovery codes now. They are shown only once and each works one time.</p>
          <pre className="select-all text-sm">{recovery.join('\n')}</pre>
          <Button variant="secondary" onClick={() => setRecovery(null)}>I have saved them</Button>
        </div>
      )}
      {!enabled && !setup && (
        <>
          <p className="mb-4 text-sm text-fg-muted">Ask for a 6-digit code from an authenticator app (Google Authenticator, Authy, 1Password...) on every sign-in.</p>
          <Button onClick={start} loading={busy}>Set up</Button>
        </>
      )}
      {!enabled && setup && (
        <form onSubmit={confirm} className="space-y-4">
          <p className="text-sm text-fg-muted">Add this account to your authenticator app using the secret key (or paste the setup link), then enter the code it shows.</p>
          <Field label="Secret key"><code className="block select-all break-all text-sm">{setup.secret}</code></Field>
          <Field label="Setup link (otpauth)"><code className="block select-all break-all text-xs">{setup.otpauthUrl}</code></Field>
          <Field label="6-digit code"><Input required inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Button type="submit" loading={busy}>Turn on</Button>
        </form>
      )}
      {enabled && (
        <form onSubmit={turnOff} className="space-y-4">
          <p className="text-sm text-fg-muted">Two-step verification is on. To turn it off, confirm your password and a current code.</p>
          <Field label="Password"><Input type="password" required autoComplete="current-password" value={disable.password} onChange={(e) => setDisable({ ...disable, password: e.target.value })} /></Field>
          <Field label="6-digit code"><Input required inputMode="numeric" maxLength={6} autoComplete="one-time-code" value={disable.code} onChange={(e) => setDisable({ ...disable, code: e.target.value })} /></Field>
          <Button type="submit" variant="danger" loading={busy}>Turn off</Button>
        </form>
      )}
    </Card>
  );
}
