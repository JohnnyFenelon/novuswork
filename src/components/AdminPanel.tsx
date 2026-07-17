import { useEffect, useState } from 'react';
import {
  Users, Briefcase, FileText, LifeBuoy, LogOut, Video, Mail, MessageSquare,
  BadgeCheck, Ban, X, RefreshCw, Circle, LayoutDashboard, TrendingUp
} from 'lucide-react';
import { UserPlus } from 'lucide-react';
import { api, logout, PROFESSIONS } from '../api';
import { getSocket, disconnectSocket } from '../realtime';
import { useHistoryNav } from '../history';
import { AdminUser, Session } from '../types';
import VideoCall, { IncomingCall } from './VideoCall';
import MessagesView from './MessagesView';

interface Props {
  session: Session;
  onLogout: () => void;
}

type Tab = 'overview' | 'users' | 'messages' | 'support' | 'jobs';

export default function AdminPanel({ session, onLogout }: Props) {
  const [tab, setTab] = useHistoryNav<Tab>('overview', 'atab');
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [viewing, setViewing] = useState<any | null>(null);
  const [emailTo, setEmailTo] = useState<AdminUser | null>(null);
  const [calling, setCalling] = useState<{ id: number; name: string } | null>(null);
  const [incoming, setIncoming] = useState<IncomingCall | null>(null);
  const [chatWith, setChatWith] = useState<number | null>(null);
  const [notice, setNotice] = useState('');
  const [showAddUser, setShowAddUser] = useState(false);

  const loadAll = () => {
    api('/admin/stats').then(setStats).catch(() => {});
    api<AdminUser[]>('/admin/users').then(setUsers).catch(() => {});
    api('/admin/support').then(setTickets).catch(() => {});
    api<any[]>('/jobs').then(setJobs).catch(() => {});
  };

  useEffect(() => {
    loadAll();
    const socket = getSocket();
    socket.on('presence', (ids: number[]) => {
      const online = new Set(ids);
      setUsers((prev) => prev.map((u) => ({ ...u, online: online.has(u.id) })));
      setStats((prev: any) => (prev ? { ...prev, online: ids.length } : prev));
    });
    socket.on('call-offer', (call: IncomingCall) => setIncoming(call));
    return () => {
      socket.off('presence');
      socket.off('call-offer');
    };
  }, []);

  const doLogout = async () => {
    await logout().catch(() => {});
    disconnectSocket();
    onLogout();
  };

  const toggle = async (u: AdminUser, action: 'activate' | 'ban') => {
    await api(`/admin/users/${u.id}/${action}`, { method: 'POST' }).catch(() => {});
    api<AdminUser[]>('/admin/users').then(setUsers).catch(() => {});
  };

  const togglePromote = async (u: AdminUser) => {
    const action = u.promoted ? 'unpromote' : 'promote';
    await api(`/admin/users/${u.id}/${action}`, { method: 'POST' }).catch(() => {});
    api<AdminUser[]>('/admin/users').then(setUsers).catch(() => {});
  };

  const completeJob = async (id: number) => {
    await api(`/admin/jobs/${id}/complete`, { method: 'POST' }).catch(() => {});
    api<any[]>('/jobs').then(setJobs).catch(() => {});
  };

  const openChat = (id: number) => { setChatWith(id); setTab('messages'); };

  const onlineCount = users.filter((u) => u.online).length;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {calling && <VideoCall callee={calling} myName="NovusWork Admin" onClose={() => setCalling(null)} />}
      {incoming && <VideoCall incoming={incoming} myName="NovusWork Admin" onClose={() => setIncoming(null)} />}

      {/* Sidebar */}
      <div className="w-16 md:w-60 bg-dark text-white flex flex-col shrink-0">
        <div className="p-4 md:p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-black text-sm shrink-0">NW</div>
          <div className="hidden md:block">
            <p className="font-extrabold leading-none">NovusWork</p>
            <p className="text-[10px] text-gray-400 tracking-widest uppercase">Admin Console</p>
          </div>
        </div>
        <nav className="flex-1 px-2 md:px-3 space-y-1 mt-4">
          {([
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'support', label: 'Support', icon: LifeBuoy },
            { id: 'jobs', label: 'Jobs', icon: Briefcase },
          ] as { id: Tab; label: string; icon: any }[]).map((item) => (
            <button key={item.id} onClick={() => setTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left justify-center md:justify-start ${
                tab === item.id ? 'bg-white/10 text-white font-semibold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}>
              <item.icon className="w-5 h-5 shrink-0" />
              <span className="hidden md:inline text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-2 md:p-3">
          <button onClick={doLogout}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-400 hover:bg-red-500/20 hover:text-red-400 justify-center md:justify-start">
            <LogOut className="w-5 h-5 shrink-0" /><span className="hidden md:inline text-sm">Log out</span>
          </button>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 md:px-8 shrink-0">
          <h2 className="text-xl font-bold text-gray-800 capitalize">{tab}</h2>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 bg-green-50 text-primary px-3 py-1.5 rounded-full text-sm font-bold">
              <Circle className="w-2.5 h-2.5 fill-current animate-pulse" /> {onlineCount} online now
            </span>
            <button onClick={loadAll} className="p-2 rounded-full hover:bg-gray-100 text-gray-500"><RefreshCw className="w-4 h-4" /></button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">
            {notice && (
              <div className="mb-4 bg-green-50 border border-green-200 text-primary rounded-xl p-3 text-sm font-semibold flex justify-between">
                {notice}<button onClick={() => setNotice('')}><X className="w-4 h-4" /></button>
              </div>
            )}

            {tab === 'overview' && stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="Total users" value={stats.users} icon={<Users className="w-5 h-5 text-primary" />} />
                <Stat label="Online now" value={stats.online} icon={<Circle className="w-5 h-5 text-primary fill-current" />} />
                <Stat label="Job seekers" value={stats.workers} icon={<Users className="w-5 h-5 text-primary" />} />
                <Stat label="Companies" value={stats.companies} icon={<Briefcase className="w-5 h-5 text-primary" />} />
                <Stat label="Premium members" value={stats.paid} icon={<BadgeCheck className="w-5 h-5 text-primary" />} />
                <Stat label="Jobs posted" value={stats.jobs} icon={<Briefcase className="w-5 h-5 text-primary" />} />
                <Stat label="Applications" value={stats.applications} icon={<FileText className="w-5 h-5 text-primary" />} />
                <Stat label="Support tickets" value={stats.tickets} icon={<LifeBuoy className="w-5 h-5 text-primary" />} />
              </div>
            )}

            {tab === 'users' && (
             <>
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">{users.length} registered users · {onlineCount} online</p>
                <button onClick={() => setShowAddUser(true)}
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-4 py-2 rounded-lg text-sm flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Add user
                </button>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                      <tr>
                        <th className="text-left px-4 py-3 font-semibold">User</th>
                        <th className="text-left px-4 py-3 font-semibold">Role</th>
                        <th className="text-left px-4 py-3 font-semibold">Phone</th>
                        <th className="text-left px-4 py-3 font-semibold">Status</th>
                        <th className="text-right px-4 py-3 font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <button onClick={() => api(`/users/${u.id}/profile`).then(setViewing).catch(() => {})}
                              className="flex items-center gap-3 text-left">
                              <div className="relative shrink-0">
                                <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden">
                                  {u.picture ? <img src={u.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> :
                                    <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{u.name.slice(0, 2).toUpperCase()}</div>}
                                </div>
                                <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${u.online ? 'bg-green-500' : 'bg-gray-300'}`} />
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-900 hover:text-primary truncate">{u.name}</p>
                                <p className="text-xs text-gray-400 truncate">{u.email}</p>
                              </div>
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <span className="capitalize text-gray-600">{u.role}</span>
                            <p className="text-xs text-gray-400 truncate max-w-[140px]">{u.company_name || u.profession || ''}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{u.phone || '—'}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              {u.online
                                ? <span className="text-green-600 text-xs font-bold">● Online</span>
                                : <span className="text-gray-400 text-xs">Last seen {u.last_seen ? new Date(u.last_seen).toLocaleString() : 'never'}</span>}
                              <div className="flex gap-1">
                                {u.paid && <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-1.5 py-0.5 rounded">⭐ PREMIUM</span>}
                                {u.promoted && <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded">PROMOTED</span>}
                                {u.banned && <span className="bg-red-50 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded">BANNED</span>}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-1">
                              <IconBtn title="Video call" disabled={!u.online} onClick={() => setCalling({ id: u.id, name: u.name })}>
                                <Video className="w-4 h-4" />
                              </IconBtn>
                              <IconBtn title="Send message" onClick={() => openChat(u.id)}><MessageSquare className="w-4 h-4" /></IconBtn>
                              <IconBtn title="Send email" onClick={() => setEmailTo(u)}><Mail className="w-4 h-4" /></IconBtn>
                              <IconBtn title={u.paid ? 'Remove Premium' : 'Grant Premium'} onClick={() => toggle(u, 'activate')}>
                                <BadgeCheck className={`w-4 h-4 ${u.paid ? 'text-primary' : ''}`} />
                              </IconBtn>
                              {u.role === 'worker' && (
                                <IconBtn title={u.promoted ? 'Unpromote' : 'Promote'} onClick={() => togglePromote(u)}>
                                  <TrendingUp className={`w-4 h-4 ${u.promoted ? 'text-blue-500' : ''}`} />
                                </IconBtn>
                              )}
                              <IconBtn title={u.banned ? 'Unban' : 'Ban'} onClick={() => toggle(u, 'ban')}>
                                <Ban className={`w-4 h-4 ${u.banned ? 'text-red-500' : ''}`} />
                              </IconBtn>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">No registered users yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
             </>
            )}

            {tab === 'messages' && <MessagesView session={session} initialUserId={chatWith} />}

            {tab === 'support' && (
              <div className="space-y-3">
                {tickets.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">No support tickets yet.</div>
                )}
                {tickets.map((t) => (
                  <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex justify-between items-start gap-3 flex-wrap">
                      <div>
                        <p className="font-bold text-gray-900">{t.subject || 'Support request'}</p>
                        <p className="text-xs text-gray-500">{t.name} · {t.email} · 📞 {t.phone}</p>
                      </div>
                      <span className="text-xs text-gray-400">{new Date(t.created_at).toLocaleString()}</span>
                    </div>
                    <p className="mt-3 text-sm text-gray-700 whitespace-pre-line">{t.message}</p>
                  </div>
                ))}
              </div>
            )}

            {tab === 'jobs' && (
              <div className="space-y-3">
                {jobs.length === 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">No jobs found.</div>
                )}
                {jobs.map((job) => (
                  <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900">{job.title}</h3>
                        {job.status === 'completed' && <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase">Completed</span>}
                      </div>
                      <p className="text-xs text-gray-500">{job.company_name} · {job.category} · {job.location}</p>
                    </div>
                    {job.status !== 'completed' && (
                      <button onClick={() => completeJob(job.id)} className="bg-primary hover:bg-primary-dark text-white text-xs font-bold px-4 py-2 rounded-lg">
                        Mark as Complete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Profile viewer modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-auto">
            <button onClick={() => setViewing(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{viewing.user.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{viewing.user.email} · {viewing.user.phone || 'no phone'}</p>
            {viewing.profile && (
              <div className="space-y-3 text-sm text-gray-700">
                <p><b>Headline:</b> {viewing.profile.headline || '—'}</p>
                <p><b>Profession:</b> {viewing.profile.profession || '—'} · <b>Rate:</b> {viewing.profile.hourly_rate ? `$${Number(viewing.profile.hourly_rate)}/hr` : '—'} · <b>Availability:</b> {viewing.profile.availability || '—'}</p>
                <p><b>Looking for:</b> {viewing.profile.job_seeking || '—'}</p>
                <p><b>Location:</b> {viewing.profile.location || '—'} · <b>Languages:</b> {viewing.profile.languages || '—'}</p>
                <p><b>Skills:</b> {(viewing.profile.skills || []).join(', ') || '—'}</p>
                <p><b>Education:</b> {viewing.profile.education || '—'}</p>
                {viewing.profile.bio && <p className="whitespace-pre-line"><b>Bio:</b> {viewing.profile.bio}</p>}
                {(viewing.experiences || []).length > 0 && (
                  <div>
                    <b>Experience:</b>
                    <ul className="list-disc ml-5 mt-1 space-y-1">
                      {viewing.experiences.map((e: any) => (
                        <li key={e.id}>{e.title}{e.company ? ` @ ${e.company}` : ''}{e.years ? ` (${e.years})` : ''}{e.description ? ` — ${e.description}` : ''}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            {viewing.company && (
              <div className="space-y-2 text-sm text-gray-700">
                <p><b>Company:</b> {viewing.company.company_name}</p>
                <p><b>Industry:</b> {viewing.company.industry || '—'} · <b>Size:</b> {viewing.company.size || '—'}</p>
                <p><b>Website:</b> {viewing.company.website || '—'} · <b>Location:</b> {viewing.company.location || '—'}</p>
                <p><b>Hiring for:</b> {(viewing.company.hiring_roles || []).join(', ') || '—'}</p>
                {viewing.company.description && <p className="whitespace-pre-line"><b>About:</b> {viewing.company.description}</p>}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Send email modal */}
      {emailTo && (
        <EmailModal user={emailTo} onClose={() => setEmailTo(null)} onSent={() => { setEmailTo(null); setNotice(`Email sent to ${emailTo.name}`); }} />
      )}

      {/* Add user modal */}
      {showAddUser && (
        <AddUserModal
          onClose={() => setShowAddUser(false)}
          onAdded={(name) => { setShowAddUser(false); setNotice(`User ${name} added`); loadAll(); }}
        />
      )}
    </div>
  );
}

function AddUserModal({ onClose, onAdded }: { onClose: () => void; onAdded: (name: string) => void }) {
  const [role, setRole] = useState<'worker' | 'company'>('worker');
  const [form, setForm] = useState({ email: '', name: '', phone: '', profession: PROFESSIONS[0] as string, company_name: '', premium: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const submit = async () => {
    if (!form.email.trim() || !form.name.trim()) return setError('Email and name are required');
    setBusy(true);
    setError('');
    try {
      await api('/admin/users', { method: 'POST', body: JSON.stringify({ ...form, role }) });
      onAdded(form.name);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Add a user</h3>
        <p className="text-sm text-gray-500 mb-4">Create an account manually. They can later sign in with Google using the same email to claim it.</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => setRole('worker')}
            className={`p-3 rounded-xl border-2 text-sm font-bold ${role === 'worker' ? 'border-primary bg-green-50 text-primary' : 'border-gray-200 text-gray-600'}`}>
            Candidate
          </button>
          <button onClick={() => setRole('company')}
            className={`p-3 rounded-xl border-2 text-sm font-bold ${role === 'company' ? 'border-primary bg-green-50 text-primary' : 'border-gray-200 text-gray-600'}`}>
            Company
          </button>
        </div>
        <div className="space-y-3">
          <input className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary" placeholder="Email *" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <input className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary" placeholder={role === 'company' ? 'Contact name *' : 'Full name *'} value={form.name} onChange={(e) => set('name', e.target.value)} />
          <input className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary" placeholder="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          {role === 'company' ? (
            <input className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary" placeholder="Company name" value={form.company_name} onChange={(e) => set('company_name', e.target.value)} />
          ) : (
            <>
              <select className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary bg-white" value={form.profession} onChange={(e) => set('profession', e.target.value)}>
                {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
              </select>
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" checked={form.premium} onChange={(e) => set('premium', e.target.checked)} className="w-4 h-4 accent-[color:var(--color-primary)]" />
                Grant Premium (Top Candidate)
              </label>
            </>
          )}
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button onClick={submit} disabled={busy} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {busy ? 'Adding…' : 'Add user'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-3">{icon}</div>
      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function IconBtn({ title, onClick, disabled, children }: { title: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button title={title} onClick={onClick} disabled={disabled}
      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed">
      {children}
    </button>
  );
}

function EmailModal({ user, onClose, onSent }: { user: AdminUser; onClose: () => void; onSent: () => void }) {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await api<{ ok: boolean }>('/admin/email', {
        method: 'POST',
        body: JSON.stringify({ userId: user.id, subject, message }),
      });
      if (!res.ok) throw new Error('Email service is not configured');
      onSent();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
        <h3 className="text-xl font-bold text-gray-900 mb-1">Email {user.name}</h3>
        <p className="text-sm text-gray-500 mb-4">{user.email}</p>
        <div className="space-y-3">
          <input className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary"
            placeholder="Subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
          <textarea className="w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary"
            rows={6} placeholder="Write a personalized message…" value={message} onChange={(e) => setMessage(e.target.value)} />
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button onClick={send} disabled={busy || !message}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {busy ? 'Sending…' : 'Send email'}
          </button>
        </div>
      </div>
    </div>
  );
}
