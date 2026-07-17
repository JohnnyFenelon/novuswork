import { useEffect, useRef, useState } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { api } from '../api';
import { getSocket } from '../realtime';
import { Message, Session, Thread } from '../types';
import { useT } from '../i18n';

interface Props {
  session: Session;
  initialUserId?: number | null;
}

export default function MessagesView({ session, initialUserId }: Props) {
  const { t } = useT();
  const me = session.user.id;
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeId, setActiveId] = useState<number | null>(initialUserId ?? null);
  const [activeName, setActiveName] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;

  const loadThreads = () => api<Thread[]>('/messages/threads').then(setThreads).catch(() => {});

  useEffect(() => { loadThreads(); }, []);

  // If opened with a specific user (from Talent view), resolve their name
  useEffect(() => {
    if (initialUserId) {
      api(`/users/${initialUserId}/profile`)
        .then((p: any) => setActiveName(p.user.name))
        .catch(() => {});
      setActiveId(initialUserId);
    }
  }, [initialUserId]);

  useEffect(() => {
    if (!activeId) return;
    api<Message[]>(`/messages/${activeId}`).then(setMessages).catch(() => {});
  }, [activeId]);

  useEffect(() => {
    const socket = getSocket();
    const onMessage = (m: Message) => {
      if (m.from_id === activeIdRef.current) {
        setMessages((prev) => [...prev, m]);
      }
      loadThreads();
    };
    socket.on('message', onMessage);
    return () => { socket.off('message', onMessage); };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId) return;
    setDraft('');
    try {
      const m = await api<Message>(`/messages/${activeId}`, { method: 'POST', body: JSON.stringify({ body }) });
      setMessages((prev) => [...prev, m]);
      loadThreads();
    } catch {
      setDraft(body);
    }
  };

  const openThread = (t: Thread) => {
    setActiveId(t.id);
    setActiveName(t.name);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 h-[calc(100vh-10rem)] flex overflow-hidden">
      {/* Threads list */}
      <div className={`w-full sm:w-72 border-r border-gray-100 flex-col ${activeId ? 'hidden sm:flex' : 'flex'}`}>
        <div className="p-4 border-b border-gray-100 font-bold text-gray-900">{t('msg.conversations')}</div>
        <div className="flex-1 overflow-auto">
          {threads.length === 0 && (
            <p className="text-sm text-gray-400 p-4">{t('msg.none')}</p>
          )}
          {threads.map((t) => (
            <button key={t.id} onClick={() => openThread(t)}
              className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 ${activeId === t.id ? 'bg-green-50' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                {t.picture ? <img src={t.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> :
                  <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{t.name.slice(0, 2).toUpperCase()}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-sm text-gray-900 truncate">{t.name}</p>
                  {t.unread > 0 && <span className="bg-primary text-white text-[10px] font-bold rounded-full px-1.5 py-0.5">{t.unread}</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{t.last_message}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className={`flex-1 flex-col ${activeId ? 'flex' : 'hidden sm:flex'}`}>
        {activeId ? (
          <>
            <div className="p-4 border-b border-gray-100 flex items-center gap-3">
              <button onClick={() => setActiveId(null)} className="sm:hidden text-gray-400">←</button>
              <p className="font-bold text-gray-900">{activeName || 'Conversation'}</p>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3 bg-gray-50">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.from_id === me ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.from_id === me ? 'bg-primary text-white rounded-br-sm' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                  }`}>
                    <p className="whitespace-pre-line break-words">{m.body}</p>
                    <p className={`text-[10px] mt-1 ${m.from_id === me ? 'text-green-100' : 'text-gray-400'}`}>
                      {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <input className="flex-1 border border-gray-300 rounded-full py-2.5 px-4 outline-none focus:border-primary text-sm"
                placeholder={t('msg.typemsg')} value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()} />
              <button onClick={send} className="w-11 h-11 bg-primary hover:bg-primary-dark text-white rounded-full flex items-center justify-center">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300 flex-col gap-3">
            <MessageSquare className="w-12 h-12" />
            <p className="text-sm text-gray-400">{t('msg.select')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
