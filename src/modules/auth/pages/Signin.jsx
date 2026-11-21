import { ArrowRight, BarChart3, Eye, EyeOff, Lock, Mail, ShieldCheck, Users } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../../shared/i18n/languageContext.js';
import LanguageSwitcher from '../../../shared/i18n/LanguageSwitcher.jsx';
import { toastError } from '../../../shared/lib/AxiosToastError';
import Ambient from '../../../shared/ui/Ambient.jsx';
import BrandLogo from '../../../shared/ui/BrandLogo.jsx';
import ThemePicker from '../../../shared/ui/ThemePicker.jsx';
import { Button, Field, Input } from '../../../shared/ui/ui';
import useAuth from '../hooks/useAuth';

// Hero artwork: VITE_LOGIN_IMAGE overrides it; if it fails to load the navy gradient below still reads well.
const HERO = import.meta.env.VITE_LOGIN_IMAGE || '/login-hero.webp';
const POINTS = [
  { icon: Users, key: 'auth.point1', text: 'Leads, follow-ups and counselling appointments in one place' },
  { icon: BarChart3, key: 'auth.point2', text: 'Track every student from first enquiry to admission' },
  { icon: ShieldCheck, key: 'auth.point3', text: 'Secure, role-based access for your whole team' },
];

function HeroPanel() {
  const { t } = useI18n();
  const [imgOk, setImgOk] = useState(true);
  return (
    <aside className="relative hidden w-[52%] max-w-[760px] shrink-0 overflow-hidden bg-[#061a3f] lg:flex" aria-label={t('auth.heroLabel', 'About the platform')}>
      {imgOk && <img src={HERO} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" onError={() => setImgOk(false)} />}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(70% 55% at 85% 0%, rgba(10,150,208,0.45), transparent 70%), radial-gradient(60% 50% at 0% 100%, rgba(245,166,35,0.16), transparent 70%), linear-gradient(180deg, rgba(6,26,63,0.35), rgba(6,26,63,0.92))' }} />
      <div className="relative z-10 flex w-full flex-col justify-between p-10 xl:p-14">
        <BrandLogo tone="light" size="lg" sub={t('auth.tagline', 'Counsellor Platform')} />

        <div className="max-w-xl text-white">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-sky-100 ring-1 ring-inset ring-white/20 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {t('auth.badge', 'Admissions operating system')}
          </span>
          <h2 className="mt-5 text-4xl leading-[1.1] xl:text-[46px]" style={{ fontWeight: 800, letterSpacing: '-0.025em' }}>
            {t('auth.headline', 'Turn every enquiry into an admission.')}
          </h2>
          <ul className="mt-9 space-y-3.5">
            {POINTS.map(({ icon, key, text }) => {
              const Icon = icon;
              return (
                <li key={key} className="flex items-center gap-3.5 text-[15px] text-white/90">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sky-200 ring-1 ring-inset ring-white/20 backdrop-blur">
                    <Icon size={18} />
                  </span>
                  <span>{t(key, text)}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-4 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck size={14} /> {t('auth.secure', 'Encrypted, audited and tenant-isolated')}
          </span>
          <span>&copy; {new Date().getFullYear()} FastAdmission</span>
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
    <div className="relative min-h-dvh w-full text-fg lg:flex">
      <HeroPanel />

      <main className="bg-mesh relative isolate flex min-h-dvh flex-1 flex-col">
        <Ambient />

        {/* Phones and tablets: compact brand band instead of the hero panel */}
        <div className="relative z-10 overflow-hidden bg-[#061a3f] px-5 pb-16 pt-5 lg:hidden">
          <div className="absolute inset-0" style={{ background: 'radial-gradient(80% 90% at 100% 0%, rgba(10,150,208,0.55), transparent 70%), radial-gradient(60% 70% at 0% 100%, rgba(245,166,35,0.18), transparent 70%)' }} />
          <div className="relative flex items-center justify-between gap-3">
            <BrandLogo tone="light" size="md" />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <ThemePicker />
            </div>
          </div>
          <p className="relative mt-6 max-w-[18rem] text-[22px] leading-tight text-white" style={{ fontWeight: 800, letterSpacing: '-0.02em' }}>
            {t('auth.headline', 'Turn every enquiry into an admission.')}
          </p>
        </div>

        <div className="relative z-10 hidden items-center justify-end gap-2 p-6 lg:flex xl:p-8">
          <LanguageSwitcher />
          <ThemePicker />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col px-4 pb-6 max-lg:-mt-10 sm:px-0 lg:justify-center">
          <div style={{ background: "var(--surface-solid)" }} className="surface-card border border-line p-6 shadow-[0_24px_60px_-24px_rgba(6,26,63,0.35)] sm:p-8">
            <div className="mb-7">
              <h1 className="text-[26px] leading-tight text-fg" style={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                {mfaToken ? t('auth.mfaTitle', 'Two-step verification') : t('auth.welcome', 'Welcome back')}
              </h1>
              <p className="mt-1.5 text-sm text-fg-muted">
                {mfaToken ? t('auth.mfaSub', 'Confirm it is you to finish signing in.') : t('auth.subtitle', 'Sign in to your admin account')}
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
                  <Field label={t('auth.identifier', 'Email, mobile (+91) or tenant ID')}>
                    <div className="relative">
                      <Input
                        type="text"
                        autoComplete="username"
                        required
                        placeholder="name@agency.com"
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

              <Button type="submit" loading={busy} className="h-11 w-full gap-2 text-sm font-semibold shadow-md transition-transform active:scale-[0.985]">
                {mfaToken ? t('auth.verify', 'Verify and continue') : t('auth.signin', 'Sign in')}
                {!busy && <ArrowRight size={16} />}
              </Button>
            </form>
          </div>

          <p className="mt-5 flex items-start justify-center gap-1.5 px-2 text-center text-xs text-fg-muted">
            <ShieldCheck size={14} className="mt-px shrink-0" /> {t('auth.protected', 'Protected by tenant isolation, audit logging and DPDP-aligned controls.')}
          </p>
        </div>

        <p className="safe-pb relative z-10 pb-3 text-center text-xs text-fg-muted lg:hidden">&copy; {new Date().getFullYear()} FastAdmission</p>
      </main>
    </div>
  );
}
