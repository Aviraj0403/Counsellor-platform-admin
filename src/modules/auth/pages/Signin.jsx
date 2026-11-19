import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import LanguageSwitcher from '../../../shared/i18n/LanguageSwitcher.jsx';
import { toastError } from '../../../shared/lib/AxiosToastError';
import Ambient from '../../../shared/ui/Ambient.jsx';
import ThemePicker from '../../../shared/ui/ThemePicker.jsx';
import { Button, Field, Input } from '../../../shared/ui/ui';
import useAuth from '../hooks/useAuth';

export default function Signin() {
  const { me, login, verifyMfa } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [mfaToken, setMfaToken] = useState(null);
  const [code, setCode] = useState('');
  const [useRecovery, setUseRecovery] = useState(false);

  if (me) return <Navigate to={location.state?.from || '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mfaToken) {
        await verifyMfa(mfaToken, useRecovery ? { recoveryCode: code.trim() } : { code: code.trim() });
      } else {
        const r = await login(email.trim(), password);
        if (r?.mfaRequired) {
          setMfaToken(r.mfaToken);
          return;
        }
      }
      navigate(location.state?.from || '/', { replace: true });
    } catch (err) {
      toastError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-mesh relative isolate flex min-h-dvh items-center justify-center p-4 text-fg">
      <Ambient />
      {/* appearance and language are available before signing in, same as the ecommerce admin */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LanguageSwitcher />
        <ThemePicker />
      </div>
      <form onSubmit={submit} className="surface-card card-pad relative z-10 w-full max-w-sm space-y-5">
        <div className="flex items-center gap-3">
          <span className="brand-gradient flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ring-1 ring-inset ring-white/20">
            <Sparkles size={20} />
          </span>
          <div>
            <h1 className="text-card-title">{t('auth.title', 'Counsellor Platform')}</h1>
            <p className="text-caption">{t('auth.subtitle', 'Sign in to your admin account')}</p>
          </div>
        </div>
        {mfaToken ? (
          <>
            <Field
              label={useRecovery ? 'Recovery code' : 'Authenticator code'}
              hint={useRecovery ? 'One of the codes you saved when you turned on two-step verification. Each works once.' : 'The 6-digit code from your authenticator app.'}
            >
              <Input autoFocus required inputMode={useRecovery ? 'text' : 'numeric'} autoComplete="one-time-code" maxLength={useRecovery ? 20 : 6} value={code} onChange={(e) => setCode(e.target.value)} />
            </Field>
            <button
              type="button"
              className="text-caption underline"
              onClick={() => {
                setUseRecovery(!useRecovery);
                setCode('');
              }}
            >
              {useRecovery ? 'Use authenticator code instead' : 'Use a recovery code'}
            </button>
          </>
        ) : (
          <>
            <Field label={t('auth.email', 'Email')}>
              <Input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Field label={t('auth.password', 'Password')}>
              <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>
          </>
        )}
        <Button type="submit" loading={busy} className="w-full">
          {mfaToken ? 'Verify' : t('auth.signin', 'Sign in')}
        </Button>
      </form>
    </div>
  );
}
