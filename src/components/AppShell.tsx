import { useEffect, useState } from 'react';
import { Briefcase, LayoutDashboard, MessageSquare, User, LogOut, Users, LifeBuoy, BadgeCheck } from 'lucide-react';
import { AppConfig, AppView, Session } from '../types';
import { logout } from '../api';
import { getSocket, disconnectSocket } from '../realtime';
import { useT, LangToggle } from '../i18n';
import { useHistoryNav } from '../history';
import Logo from './Logo';
import JobsView from './JobsView';
import DashboardView from './DashboardView';
import MessagesView from './MessagesView';
import ProfileView from './ProfileView';
import TalentView from './TalentView';
import SupportView from './SupportView';
import ActivationModal from './ActivationModal';
import VideoCall, { IncomingCall } from './VideoCall';
import AiAssistant from './AiAssistant';

interface Props {
  session: Session;
  config: AppConfig;
  onSession: (s: Session) => void;
  onLogout: () => void;
}

export default function AppShell({ session, config, onSession, onLogout }: Props) {
  const { t } = useT();
  const [activeView, setActiveView] = useHistoryNav<AppView>('dashboard', 'view');
  const [showActivation, setShowActivation] = useState(false);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [chatWith, setChatWith] = useState<number | null>(null);
  const user = session.user;
  const isWorker = user.role === 'worker';

  useEffect(() => {
    const socket = getSocket();
    socket.on('call-offer', (call: IncomingCall) => setIncomingCall(call));
    return () => {
      socket.off('call-offer');
    };
  }, []);

  const doLogout = async () => {
    await logout().catch(() => {});
    disconnectSocket();
    onLogout();
  };

  const openChat = (userId: number) => {
    setChatWith(userId);
    setActiveView('messages');
  };

  // Candidates cannot browse other candidates — only companies see the Talent directory.
  const navItems = [
    { id: 'dashboard' as AppView, label: t('app.dashboard'), icon: LayoutDashboard },
    { id: 'jobs' as AppView, label: isWorker ? t('app.findjobs') : t('app.myjobs'), icon: Briefcase },
    ...(!isWorker ? [{ id: 'talent' as AppView, label: t('app.talent'), icon: Users }] : []),
    { id: 'messages' as AppView, label: t('app.messages'), icon: MessageSquare },
    { id: 'profile' as AppView, label: t('app.profile'), icon: User },
    { id: 'support' as AppView, label: t('nav.support'), icon: LifeBuoy },
  ];

  const renderView = () => {
    switch (activeView) {
      case 'dashboard': return <DashboardView session={session} onActivate={() => setShowActivation(true)} onNavigate={setActiveView} />;
      case 'jobs': return <JobsView session={session} onActivate={() => setShowActivation(true)} />;
      case 'talent': return <TalentView session={session} onMessage={openChat} />;
      case 'messages': return <MessagesView session={session} initialUserId={chatWith} />;
      case 'profile': return <ProfileView session={session} onSession={onSession} />;
      case 'support': return <SupportView session={session} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {incomingCall && (
        <VideoCall incoming={incomingCall} myName={user.name} onClose={() => setIncomingCall(null)} />
      )}
      {showActivation && (
        <ActivationModal config={config} onClose={() => setShowActivation(false)}
          onPaid={(s) => { setShowActivation(false); onSession(s); }} />
      )}
      <AiAssistant context={activeView} />

      {/* Sidebar */}
      <div className="w-16 md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
        <div className="p-4 md:p-6">
          <div className="hidden md:block"><Logo size={30} /></div>
          <div className="md:hidden flex justify-center">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-black text-sm">NW</div>
          </div>
        </div>

        <nav className="flex-1 px-2 md:px-4 space-y-1 mt-2">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl transition-colors text-left justify-center md:justify-start ${
                activeView === item.id ? 'bg-green-50 text-primary font-semibold' : 'text-gray-600 hover:bg-gray-50 font-medium'
              }`}>
              <item.icon className={`w-5 h-5 shrink-0 ${activeView === item.id ? 'text-primary' : 'text-gray-400'}`} />
              <span className="hidden md:inline">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-2 md:p-4 border-t border-gray-100">
          <button onClick={doLogout}
            className="w-full flex items-center gap-3 px-3 md:px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 font-medium justify-center md:justify-start">
            <LogOut className="w-5 h-5 text-gray-400 shrink-0" />
            <span className="hidden md:inline">{t('app.logout')}</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 capitalize">
            {activeView === 'jobs' ? (isWorker ? t('app.findjobs') : t('app.myjobs'))
              : activeView === 'dashboard' ? t('app.dashboard')
              : activeView === 'messages' ? t('app.messages')
              : activeView === 'talent' ? t('app.talent')
              : activeView === 'profile' ? t('app.profile')
              : activeView === 'support' ? t('nav.support')
              : activeView}
          </h2>
          <div className="flex items-center gap-3">
            <LangToggle className="hidden sm:flex" />
            {isWorker && (
              user.paid ? (
                <span className="bg-green-50 text-primary px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4" /> Premium
                </span>
              ) : (
                <button onClick={() => setShowActivation(true)}
                  className="bg-amber-400 hover:bg-amber-500 text-dark px-4 py-1.5 rounded-full text-sm font-bold">
                  Go Premium — ${config.activationPrice}
                </button>
              )
            )}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                {user.picture ? (
                  <img src={user.picture} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="hidden sm:block text-sm font-semibold text-gray-700 max-w-[140px] truncate">{user.name}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50 p-4 md:p-8">
          <div className="max-w-5xl mx-auto h-full">{renderView()}</div>
        </main>
      </div>
    </div>
  );
}
