import { useEffect, useRef, useState } from 'react';
import { Briefcase, User, ShieldCheck, X } from 'lucide-react';
import { api, loadScript } from '../api';
import { AppConfig, Session } from '../types';
import { useModalHistory } from '../history';
import { useT } from '../i18n';

declare global {
  interface Window { google?: any }
}

interface Props {
  config: AppConfig;
  onClose: () => void;
  onAuthed: (s: Session) => void;
  initialRole?: 'worker' | 'company';
}

export default function AuthModal({ config, onClose, onAuthed, initialRole }: Props) {
  const { t } = useT();
  useModalHistory(true, onClose);
  const [role, setRole] = useState<'worker' | 'company'>(initialRole || 'worker');
  const [mode, setMode] = useState<'user' | 'admin'>('user');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [consent, setConsent] = useState(false);
  const roleRef = useRef(role);
  roleRef.current = role;
  const consentRef = useRef(consent);
  consentRef.current = consent;
  const gBtnRef = useRef<HTMLDivElement>(null);

  // Admin form
  const [adminUser, setAdminUser] = useState('');
  const [adminPass, setAdminPass] = useState('');

  // Dev login (only when enabled server-side)
  const [devEmail, setDevEmail] = useState('');

  useEffect(() => {
    if (mode !== 'user' || !config.googleClientId) return;
    let cancelled = false;
    loadScript('https://accounts.google.com/gsi/client')
      .then(() => {
        if (cancelled || !window.google || !gBtnRef.current) return;
        window.google.accounts.id.initialize({
          client_id: config.googleClientId,
          callback: async (resp: any) => {
            if (!consentRef.current) { setError(t('consent.required')); return; }
            setBusy(true);
            setError('');
            try {
              const session = await api<Session>('/auth/google', {
                method: 'POST',
                body: JSON.stringify({ idToken: resp.credential, role: roleRef.current }),
              });
              onAuthed(session);
            } catch (e: any) {
              setError(e.message);
            } finally {
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(gBtnRef.current, {
          theme: 'outline', size: 'large', width: 320, text: 'continue_with',
        });
      })
      .catch(() => setError('Could not load Google Sign-In'));
    return () => { cancelled = true; };
  }, [mode, config.googleClientId]);

  const adminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const session = await api<Session>('/auth/admin', {
        method: 'POST',
        body: JSON.stringify({ username: adminUser, password: adminPass }),
      });
      onAuthed(session);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const devLogin = async () => {
    if (!consent) { setError(t('consent.required')); return; }
    setBusy(true);
    setError('');
    try {
      const session = await api<Session>('/auth/dev-login', {
        method: 'POST',
        body: JSON.stringify({ email: devEmail, role }),
      });
      onAuthed(session);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 p-1">
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          <div className="flex justify-center mb-6">
            <img src="/novuslogo.png" alt="NovusWork" className="h-8 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
          </div>

          {mode === 'user' ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">Join NovusWork</h2>
              <p className="text-gray-500 mb-6 text-center text-sm">
                Sign in with Google — we verify your email automatically.
              </p>

              {/* Role selector */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => setRole('worker')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'worker' ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <User className={`w-6 h-6 mb-2 ${role === 'worker' ? 'text-primary' : 'text-gray-400'}`} />
                  <div className="font-bold text-sm text-gray-900">I want to work</div>
                  <div className="text-xs text-gray-500">Find jobs & get hired</div>
                </button>
                <button
                  onClick={() => setRole('company')}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${role === 'company' ? 'border-primary bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <Briefcase className={`w-6 h-6 mb-2 ${role === 'company' ? 'text-primary' : 'text-gray-400'}`} />
                  <div className="font-bold text-sm text-gray-900">I'm a company</div>
                  <div className="text-xs text-gray-500">Hire top talent</div>
                </button>
              </div>

              {/* 18+ and data policy consent — required before sign-up */}
              <div className="mb-4 bg-gray-50 border border-gray-200 rounded-xl p-3">
                <label className="flex items-start gap-2 text-left text-xs text-gray-600 cursor-pointer">
                  <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[color:var(--color-primary)] shrink-0" />
                  <span>{t('consent.checkbox')}</span>
                </label>
                <a href="https://sites.google.com/view/novuswork-privacyvus/home" target="_blank" rel="noopener noreferrer"
                  className="mt-2 ml-6 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  {t('consent.privacylink')} ↗
                </a>
              </div>

              <div className={consent ? '' : 'opacity-50 pointer-events-none'}>
              {config.googleClientId ? (
                <div className="flex justify-center min-h-[44px]" ref={gBtnRef} />
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
                  Google Sign-In is being configured. Please check back shortly.
                </div>
              )}

              {config.devLogin && (
                <div className="mt-4 border-t border-dashed border-gray-200 pt-4">
                  <p className="text-xs text-gray-400 mb-2 text-center">Development login</p>
                  <div className="flex gap-2">
                    <input
                      value={devEmail}
                      onChange={(e) => setDevEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="flex-1 border border-gray-300 rounded-lg py-2 px-3 text-sm outline-none focus:border-primary"
                    />
                    <button onClick={devLogin} disabled={busy || !devEmail} className="bg-gray-800 text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-50">
                      Go
                    </button>
                  </div>
                </div>
              )}
              </div>

              <button
                onClick={() => setMode('admin')}
                className="mt-6 w-full text-xs text-gray-400 hover:text-gray-600 flex items-center justify-center gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Administrator access
              </button>
            </>
          ) : (
            <form onSubmit={adminLogin}>
              <h2 className="text-2xl font-bold text-gray-900 mb-1 text-center">Admin Login</h2>
              <p className="text-gray-500 mb-6 text-center text-sm">Restricted area — authorized staff only.</p>
              <div className="space-y-4">
                <input
                  value={adminUser}
                  onChange={(e) => setAdminUser(e.target.value)}
                  placeholder="Username"
                  autoComplete="username"
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <input
                  type="password"
                  value={adminPass}
                  onChange={(e) => setAdminPass(e.target.value)}
                  placeholder="Password"
                  autoComplete="current-password"
                  className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button type="submit" disabled={busy} className="w-full bg-dark text-white rounded-xl py-3 font-semibold hover:opacity-90 disabled:opacity-50">
                  {busy ? 'Signing in…' : 'Sign in as Admin'}
                </button>
              </div>
              <button type="button" onClick={() => setMode('user')} className="mt-4 w-full text-xs text-gray-400 hover:text-gray-600">
                ← Back to user sign-in
              </button>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-600 text-center font-medium">{error}</p>}
        </div>
      </div>
    </div>
  );
}
