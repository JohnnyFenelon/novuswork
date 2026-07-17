import { useState } from 'react';
import { MapPin, BadgeCheck, Mail, Phone, Edit2, X, Briefcase, GraduationCap, Languages, Globe } from 'lucide-react';
import { api, PROFESSIONS } from '../api';
import { Session } from '../types';
import { useT } from '../i18n';
import AvatarUpload from './AvatarUpload';

const inputCls = 'w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white';

interface Props {
  session: Session;
  onSession: (s: Session) => void;
}

export default function ProfileView({ session, onSession }: Props) {
  const { t } = useT();
  const { user, profile, experiences, company } = session;
  const isWorker = user.role === 'worker';
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <AvatarUpload picture={user.picture} name={user.name} size={80} onUploaded={onSession} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold text-gray-900">{isWorker ? user.name : company?.company_name || user.name}</h1>
              {isWorker && user.paid && <BadgeCheck className="w-5 h-5 text-primary" />}
            </div>
            {isWorker && <p className="text-gray-600 font-medium">{profile?.headline}</p>}
            {!isWorker && <p className="text-gray-600 font-medium">{company?.industry} {company?.size ? `· ${company.size} employees` : ''}</p>}
            <div className="flex flex-wrap gap-3 mt-2 text-sm text-gray-500">
              {(isWorker ? profile?.location : company?.location) && (
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {isWorker ? profile?.location : company?.location}</span>
              )}
              <span className="flex items-center gap-1"><Mail className="w-4 h-4" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1"><Phone className="w-4 h-4" /> {user.phone}</span>}
            </div>
          </div>
          <button onClick={() => setEditing(true)}
            className="flex items-center gap-2 border border-gray-300 rounded-lg px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 shrink-0">
            <Edit2 className="w-4 h-4" /> {t('prof.edit')}
          </button>
        </div>

        {isWorker && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
            <Fact label="Profession" value={profile?.profession || '—'} />
            <Fact label="Rate" value={profile?.hourly_rate ? `$${Number(profile.hourly_rate)}/hr` : '—'} />
            <Fact label="Availability" value={profile?.availability || '—'} />
            <Fact label="Experience" value={profile?.years_total ? `${Number(profile.years_total)} yrs` : '—'} />
          </div>
        )}
      </div>

      {/* About */}
      {isWorker ? (
        <>
          {profile?.bio && (
            <Card title="About me"><p className="text-sm text-gray-700 whitespace-pre-line">{profile.bio}</p></Card>
          )}
          {profile?.job_seeking && (
            <Card title="Looking for"><p className="text-sm text-gray-700">{profile.job_seeking}</p></Card>
          )}
          {(profile?.skills?.length || 0) > 0 && (
            <Card title="Skills">
              <div className="flex flex-wrap gap-2">
                {profile!.skills.map((s) => (
                  <span key={s} className="bg-green-50 text-primary px-3 py-1 rounded-full text-sm font-semibold">{s}</span>
                ))}
              </div>
            </Card>
          )}
          {(experiences?.length || 0) > 0 && (
            <Card title="Work experience" icon={<Briefcase className="w-4 h-4 text-primary" />}>
              <div className="space-y-3">
                {experiences!.map((e, i) => (
                  <div key={i} className="bg-gray-50 rounded-xl p-4">
                    <p className="font-bold text-sm text-gray-900">{e.title} {e.company && <span className="font-medium text-gray-500">· {e.company}</span>}</p>
                    {e.years && <p className="text-xs text-gray-400">{e.years}</p>}
                    {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
                  </div>
                ))}
              </div>
            </Card>
          )}
          <div className="grid sm:grid-cols-2 gap-4">
            {profile?.education && (
              <Card title="Education" icon={<GraduationCap className="w-4 h-4 text-primary" />}>
                <p className="text-sm text-gray-700">{profile.education}</p>
              </Card>
            )}
            {profile?.languages && (
              <Card title="Languages" icon={<Languages className="w-4 h-4 text-primary" />}>
                <p className="text-sm text-gray-700">{profile.languages}</p>
              </Card>
            )}
          </div>
          {(profile?.links?.portfolio || profile?.links?.linkedin) && (
            <Card title="Links" icon={<Globe className="w-4 h-4 text-primary" />}>
              <div className="flex flex-col gap-2 text-sm">
                {profile.links.portfolio && <a className="text-primary hover:underline" href={profile.links.portfolio} target="_blank" rel="noopener noreferrer">{profile.links.portfolio}</a>}
                {profile.links.linkedin && <a className="text-primary hover:underline" href={profile.links.linkedin} target="_blank" rel="noopener noreferrer">{profile.links.linkedin}</a>}
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          {company?.description && <Card title="About the company"><p className="text-sm text-gray-700 whitespace-pre-line">{company.description}</p></Card>}
          {(company?.hiring_roles?.length || 0) > 0 && (
            <Card title="Hiring for">
              <div className="flex flex-wrap gap-2">
                {company!.hiring_roles.map((r) => (
                  <span key={r} className="bg-green-50 text-primary px-3 py-1 rounded-full text-sm font-semibold">{r}</span>
                ))}
              </div>
            </Card>
          )}
          {company?.website && (
            <Card title="Website" icon={<Globe className="w-4 h-4 text-primary" />}>
              <a className="text-primary hover:underline text-sm" href={company.website} target="_blank" rel="noopener noreferrer">{company.website}</a>
            </Card>
          )}
        </>
      )}

      {editing && <EditModal session={session} onClose={() => setEditing(false)} onSession={onSession} />}
    </div>
  );
}

function Card({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <h2 className="font-bold text-gray-900 mb-3 flex items-center gap-2">{icon}{title}</h2>
      {children}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-3">
      <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
      <p className="font-bold text-gray-900 text-sm capitalize truncate">{value}</p>
    </div>
  );
}

/* Quick edit of the most important fields */
function EditModal({ session, onClose, onSession }: { session: Session; onClose: () => void; onSession: (s: Session) => void }) {
  const isWorker = session.user.role === 'worker';
  const p = session.profile;
  const c = session.company;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: session.user.name,
    phone: session.user.phone,
    headline: p?.headline || '',
    profession: p?.profession || '',
    bio: p?.bio || '',
    job_seeking: p?.job_seeking || '',
    hourly_rate: p?.hourly_rate ? String(Number(p.hourly_rate)) : '',
    availability: p?.availability || 'full-time',
    location: p?.location || '',
    education: p?.education || '',
    languages: p?.languages || '',
    skills: (p?.skills || []).join(', '),
    company_name: c?.company_name || '',
    website: c?.website || '',
    industry: c?.industry || '',
    description: c?.description || '',
    company_location: c?.location || '',
  });
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });

  const save = async () => {
    setBusy(true);
    setError('');
    try {
      const body = isWorker
        ? {
            name: form.name, phone: form.phone,
            profile: {
              headline: form.headline, profession: form.profession, bio: form.bio,
              job_seeking: form.job_seeking,
              hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
              availability: form.availability, location: form.location,
              education: form.education, languages: form.languages,
              years_total: p?.years_total ? Number(p.years_total) : null,
              skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
              links: p?.links || {},
            },
            experiences: session.experiences,
          }
        : {
            name: form.name, phone: form.phone,
            company: {
              company_name: form.company_name, website: form.website, industry: form.industry,
              size: c?.size || '', location: form.company_location,
              description: form.description, hiring_roles: c?.hiring_roles || [],
            },
          };
      const s = await api<Session>('/me/profile', { method: 'PUT', body: JSON.stringify(body) });
      onSession(s);
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
        <h3 className="text-xl font-bold text-gray-900 mb-4">Edit profile</h3>
        <div className="space-y-3">
          <div><label className="text-sm font-semibold text-gray-700">Name</label>
            <input className={inputCls} value={form.name} onChange={(e) => set('name', e.target.value)} /></div>
          <div><label className="text-sm font-semibold text-gray-700">Phone</label>
            <input className={inputCls} value={form.phone} onChange={(e) => set('phone', e.target.value)} /></div>
          {isWorker ? (
            <>
              <div><label className="text-sm font-semibold text-gray-700">Headline</label>
                <input className={inputCls} value={form.headline} onChange={(e) => set('headline', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">Profession</label>
                <select className={inputCls} value={form.profession} onChange={(e) => set('profession', e.target.value)}>
                  <option value="">Select…</option>
                  {PROFESSIONS.map((x) => <option key={x}>{x}</option>)}
                </select></div>
              <div><label className="text-sm font-semibold text-gray-700">Looking for</label>
                <input className={inputCls} value={form.job_seeking} onChange={(e) => set('job_seeking', e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-semibold text-gray-700">Rate ($/hr)</label>
                  <input className={inputCls} type="number" value={form.hourly_rate} onChange={(e) => set('hourly_rate', e.target.value)} /></div>
                <div><label className="text-sm font-semibold text-gray-700">Availability</label>
                  <select className={inputCls} value={form.availability} onChange={(e) => set('availability', e.target.value)}>
                    <option value="full-time">Full-time</option><option value="part-time">Part-time</option><option value="contract">Contract</option>
                  </select></div>
              </div>
              <div><label className="text-sm font-semibold text-gray-700">Location</label>
                <input className={inputCls} value={form.location} onChange={(e) => set('location', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">Skills (comma separated)</label>
                <input className={inputCls} value={form.skills} onChange={(e) => set('skills', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">Education</label>
                <input className={inputCls} value={form.education} onChange={(e) => set('education', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">Languages</label>
                <input className={inputCls} value={form.languages} onChange={(e) => set('languages', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">About me</label>
                <textarea className={inputCls} rows={4} value={form.bio} onChange={(e) => set('bio', e.target.value)} /></div>
            </>
          ) : (
            <>
              <div><label className="text-sm font-semibold text-gray-700">Company name</label>
                <input className={inputCls} value={form.company_name} onChange={(e) => set('company_name', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">Website</label>
                <input className={inputCls} value={form.website} onChange={(e) => set('website', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">Industry</label>
                <input className={inputCls} value={form.industry} onChange={(e) => set('industry', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">Location</label>
                <input className={inputCls} value={form.company_location} onChange={(e) => set('company_location', e.target.value)} /></div>
              <div><label className="text-sm font-semibold text-gray-700">About</label>
                <textarea className={inputCls} rows={4} value={form.description} onChange={(e) => set('description', e.target.value)} /></div>
            </>
          )}
          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
          <button onClick={save} disabled={busy}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
