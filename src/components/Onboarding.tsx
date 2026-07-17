import { useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft, CheckCircle2, FileText, Upload } from 'lucide-react';
import { api, PROFESSIONS, uploadCV } from '../api';
import { Experience, Session } from '../types';
import { useT } from '../i18n';
import AvatarUpload from './AvatarUpload';

interface Props {
  session: Session;
  onDone: (s: Session) => void;
}

const inputCls = 'w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white';
const labelCls = 'block text-sm font-semibold text-gray-700 mb-1';

export default function Onboarding({ session, onDone }: Props) {
  const { t } = useT();
  const isCompany = session.user.role === 'company';
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Shared
  const [name, setName] = useState(session.user.name || '');
  const [phone, setPhone] = useState(session.user.phone || '');
  const [picture, setPicture] = useState(session.user.picture || '');

  // Worker fields
  const [location, setLocation] = useState('');
  const [languages, setLanguages] = useState('');
  const [profession, setProfession] = useState('');
  const [headline, setHeadline] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [yearsTotal, setYearsTotal] = useState('');
  const [experiences, setExperiences] = useState<Experience[]>([
    { title: '', company: '', years: '', description: '' },
  ]);
  const [jobSeeking, setJobSeeking] = useState('');
  const [availability, setAvailability] = useState('full-time');
  const [rate, setRate] = useState('');
  const [education, setEducation] = useState('');
  const [bio, setBio] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [cvFile, setCvFile] = useState<File | null>(null);

  // Company fields
  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [industry, setIndustry] = useState('');
  const [size, setSize] = useState('1-10');
  const [companyLocation, setCompanyLocation] = useState('');
  const [description, setDescription] = useState('');
  const [hiringRoles, setHiringRoles] = useState<string[]>([]);

  const workerSteps = ['The basics', 'Your profession', 'Work experience', 'Job preferences', 'About you', 'Your CV'];
  const companySteps = ['Company details', 'Hiring needs'];
  const steps = isCompany ? companySteps : workerSteps;

  const addSkill = () => {
    const s = skillInput.trim();
    if (s && !skills.includes(s) && skills.length < 15) setSkills([...skills, s]);
    setSkillInput('');
  };

  const validateStep = (): string => {
    if (isCompany) {
      if (step === 0) {
        if (!companyName.trim()) return 'Company name is required';
        if (!phone.trim()) return 'Phone number is required';
      }
      if (step === 1 && hiringRoles.length === 0) return 'Select at least one role you are hiring for';
    } else {
      if (step === 0) {
        if (!name.trim()) return 'Your name is required';
        if (!phone.trim()) return 'Phone number is required';
        if (!location.trim()) return 'Location is required';
      }
      if (step === 1) {
        if (!profession) return 'Select your profession';
        if (!headline.trim()) return 'A professional headline is required';
      }
      if (step === 2) {
        const valid = experiences.filter((e) => e.title.trim());
        if (valid.length === 0) return 'Add at least one previous experience';
      }
      if (step === 3 && !jobSeeking.trim()) return 'Tell us what job you are looking for';
    }
    return '';
  };

  const next = async () => {
    const err = validateStep();
    if (err) return setError(err);
    setError('');
    if (step < steps.length - 1) return setStep(step + 1);

    setBusy(true);
    try {
      const body = isCompany
        ? {
            name, phone,
            company: {
              company_name: companyName, website, industry, size,
              location: companyLocation, description, hiring_roles: hiringRoles,
            },
          }
        : {
            name, phone,
            profile: {
              headline, profession, skills, bio,
              hourly_rate: rate ? Number(rate) : null,
              job_seeking: jobSeeking, availability,
              years_total: yearsTotal ? Number(yearsTotal) : null,
              education, languages, location,
              links: { ...(portfolio && { portfolio }), ...(linkedin && { linkedin }) },
            },
            experiences: experiences.filter((e) => e.title.trim()),
          };
      let s = await api<Session>('/me/profile', { method: 'PUT', body: JSON.stringify(body) });
      if (!isCompany && cvFile) {
        s = await uploadCV(cvFile);
      }
      onDone(s);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-2 justify-center mb-8">
          <img src="/novuslogo.png" alt="NovusWork" className="h-9 w-auto object-contain" style={{ mixBlendMode: 'multiply' }} />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {steps.map((label, i) => (
            <div key={label} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? 'bg-primary' : 'bg-gray-200'}`} />
              <p className={`text-[11px] mt-1.5 font-medium ${i === step ? 'text-primary' : 'text-gray-400'} hidden sm:block`}>{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{steps[step]}</h1>
          <p className="text-gray-500 text-sm mb-6">
            {isCompany
              ? 'Tell candidates who you are — this appears on your job posts.'
              : 'This builds your public profile, just like a top freelance marketplace.'}
          </p>

          {/* ─── WORKER STEPS ─── */}
          {!isCompany && step === 0 && (
            <div className="space-y-4">
              <div className="flex justify-center pb-2">
                <AvatarUpload picture={picture} name={name || 'NW'} size={88}
                  onUploaded={(s) => setPicture(s.user.picture)} />
              </div>
              <p className="text-center text-xs text-gray-400 -mt-1">{t('prof.addphoto')}</p>
              <div><label className={labelCls}>Full name *</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div><label className={labelCls}>Phone number *</label>
                <input className={inputCls} type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
              <div><label className={labelCls}>Location (city, country) *</label>
                <input className={inputCls} placeholder="Miami, USA" value={location} onChange={(e) => setLocation(e.target.value)} /></div>
              <div><label className={labelCls}>Languages you speak</label>
                <input className={inputCls} placeholder="English (fluent), Spanish (native)" value={languages} onChange={(e) => setLanguages(e.target.value)} /></div>
            </div>
          )}

          {!isCompany && step === 1 && (
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Your profession *</label>
                <div className="flex flex-wrap gap-2">
                  {PROFESSIONS.map((p) => (
                    <button key={p} onClick={() => setProfession(p)}
                      className={`px-3.5 py-2 rounded-full text-sm font-semibold border transition-all ${profession === p ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'}`}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div><label className={labelCls}>Professional headline *</label>
                <input className={inputCls} placeholder="e.g. Bilingual Customer Service Specialist | 5+ years in BPO" value={headline} onChange={(e) => setHeadline(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">This is the first thing companies see on your profile.</p></div>
              <div>
                <label className={labelCls}>Key skills (press Enter to add)</label>
                <div className="flex gap-2">
                  <input className={inputCls} placeholder="e.g. Zendesk, React, Cold Calling…" value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
                  <button onClick={addSkill} className="px-4 bg-gray-100 rounded-lg hover:bg-gray-200"><Plus className="w-4 h-4" /></button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((s) => (
                    <span key={s} className="bg-green-50 text-primary px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5">
                      {s}
                      <button onClick={() => setSkills(skills.filter((x) => x !== s))} className="hover:text-red-600">×</button>
                    </span>
                  ))}
                </div>
              </div>
              <div><label className={labelCls}>Total years of experience</label>
                <input className={inputCls} type="number" min="0" step="0.5" placeholder="e.g. 4" value={yearsTotal} onChange={(e) => setYearsTotal(e.target.value)} /></div>
            </div>
          )}

          {!isCompany && step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-gray-600 -mt-2">Add at least one previous job. Companies trust profiles with real work history.</p>
              {experiences.map((exp, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-3 relative">
                  {experiences.length > 1 && (
                    <button onClick={() => setExperiences(experiences.filter((_, j) => j !== i))}
                      className="absolute top-3 right-3 text-gray-300 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  )}
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div><label className={labelCls}>Job title *</label>
                      <input className={inputCls} placeholder="Customer Service Rep" value={exp.title}
                        onChange={(e) => setExperiences(experiences.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} /></div>
                    <div><label className={labelCls}>Company</label>
                      <input className={inputCls} placeholder="Acme Corp" value={exp.company}
                        onChange={(e) => setExperiences(experiences.map((x, j) => (j === i ? { ...x, company: e.target.value } : x)))} /></div>
                  </div>
                  <div><label className={labelCls}>Period / duration</label>
                    <input className={inputCls} placeholder="2021 – 2024 (3 years)" value={exp.years}
                      onChange={(e) => setExperiences(experiences.map((x, j) => (j === i ? { ...x, years: e.target.value } : x)))} /></div>
                  <div><label className={labelCls}>What did you do there?</label>
                    <textarea className={inputCls} rows={2} placeholder="Handled 60+ calls/day, top CSAT score on the team…" value={exp.description}
                      onChange={(e) => setExperiences(experiences.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} /></div>
                </div>
              ))}
              <button onClick={() => setExperiences([...experiences, { title: '', company: '', years: '', description: '' }])}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl py-3 text-sm font-semibold text-gray-500 hover:border-primary hover:text-primary flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Add another experience
              </button>
            </div>
          )}

          {!isCompany && step === 3 && (
            <div className="space-y-4">
              <div><label className={labelCls}>What job are you looking for? *</label>
                <input className={inputCls} placeholder="e.g. Remote customer support role for a US company" value={jobSeeking} onChange={(e) => setJobSeeking(e.target.value)} /></div>
              <div><label className={labelCls}>Availability</label>
                <select className={inputCls} value={availability} onChange={(e) => setAvailability(e.target.value)}>
                  <option value="full-time">Full-time</option>
                  <option value="part-time">Part-time</option>
                  <option value="contract">Contract / Freelance</option>
                </select></div>
              <div><label className={labelCls}>Expected hourly rate (USD)</label>
                <input className={inputCls} type="number" min="0" placeholder="e.g. 8" value={rate} onChange={(e) => setRate(e.target.value)} /></div>
              <div><label className={labelCls}>Education</label>
                <input className={inputCls} placeholder="e.g. B.A. Business Administration — UASD" value={education} onChange={(e) => setEducation(e.target.value)} /></div>
            </div>
          )}

          {!isCompany && step === 4 && (
            <div className="space-y-4">
              <div><label className={labelCls}>Professional overview</label>
                <textarea className={inputCls} rows={5} placeholder="Introduce yourself: strengths, achievements, the value you bring…" value={bio} onChange={(e) => setBio(e.target.value)} />
                <p className="text-xs text-gray-400 mt-1">Profiles with a strong overview get up to 3× more invitations.</p></div>
              <div><label className={labelCls}>Portfolio / website</label>
                <input className={inputCls} placeholder="https://…" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} /></div>
              <div><label className={labelCls}>LinkedIn</label>
                <input className={inputCls} placeholder="https://linkedin.com/in/…" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} /></div>
            </div>
          )}

          {!isCompany && step === 5 && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-white">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Upload your CV (Optional)</h3>
                <p className="text-gray-500 text-sm mb-6">A polished CV increases your chances of getting hired.</p>
                <input type="file" accept=".pdf,.doc,.docx" id="cv-upload" className="hidden" onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                <label htmlFor="cv-upload" className="cursor-pointer inline-flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-5 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                  <Upload className="w-4 h-4" /> {cvFile ? cvFile.name : 'Select PDF or DOCX'}
                </label>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mt-4">
                <h4 className="font-bold text-blue-900 mb-1">Don't have a CV yet?</h4>
                <p className="text-sm text-blue-800 mb-3">Create a professional CV for free using our recommended tool.</p>
                <a href="https://cvgratis2.duckdns.org" target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition-colors">
                  Create Free CV
                </a>
              </div>
            </div>
          )}

          {/* ─── COMPANY STEPS ─── */}
          {isCompany && step === 0 && (
            <div className="space-y-4">
              <div className="flex justify-center pb-2">
                <AvatarUpload picture={picture} name={companyName || name || 'NW'} size={88}
                  onUploaded={(s) => setPicture(s.user.picture)} />
              </div>
              <div><label className={labelCls}>Company name *</label>
                <input className={inputCls} value={companyName} onChange={(e) => setCompanyName(e.target.value)} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Contact phone *</label>
                  <input className={inputCls} type="tel" placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
                <div><label className={labelCls}>Website</label>
                  <input className={inputCls} placeholder="https://…" value={website} onChange={(e) => setWebsite(e.target.value)} /></div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><label className={labelCls}>Industry</label>
                  <input className={inputCls} placeholder="e.g. BPO, SaaS, Retail" value={industry} onChange={(e) => setIndustry(e.target.value)} /></div>
                <div><label className={labelCls}>Company size</label>
                  <select className={inputCls} value={size} onChange={(e) => setSize(e.target.value)}>
                    <option>1-10</option><option>11-50</option><option>51-200</option><option>201-1000</option><option>1000+</option>
                  </select></div>
              </div>
              <div><label className={labelCls}>Location</label>
                <input className={inputCls} placeholder="Miami, Florida" value={companyLocation} onChange={(e) => setCompanyLocation(e.target.value)} /></div>
              <div><label className={labelCls}>About the company</label>
                <textarea className={inputCls} rows={3} placeholder="What does your company do?" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
            </div>
          )}

          {isCompany && step === 1 && (
            <div>
              <label className={labelCls}>Which roles are you hiring for? *</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PROFESSIONS.map((p) => (
                  <button key={p}
                    onClick={() => setHiringRoles(hiringRoles.includes(p) ? hiringRoles.filter((x) => x !== p) : [...hiringRoles, p])}
                    className={`px-3.5 py-2 rounded-full text-sm font-semibold border transition-all ${hiringRoles.includes(p) ? 'bg-primary text-white border-primary' : 'bg-white text-gray-700 border-gray-300 hover:border-primary'}`}>
                    {hiringRoles.includes(p) && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />}{p}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex justify-between mt-8">
            <button onClick={() => { setError(''); setStep(Math.max(0, step - 1)); }} disabled={step === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-0">
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button onClick={next} disabled={busy}
              className="flex items-center gap-2 bg-primary text-white px-7 py-2.5 rounded-lg font-semibold hover:bg-primary-dark disabled:opacity-50">
              {busy ? 'Saving…' : step === steps.length - 1 ? 'Finish & create profile' : 'Continue'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
