import { BarChart3, CalendarCheck, ShieldCheck, Sparkles, Building2, Mail, Lock, Eye, EyeOff, LogIn } from 'lucide-react';
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
    <aside className="brand-gradient relative hidden w-[50%] max-w-[720px] shrink-0 overflow-hidden lg:flex" aria-label={t('auth.heroLabel', 'About the platform')}>
      {imgOk && <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover" onError={() => setImgOk(false)} />}
      {/* pattern + legibility overlay: the text below is always white on a dark wash, in light and dark mode */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25" />
      <div
        className="absolute inset-0 opacity-25"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }}
        aria-hidden="true"
      />
      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
        <div className="flex items-center gap-3 text-white">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-inset ring-white/30 backdrop-blur shadow-sm">
            <Sparkles size={20} />
          </span>
          <span className="text-lg font-bold tracking-tight">{t('shell.brand', 'Counsellor Platform')}</span>
        </div>
        <div className="max-w-lg text-white">
          <h2 className="text-4xl font-extrabold leading-tight xl:text-5xl">{t('auth.headline', 'Turn every enquiry into an admission.')}</h2>
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
        <p className="text-xs text-white/60">Enterprise Multi-Tenant Admission OS &copy; {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}

export default function Signin() {
  const { me, login, verifyMfa } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        const r = await login(identifier.trim(), password);
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
    <div className="relative min-h-dvh w-full overflow-hidden text-fg lg:flex">
      <HeroPanel />

      <main className="bg-mesh relative isolate flex min-h-dvh flex-1 flex-col justify-between p-4 sm:p-8 lg:p-12">
        <Ambient />

        {/* Top bar with quick switchers */}
        <div className="relative z-10 flex w-full items-center justify-between pb-6 sm:pb-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="brand-gradient flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white shadow-sm ring-1 ring-inset ring-white/20">
              <Sparkles size={16} />
            </span>
            <span className="font-bold text-sm tracking-tight text-fg">Counsellor Platform</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <LanguageSwitcher />
            <ThemePicker />
          </div>
        </div>

        {/* Login Container (Ultra-responsive on iOS/Android) */}
        <div className="relative z-10 mx-auto my-auto w-full max-w-[420px] py-4">
          <div className="surface-card card-pad border border-line shadow-xl">
            {/* Header in Card */}
            <div className="mb-6 space-y-2 text-center sm:text-left">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 ring-1 ring-inset ring-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
                <Building2 size={24} />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-fg">
                {t('auth.title', 'Welcome Back')}
              </h1>
              <p className="text-xs sm:text-sm text-fg-muted">
                {t('auth.subtitle', 'Sign in to access your admissions workspace')}
              </p>
            </div>

            <form onSubmit={submit} className="space-y-4">
              {mfaToken ? (
                <>
                  <Field
                    label={useRecovery ? 'Recovery code' : 'Authenticator code'}
                    hint={
                      useRecovery
                        ? 'One of the codes you saved when you turned on two-step verification.'
                        : 'Enter the 6-digit code from your authenticator app.'
                    }
                  >
                    <Input
                      autoFocus
                      required
                      inputMode={useRecovery ? 'text' : 'numeric'}
                      autoComplete="one-time-code"
                      maxLength={useRecovery ? 20 : 6}
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="text-center font-mono text-lg tracking-widest"
                    />
                  </Field>
                  <button
                    type="button"
                    className="text-xs text-brand-600 hover:underline dark:text-brand-400"
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
                  <Field label="Email, Mobile (+91) or Tenant ID">
                    <div className="relative">
                      <Input
                        type="text"
                        autoComplete="username"
                        required
                        placeholder="name@agency.com or +9198XXXXXXXX"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="pl-9 text-base sm:text-sm"
                      />
                      <Mail size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
                    </div>
                  </Field>

                  <Field label={t('auth.password', 'Password')}>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-9 pr-10 text-base sm:text-sm"
                      />
                      <Lock size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </Field>
                </>
              )}

              <Button
                type="submit"
                loading={busy}
                className="w-full flex items-center justify-center gap-2 py-3 text-sm font-semibold shadow-md active:scale-[0.98] transition-transform"
              >
                {!busy && <LogIn size={16} />}
                {mfaToken ? 'Verify Token' : t('auth.signin', 'Sign In to Workspace')}
              </Button>
            </form>
          </div>

          <div className="mt-4 text-center text-xs text-fg-muted">
            Protected by multi-tenant database isolation &amp; DPDP compliance.
          </div>
        </div>

        {/* Footer info for mobile safe view */}
        <div className="relative z-10 text-center text-xs text-fg-muted pt-2 safe-pb">
          Fast, secure counselling &amp; admissions operations.
        </div>
      </main>
    </div>
  );
}
