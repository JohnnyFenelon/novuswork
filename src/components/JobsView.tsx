import { useEffect, useState } from 'react';
import { Search, MapPin, Clock, DollarSign, Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { api, PROFESSIONS } from '../api';
import { Job, Session } from '../types';
import { useT } from '../i18n';

const inputCls = 'w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white';

interface Props {
  session: Session;
  onActivate: () => void;
}

export default function JobsView({ session, onActivate }: Props) {
  const isWorker = session.user.role === 'worker';
  return isWorker ? <WorkerJobs session={session} onActivate={onActivate} /> : <CompanyJobs />;
}

/* ─────────────── Worker: browse + apply ─────────────── */
function WorkerJobs({ onActivate }: Props) {
  const { t } = useT();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [applying, setApplying] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [notice, setNotice] = useState('');
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    api<Job[]>(`/jobs?${params}`).then(setJobs).catch(() => {});
  };
  useEffect(load, [category]);
  useEffect(() => {
    api<any[]>('/applications/mine')
      .then((rows) => setAppliedIds(new Set(rows.map((r) => r.job_id))))
      .catch(() => {});
  }, []);

  const apply = async () => {
    if (!applying) return;
    try {
      await api(`/jobs/${applying.id}/apply`, { method: 'POST', body: JSON.stringify({ cover_letter: coverLetter }) });
      setAppliedIds(new Set([...appliedIds, applying.id]));
      setApplying(null);
      setCoverLetter('');
      setNotice(t('jobs.appsent'));
    } catch (e: any) {
      if (e.status === 402) { setApplying(null); onActivate(); }
      else setNotice(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {notice && (
        <div className="bg-green-50 border border-green-200 text-primary rounded-xl p-3 text-sm font-semibold flex justify-between items-center">
          {notice}
          <button onClick={() => setNotice('')}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Search bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input className="flex-1 py-2.5 outline-none text-sm" placeholder={t('jobs.searchph')}
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
        <select className={`${inputCls} sm:w-56`} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{t('jobs.allcats')}</option>
          {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button onClick={load} className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark">{t('jobs.search')}</button>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          {t('jobs.none')}
        </div>
      ) : (
        jobs.map((job) => (
          <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
                <p className="text-sm text-gray-500 font-medium">{job.company_name}</p>
              </div>
              {appliedIds.has(job.id) ? (
                <span className="bg-gray-100 text-gray-500 font-bold px-5 py-2 rounded-lg text-sm shrink-0">{t('jobs.applied')}</span>
              ) : (
                <button onClick={() => setApplying(job)}
                  className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2 rounded-lg text-sm shrink-0">
                  {t('jobs.applynow')}
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500 font-medium">
              {job.category && <span className="bg-green-50 text-primary px-2.5 py-1 rounded-full font-bold">{job.category}</span>}
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.job_type}</span>
              <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
              {job.budget && <span className="flex items-center gap-1"><DollarSign className="w-3.5 h-3.5" /> {job.budget}</span>}
            </div>
            {job.description && <p className="mt-3 text-sm text-gray-600 line-clamp-3 whitespace-pre-line">{job.description}</p>}
          </div>
        ))
      )}

      {/* Apply modal */}
      {applying && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative">
            <button onClick={() => setApplying(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-gray-900 mb-1">{t('jobs.applyto')}: {applying.title}</h3>
            <p className="text-sm text-gray-500 mb-4">{applying.company_name}</p>
            <label className="block text-sm font-semibold text-gray-700 mb-1">{t('jobs.cover')}</label>
            <textarea className={inputCls} rows={5} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
              placeholder={t('jobs.coverph')} />
            <button onClick={apply} className="mt-4 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl">
              {t('jobs.sendapp')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────── Company: post + manage ─────────────── */
function CompanyJobs() {
  const { t } = useT();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [form, setForm] = useState({ title: '', category: PROFESSIONS[0] as string, description: '', job_type: 'full-time', budget: '', location: 'Remote' });
  const [error, setError] = useState('');

  const load = () => api<Job[]>('/jobs/mine').then(setJobs).catch(() => {});
  useEffect(() => { load(); }, []);

  const post = async () => {
    try {
      await api('/jobs', { method: 'POST', body: JSON.stringify(form) });
      setShowForm(false);
      setForm({ title: '', category: PROFESSIONS[0], description: '', job_type: 'full-time', budget: '', location: 'Remote' });
      load();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-500">{t('jobs.postjobdesc')}</p>
        <button onClick={() => setShowForm(true)} className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-lg text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('jobs.postjob')}
        </button>
      </div>

      {jobs.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          {t('jobs.companynone')}
        </div>
      )}

      {jobs.map((job) => (
        <div key={job.id} className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-lg text-gray-900">{job.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{job.category} · {job.job_type} · {job.location} · {t('jobs.posted')} {new Date(job.created_at).toLocaleDateString()}</p>
            </div>
            <button onClick={() => setExpanded(expanded === job.id ? null : job.id)}
              className="flex items-center gap-1.5 text-sm font-bold text-primary bg-green-50 px-4 py-2 rounded-lg">
              {job.applications?.length || 0} {t('jobs.applicants')} {expanded === job.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          {expanded === job.id && (
            <div className="mt-4 border-t border-gray-100 pt-4 space-y-3">
              {(job.applications || []).length === 0 && <p className="text-sm text-gray-400">{t('jobs.noapps')}</p>}
              {(job.applications || []).map((a) => (
                <div key={a.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden shrink-0">
                    {a.worker_picture ? <img src={a.worker_picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> :
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">{(a.worker_name || '?').slice(0, 2).toUpperCase()}</div>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900">{a.worker_name}</p>
                    <p className="text-xs text-gray-500">{a.headline || a.profession}</p>
                    {a.cover_letter && <p className="text-sm text-gray-600 mt-2 whitespace-pre-line">{a.cover_letter}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 relative max-h-[90vh] overflow-auto">
            <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{t('jobs.newjob')}</h3>
            <div className="space-y-3">
              <div><label className="text-sm font-semibold text-gray-700">{t('jobs.jobtitle')} *</label>
                <input className={inputCls} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Bilingual Customer Service Agent" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-semibold text-gray-700">{t('jobs.category')}</label>
                  <select className={inputCls} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
                  </select></div>
                <div><label className="text-sm font-semibold text-gray-700">{t('jobs.type')}</label>
                  <select className={inputCls} value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })}>
                    <option value="full-time">{t('jobs.fulltime')}</option><option value="part-time">{t('jobs.parttime')}</option><option value="contract">{t('jobs.contract')}</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-semibold text-gray-700">{t('jobs.pay')}</label>
                  <input className={inputCls} value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="e.g. $6-9/hr" /></div>
                <div><label className="text-sm font-semibold text-gray-700">{t('jobs.location')}</label>
                  <input className={inputCls} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
              </div>
              <div><label className="text-sm font-semibold text-gray-700">{t('jobs.desc')}</label>
                <textarea className={inputCls} rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder={t('jobs.descph')} /></div>
              {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
              <button onClick={post} className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl">{t('jobs.publish')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
