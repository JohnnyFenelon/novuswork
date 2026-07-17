import { useEffect, useState } from 'react';
import { Search, MapPin, MessageSquare, X, Briefcase, GraduationCap, Globe, Languages, Sparkles, Star, FileText } from 'lucide-react';
import { api, PROFESSIONS } from '../api';
import { Session, TalentCard } from '../types';
import { useT } from '../i18n';

interface Props {
  session: Session;
  onMessage: (userId: number) => void;
}

export default function TalentView({ session, onMessage }: Props) {
  const { t: tr } = useT();
  const [talent, setTalent] = useState<TalentCard[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [viewing, setViewing] = useState<any | null>(null);

  const load = () => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (category) params.set('category', category);
    api<TalentCard[]>(`/talent?${params}`).then(setTalent).catch(() => {});
  };
  useEffect(load, [category]);

  const openProfile = (id: number) =>
    api(`/users/${id}/profile`).then(setViewing).catch(() => {});

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col sm:flex-row gap-3">
        <div className="flex-1 flex items-center gap-2 border border-gray-300 rounded-lg px-3">
          <Search className="w-4 h-4 text-gray-400" />
          <input className="flex-1 py-2.5 outline-none text-sm" placeholder={tr('talent.searchph')}
            value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()} />
        </div>
        <select className="border border-gray-300 rounded-lg py-2.5 px-3 outline-none bg-white sm:w-56"
          value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">{tr('talent.allprof')}</option>
          {PROFESSIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
        <button onClick={load} className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark">{tr('jobs.search')}</button>
      </div>

      {talent.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400">
          {tr('talent.none')}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {talent.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden shrink-0">
                  {t.picture ? <img src={t.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> :
                    <div className="w-full h-full flex items-center justify-center text-sm font-bold text-gray-500">{t.name.slice(0, 2).toUpperCase()}</div>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button onClick={() => openProfile(t.id)} className="font-bold text-gray-900 hover:text-primary text-left">{t.name}</button>
                    {t.premium && (
                      <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded-full">⭐ TOP CANDIDATE</span>
                    )}
                    {t.promoted && (
                      <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Promoted
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-1">{t.headline}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-400">
                    <span className="bg-green-50 text-primary px-2 py-0.5 rounded-full font-bold">{t.profession}</span>
                    {t.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{t.location}</span>}
                    {t.hourly_rate && <span className="font-semibold text-gray-600">${Number(t.hourly_rate)}/hr</span>}
                    {t.avg_rating && <span className="flex items-center gap-0.5 font-bold text-amber-500"><Star className="w-3 h-3 fill-current" /> {Number(t.avg_rating).toFixed(1)}</span>}
                    {t.cv_url && <span className="flex items-center gap-0.5 text-blue-600"><FileText className="w-3 h-3" /> CV</span>}
                  </div>
                </div>
              </div>
              {t.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {t.skills.slice(0, 5).map((s) => (
                    <span key={s} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-[11px] font-semibold">{s}</span>
                  ))}
                </div>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => openProfile(t.id)} className="flex-1 border border-gray-300 rounded-lg py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                  {tr('talent.view')}
                </button>
                {session.user.id !== t.id && (
                  <button onClick={() => onMessage(t.id)} className="flex-1 bg-primary hover:bg-primary-dark text-white rounded-lg py-2 text-sm font-bold flex items-center justify-center gap-1.5">
                    <MessageSquare className="w-4 h-4" /> {tr('talent.message')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Profile modal */}
      {viewing && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-auto">
            <button onClick={() => setViewing(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden shrink-0">
                {viewing.user.picture ? <img src={viewing.user.picture} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> :
                  <div className="w-full h-full flex items-center justify-center font-bold text-gray-500">{viewing.user.name.slice(0, 2).toUpperCase()}</div>}
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                  {viewing.user.name}
                  {viewing.profile?.promoted && (
                    <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Promoted
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">{viewing.profile?.headline}</p>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-400">
                  {viewing.profile?.profession && <span className="bg-green-50 text-primary px-2 py-0.5 rounded-full font-bold">{viewing.profile.profession}</span>}
                  {viewing.profile?.location && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{viewing.profile.location}</span>}
                  {viewing.profile?.hourly_rate && <span className="font-semibold text-gray-600">${Number(viewing.profile.hourly_rate)}/hr · {viewing.profile.availability}</span>}
                  {viewing.rating?.avg_rating && <span className="flex items-center gap-0.5 font-bold text-amber-500"><Star className="w-3 h-3 fill-current" /> {Number(viewing.rating.avg_rating).toFixed(1)} ({viewing.rating.total_ratings})</span>}
                </div>
              </div>
            </div>

            {viewing.profile?.bio && <p className="mt-4 text-sm text-gray-700 whitespace-pre-line">{viewing.profile.bio}</p>}

            {viewing.profile?.job_seeking && (
              <p className="mt-3 text-sm"><span className="font-bold text-gray-900">Looking for:</span> <span className="text-gray-600">{viewing.profile.job_seeking}</span></p>
            )}

            {viewing.profile?.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {viewing.profile.skills.map((s: string) => (
                  <span key={s} className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full text-xs font-semibold">{s}</span>
                ))}
              </div>
            )}

            {viewing.experiences?.length > 0 && (
              <div className="mt-5">
                <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary" /> Work experience</h4>
                <div className="space-y-3">
                  {viewing.experiences.map((e: any) => (
                    <div key={e.id} className="bg-gray-50 rounded-xl p-4">
                      <p className="font-bold text-sm text-gray-900">{e.title} {e.company && <span className="font-medium text-gray-500">· {e.company}</span>}</p>
                      {e.years && <p className="text-xs text-gray-400">{e.years}</p>}
                      {e.description && <p className="text-sm text-gray-600 mt-1">{e.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
              {viewing.profile?.education && <p className="flex items-center gap-1.5"><GraduationCap className="w-4 h-4 text-gray-400" /> {viewing.profile.education}</p>}
              {viewing.profile?.languages && <p className="flex items-center gap-1.5"><Languages className="w-4 h-4 text-gray-400" /> {viewing.profile.languages}</p>}
              {viewing.profile?.links?.portfolio && (
                <a href={viewing.profile.links.portfolio} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                  <Globe className="w-4 h-4" /> Portfolio
                </a>
              )}
              {viewing.profile?.cv_url && (
                <a href={viewing.profile.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-blue-600 font-semibold hover:underline">
                  <FileText className="w-4 h-4" /> View CV
                </a>
              )}
            </div>

            {session.user.id !== viewing.user.id && (
              <button onClick={() => { onMessage(viewing.user.id); setViewing(null); }}
                className="mt-6 w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                <MessageSquare className="w-4 h-4" /> Message {viewing.user.name.split(' ')[0]}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
