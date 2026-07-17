import { useState } from 'react';
import { LifeBuoy, CheckCircle2, MapPin } from 'lucide-react';
import { api } from '../api';
import { Session } from '../types';
import { useT } from '../i18n';

const inputCls = 'w-full border border-gray-300 rounded-lg py-2.5 px-3 outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white';

interface Props {
  session?: Session | null;
  /** Compact mode used inside the landing page. */
  embedded?: boolean;
}

export default function SupportView({ session, embedded }: Props) {
  const { t } = useT();
  const [name, setName] = useState(session?.user.name || '');
  const [email, setEmail] = useState(session?.user.email || '');
  const [phone, setPhone] = useState(session?.user.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await api('/support', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, subject, message }),
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const form = sent ? (
    <div className="text-center py-10">
      <CheckCircle2 className="w-14 h-14 text-primary mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900">{t('sup.senttitle')}</h3>
      <p className="text-gray-500 mt-2 text-sm">{t('sup.sentdesc')}</p>
      <button onClick={() => { setSent(false); setSubject(''); setMessage(''); }}
        className="mt-6 text-primary font-semibold text-sm hover:underline">{t('sup.sendanother')}</button>
    </div>
  ) : (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div><label className="text-sm font-semibold text-gray-700">{t('sup.name')} *</label>
          <input className={inputCls} required value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><label className="text-sm font-semibold text-gray-700">{t('sup.email')} *</label>
          <input className={inputCls} type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      </div>
      <div><label className="text-sm font-semibold text-gray-700">{t('sup.phone')} *</label>
        <input className={inputCls} type="tel" required placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
      <div><label className="text-sm font-semibold text-gray-700">{t('sup.subject')}</label>
        <input className={inputCls} placeholder={t('sup.subjectph')} value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
      <div><label className="text-sm font-semibold text-gray-700">{t('sup.message')} *</label>
        <textarea className={inputCls} rows={5} required value={message} onChange={(e) => setMessage(e.target.value)}
          placeholder={t('sup.messageph')} /></div>
      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}
      <button type="submit" disabled={busy}
        className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl disabled:opacity-50">
        {busy ? t('sup.sending') : t('sup.send')}
      </button>
    </form>
  );

  if (embedded) return form;

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 bg-green-50 rounded-xl flex items-center justify-center">
            <LifeBuoy className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-gray-900">{t('sup.title')}</h1>
            <p className="text-sm text-gray-500">{t('sup.subtitle')}</p>
          </div>
        </div>
        <div className="mt-6">{form}</div>
        <p className="mt-6 text-xs text-gray-400 flex items-center gap-1.5 justify-center">
          <MapPin className="w-3.5 h-3.5" /> {t('sup.located')}
        </p>
      </div>
    </div>
  );
}
