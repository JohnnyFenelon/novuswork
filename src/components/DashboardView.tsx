import { useEffect, useState } from 'react';
import { Briefcase, FileText, BadgeCheck, AlertCircle, ArrowRight } from 'lucide-react';
import { api } from '../api';
import { AppView, Job, JobApplication, Session } from '../types';
import { useT } from '../i18n';

interface Props {
  session: Session;
  onActivate: () => void;
  onNavigate: (v: AppView) => void;
}

export default function DashboardView({ session, onActivate, onNavigate }: Props) {
  const { t } = useT();
  const user = session.user;
  const isWorker = user.role === 'worker';
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);

  useEffect(() => {
    if (isWorker) {
      api<JobApplication[]>('/applications/mine').then(setApplications).catch(() => {});
    } else {
      api<Job[]>('/jobs/mine').then(setMyJobs).catch(() => {});
    }
  }, [isWorker]);

  return (
    <div className="space-y-6">
      {/* Welcome / status */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h1 className="text-2xl font-extrabold text-gray-900">{t('dash.welcome')}, {user.name.split(' ')[0]} 👋</h1>
        {isWorker && !user.paid && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-500 shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-gray-900 text-sm">{t('dash.premium.title')}</p>
              <p className="text-sm text-gray-600">{t('dash.premium.desc')}</p>
            </div>
            <button onClick={onActivate} className="bg-primary hover:bg-primary-dark text-white font-bold px-5 py-2.5 rounded-lg text-sm shrink-0">
              {t('dash.gopremium')}
            </button>
          </div>
        )}
        {isWorker && user.paid && (
          <p className="mt-2 text-sm text-primary font-semibold flex items-center gap-1.5">
            <BadgeCheck className="w-4 h-4" /> {t('dash.premium.active')}
          </p>
        )}
        {!isWorker && (
          <p className="mt-2 text-sm text-gray-500">{t('dash.company.hint')}</p>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {isWorker ? (
          <>
            <StatCard icon={<FileText className="w-5 h-5 text-primary" />} label={t('dash.stat.apps')} value={applications.length} />
            <StatCard icon={<BadgeCheck className="w-5 h-5 text-primary" />} label={t('dash.stat.member')} value={user.paid ? t('dash.premium') : t('dash.free')} />
            <StatCard icon={<Briefcase className="w-5 h-5 text-primary" />} label={t('dash.stat.prof')} value={session.profile?.profession || '—'} />
          </>
        ) : (
          <>
            <StatCard icon={<Briefcase className="w-5 h-5 text-primary" />} label={t('dash.stat.jobsposted')} value={myJobs.length} />
            <StatCard icon={<FileText className="w-5 h-5 text-primary" />} label={t('dash.stat.applicants')} value={myJobs.reduce((n, j) => n + (j.applications?.length || 0), 0)} />
            <StatCard icon={<BadgeCheck className="w-5 h-5 text-primary" />} label={t('dash.stat.company')} value={session.company?.company_name || '—'} />
          </>
        )}
      </div>

      {/* External Resources */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <a href="https://cvgratis2.duckdns.org" target="_blank" rel="noopener noreferrer" className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between hover:border-primary transition-colors group">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-gray-900 text-lg">Create a Professional CV</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">Build an outstanding resume for free and increase your chances of getting hired.</p>
          </div>
          <span className="text-primary font-bold text-sm flex items-center gap-1 group-hover:underline">
            Visit cvgratis2.duckdns.org <ArrowRight className="w-4 h-4" />
          </span>
        </a>
        <a href="https://academia809.com/" target="_blank" rel="noopener noreferrer" className="bg-gradient-to-br from-primary to-green-700 rounded-2xl p-6 flex flex-col justify-between text-white hover:opacity-95 transition-opacity group shadow-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <BadgeCheck className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white text-lg">Enhance your skills with courses at Academia809</h3>
            </div>
            <p className="text-green-50 text-sm mb-4">Train for your dream job with premium courses and certifications.</p>
          </div>
          <span className="text-white font-bold text-sm flex items-center gap-1 group-hover:underline">
            Start learning now <ArrowRight className="w-4 h-4" />
          </span>
        </a>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">{isWorker ? t('dash.recent.apps') : t('dash.recent.jobs')}</h2>
          <button onClick={() => onNavigate('jobs')} className="text-primary text-sm font-semibold flex items-center gap-1 hover:underline">
            {isWorker ? t('dash.browsejobs') : t('dash.managejobs')} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        {isWorker ? (
          applications.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">{t('dash.noapps')}</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {applications.slice(0, 5).map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.company_name} · {new Date(a.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    a.status === 'accepted' ? 'bg-green-50 text-primary' :
                    a.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'
                  }`}>{a.status}</span>
                </li>
              ))}
            </ul>
          )
        ) : myJobs.length === 0 ? (
          <p className="text-sm text-gray-400 py-6 text-center">{t('dash.nojobs')}</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {myJobs.slice(0, 5).map((j) => (
              <li key={j.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{j.title}</p>
                  <p className="text-xs text-gray-500">{j.category} · {new Date(j.created_at).toLocaleDateString()}</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-50 text-primary">
                  {j.applications?.length || 0} applicants
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
      <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-extrabold text-gray-900 truncate">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}
