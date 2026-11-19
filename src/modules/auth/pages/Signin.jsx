import { BarChart3, CalendarCheck, ShieldCheck, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import LanguageSwitcher from '../../../shared/i18n/LanguageSwitcher.jsx';
import { toastError } from '../../../shared/lib/AxiosToastError';
import Ambient from '../../../shared/ui/Ambient.jsx';
import ThemePicker from '../../../shared/ui/ThemePicker.jsx';
import { Button, Field, Input } from '../../../shared/ui/ui';
import useAuth from '../hooks/useAuth';

// Drop your own photo at public/login-hero.jpg, or point VITE_LOGIN_IMAGE at any image URL. If it is missing the gradient panel shows instead.
const HERO = import.meta.env.VITE_LOGIN_IMAGE || '/login-hero.jpg';
const POINTS = [
  { icon: CalendarCheck, key: 'auth.point1', text: 'Leads, follow-ups and counselling appointments in one place' },
  { icon: BarChart3, key: 'auth.point2', text: 'Track every student from first enquiry to admission' },
  { icon: ShieldCheck, key: 'auth.point3', text: 'Secure, role-based access for your whole team' },
];

function HeroPanel() {
  const { t } = useI18n();
  const [imgOk, setImgOk] = useState(true);
  return (
    <aside className="brand-gradient relative hidden w-[52%] max-w-[760px] shrink-0 overflow-hidden lg:flex" aria-label={t('auth.heroLabel', 'About the platform')}>
      {imgOk && <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setImgOk(false)} />}
      {/* pattern + legibility overlay: the text below is always white on a dark wash, in light and dark mode */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/20" />
      <div
        className="absolute inset-0 opacity-30"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)', backgroundSize: '22px 22px' }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-3 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/30 backdrop-blur">
            <Sparkles size={20} />
          </span>
          <span className="text-lg font-semibold">{t('shell.brand', 'Counsellor Platform')}</span>
        </div>
        <div className="max-w-lg text-white">
          <h2 className="text-4xl font-semibold leading-tight xl:text-5xl">{t('auth.headline', 'Turn every enquiry into an admission.')}</h2>
          <ul className="mt-8 space-y-4">
            {POINTS.map(({ icon, key, text }) => {
              const Icon = icon;
              return (
              <li key={key} className="flex items-start gap-3 text-base text-white/90">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 ring-1 ring-inset ring-white/25">
                  <Icon size={16} />
                </span>
                <span>{t(key, text)}</span>
              </li>
              );
            })}
          </ul>
        </div>
      </div>
    </aside>
  );
}

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
    <div className="flex min-h-dvh text-fg">
      <HeroPanel />
      <main className="bg-mesh relative isolate flex min-h-dvh flex-1 items-center justify-center p-4">
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
      </main>
    </div>
  );
}
