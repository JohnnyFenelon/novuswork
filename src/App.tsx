import { useEffect, useState } from 'react';
import LandingPage from './components/LandingPage';
import AppShell from './components/AppShell';
import Onboarding from './components/Onboarding';
import AdminPanel from './components/AdminPanel';
import { AppConfig, Session } from './types';
import { getConfig, getMe } from './api';

export default function App() {
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getConfig().catch(() => null), getMe()])
      .then(([cfg, me]) => {
        setConfig(cfg);
        setSession(me);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-black animate-pulse">NW</div>
          <p className="text-gray-400 text-sm">Loading NovusWork…</p>
        </div>
      </div>
    );
  }

  const fallbackConfig: AppConfig = config || {
    googleClientId: '', paypalClientId: '', paypalConfigured: false, activationPrice: '5.00', devLogin: false,
  };

  let content;
  if (!session) {
    content = <LandingPage config={fallbackConfig} onAuthed={setSession} />;
  } else if (session.user.role === 'admin') {
    content = <AdminPanel session={session} onLogout={() => setSession(null)} />;
  } else if (!session.user.onboarded) {
    content = <Onboarding session={session} onDone={setSession} />;
  } else {
    content = (
      <AppShell
        session={session}
        config={fallbackConfig}
        onSession={setSession}
        onLogout={() => setSession(null)}
      />
    );
  }

  return <div className="min-h-screen bg-white text-gray-900 font-sans">{content}</div>;
}
