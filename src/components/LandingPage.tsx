import { useState } from 'react';
import {
  Search, Shield, Lock, Scale, AlertTriangle, Star, Award,
  User, Briefcase, FileText, MessageSquare, Video, CreditCard, MapPin,
  Headset, Code2, Bot, LayoutTemplate, Database, PhoneCall, X, ShieldCheck,
} from 'lucide-react';
import AuthModal from './AuthModal';
import SupportView from './SupportView';
import Logo from './Logo';
import { AppConfig, Session } from '../types';
import { useT, LangToggle } from '../i18n';

interface LandingPageProps {
  config: AppConfig;
  onAuthed: (s: Session) => void;
}

const CATEGORIES = [
  { name: 'BPO', icon: PhoneCall },
  { name: 'Programmers', icon: Code2 },
  { name: 'AI Automation', icon: Bot },
  { name: 'Customer Service', icon: Headset },
  { name: 'Back End', icon: Database },
  { name: 'Front End', icon: LayoutTemplate },
];

export default function LandingPage({ config, onAuthed }: LandingPageProps) {
  const { t, lang } = useT();
  const [showAuth, setShowAuth] = useState(false);
  const [authRole, setAuthRole] = useState<'worker' | 'company'>('worker');
  const [showPolicy, setShowPolicy] = useState(false);

  const openAuth = (role: 'worker' | 'company' = 'worker') => {
    setAuthRole(role);
    setShowAuth(true);
  };

  return (
    <div className="w-full">
      {showAuth && (
        <AuthModal config={config} initialRole={authRole} onClose={() => setShowAuth(false)} onAuthed={onAuthed} />
      )}
      {showPolicy && <DataPolicyModal onClose={() => setShowPolicy(false)} />}

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-300">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          <Logo size={34} />
          <ul className="hidden md:flex gap-8 list-none m-0 p-0">
            <li><a href="#categories" className="text-gray-700 font-medium hover:text-primary transition-colors">{t('nav.categories')}</a></li>
            <li><a href="#features" className="text-gray-700 font-medium hover:text-primary transition-colors">{t('nav.platform')}</a></li>
            <li><a href="#trust" className="text-gray-700 font-medium hover:text-primary transition-colors">{t('nav.trust')}</a></li>
            <li><a href="#support" className="text-gray-700 font-medium hover:text-primary transition-colors">{t('nav.support')}</a></li>
          </ul>
          <div className="flex gap-3 items-center">
            <LangToggle className="hidden sm:flex" />
            <button onClick={() => openAuth()} className="px-4 py-2.5 rounded-lg font-bold text-base cursor-pointer transition-all border border-gray-700 text-gray-800 hover:bg-gray-50">{t('nav.login')}</button>
            <button onClick={() => openAuth()} className="px-4 py-2.5 rounded-lg font-bold text-base cursor-pointer transition-all bg-primary text-white hover:bg-primary-dark shadow-md">{t('nav.signup')}</button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 md:py-24 bg-gradient-to-br from-green-50 via-white to-orange-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-[1.1fr_1fr] gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-extrabold text-dark leading-tight mb-6 tracking-tight">
                {t('hero.title1')} <br /><span className="text-primary">{t('hero.title2')}</span>
              </h1>
              <p className="text-xl text-gray-800 font-medium mb-8 max-w-xl leading-relaxed">
                {t('hero.subtitle')} <span className="font-bold text-dark">{t('hero.subtitle.bold')}</span>
              </p>
              <div className="bg-white rounded-xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.08)] flex gap-2 mb-8">
                <div className="flex-1 flex items-center pl-4">
                  <Search className="text-gray-400 w-5 h-5" />
                  <input type="text" placeholder={t('hero.search.placeholder')}
                    className="w-full border-none outline-none py-3 px-4 text-base"
                    onKeyDown={(e) => e.key === 'Enter' && openAuth()} />
                </div>
                <button onClick={() => openAuth()} className="bg-primary text-white border-none py-3 px-7 rounded-lg font-semibold cursor-pointer hover:bg-primary-dark transition-colors">{t('hero.search.button')}</button>
              </div>
              <div className="flex flex-wrap gap-10 mt-10">
                <div><h3 className="text-3xl font-bold text-dark">{t('hero.stat.free')}</h3><p className="text-sm text-gray-500 m-0">{t('hero.stat.free.label')}</p></div>
                <div><h3 className="text-3xl font-bold text-dark">6+</h3><p className="text-sm text-gray-500 m-0">{t('hero.stat.cats')}</p></div>
                <div><h3 className="text-3xl font-bold text-dark">100%</h3><p className="text-sm text-gray-500 m-0">{t('hero.stat.verified')}</p></div>
              </div>
            </div>

            <div className="hidden md:block relative">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.2)] aspect-[4/5] w-full max-w-md mx-auto">
                <img
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800"
                  alt="Smiling professional"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg border border-white/20">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Star className="w-5 h-5 text-primary fill-current" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900 text-sm">{t('hero.badge.title')}</div>
                      <div className="text-gray-500 text-xs">{t('hero.badge.sub')}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">{t('cats.title')}</h2>
            <p className="text-lg text-gray-600">{t('cats.subtitle')}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {CATEGORIES.map((c) => (
              <button key={c.name} onClick={() => openAuth('company')}
                className="bg-gray-50 hover:bg-green-50 border border-gray-200 hover:border-primary rounded-2xl p-6 text-center transition-all group">
                <c.icon className="w-8 h-8 mx-auto text-gray-400 group-hover:text-primary transition-colors mb-3" />
                <p className="font-bold text-sm text-gray-800">{c.name}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-4">{t('features.title')}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">{t('features.subtitle')}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard icon={<User className="w-6 h-6 text-primary" />} title={t('feat.profiles.title')} description={t('feat.profiles.desc')}
              items={lang === 'es' ? ['Correo verificado por Google', 'Historial laboral completo', 'Habilidades e idiomas', 'Tarifa y disponibilidad'] : ['Google-verified email', 'Full work history', 'Skills & languages', 'Expected rate & availability']} />
            <FeatureCard icon={<Briefcase className="w-6 h-6 text-primary" />} title={t('feat.jobs.title')} description={t('feat.jobs.desc')}
              items={lang === 'es' ? ['Tiempo completo, parcial y contrato', 'Búsqueda por categoría', 'Desde BPO hasta IA', 'Aplicaciones directas'] : ['Full-time, part-time & contract', 'Category & keyword search', 'BPO to AI Automation roles', 'Direct applications']} />
            <FeatureCard icon={<MessageSquare className="w-6 h-6 text-primary" />} title={t('feat.msg.title')} description={t('feat.msg.desc')}
              items={lang === 'es' ? ['Mensajería instantánea', 'Historial de mensajes', 'Notificaciones de no leídos', 'Contacto de reclutadores'] : ['Instant messaging', 'Message history', 'Unread notifications', 'Recruiter outreach']} />
            <FeatureCard icon={<Video className="w-6 h-6 text-primary" />} title={t('feat.video.title')} description={t('feat.video.desc')}
              items={lang === 'es' ? ['Videollamadas con un clic', 'Sin descargas', 'Flujo de entrevista simple', 'Funciona en el móvil'] : ['One-click video calls', 'No downloads needed', 'Screen-friendly interview flow', 'Works on mobile']} />
            <FeatureCard icon={<CreditCard className="w-6 h-6 text-primary" />} title={t('feat.premium.title')} description={t('feat.premium.desc')}
              items={lang === 'es' ? ['Mentoría 1-a-1 para conseguir empleo', 'Insignia de Candidato Destacado', 'Paga seguro con PayPal', 'Sin comisiones sobre tu salario'] : ['1-on-1 mentoring to land your job', 'Top Candidate badge & featured placement', 'Pay securely with PayPal', 'No commissions on your salary']} />
            <FeatureCard icon={<FileText className="w-6 h-6 text-primary" />} title={t('feat.upwork.title')} description={t('feat.upwork.desc')}
              items={lang === 'es' ? ['Titular y resumen', 'Experiencia previa', 'Enlaces de portafolio y LinkedIn', 'Educación y certificaciones'] : ['Headline & overview', 'Previous experience', 'Portfolio & LinkedIn links', 'Education & certifications']} />
          </div>
        </div>
      </section>

      {/* Trust */}
      <section id="trust" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-extrabold text-gray-900 mb-5">{t('trust.title')}</h2>
              <p className="text-gray-600 mb-8 text-lg">{t('trust.desc')}</p>
              <div className="grid grid-cols-2 gap-4">
                <Badge icon={<Lock className="w-5 h-5 text-gray-600" />} text={lang === 'es' ? 'Correos verificados' : 'Google-verified emails'} />
                <Badge icon={<Shield className="w-5 h-5 text-gray-600" />} text={lang === 'es' ? 'Sesiones cifradas' : 'Encrypted sessions'} />
                <Badge icon={<Scale className="w-5 h-5 text-gray-600" />} text={lang === 'es' ? 'Equipo de soporte humano' : 'Human support team'} />
                <Badge icon={<AlertTriangle className="w-5 h-5 text-gray-600" />} text={lang === 'es' ? 'Monitoreo de fraude' : 'Fraud monitoring'} />
                <Badge icon={<Star className="w-5 h-5 text-gray-600" />} text={lang === 'es' ? 'Perfiles de calidad' : 'Quality profiles'} />
                <Badge icon={<Award className="w-5 h-5 text-gray-600" />} text={lang === 'es' ? 'Activaciones verificadas' : 'Verified activations'} />
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="bg-gradient-to-br from-green-50 to-orange-50 rounded-3xl p-10 text-center">
                <MapPin className="w-10 h-10 text-primary mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('trust.florida.title')}</h3>
                <p className="text-gray-600 max-w-sm mx-auto">{t('trust.florida.desc')}</p>
              </div>
              <a href="https://academia809.com/" target="_blank" rel="noopener noreferrer" className="block bg-primary hover:bg-green-700 transition-colors rounded-3xl p-8 text-center text-white shadow-lg">
                <Award className="w-10 h-10 text-white mx-auto mb-3" />
                <h3 className="text-2xl font-bold mb-2">Train with Academia809 and find your next job here!</h3>
                <p className="text-green-50 text-sm font-medium">Enhance your skills with premium courses at Academia809.com</p>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Data policy / privacy */}
      <section id="privacy" className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col md:flex-row items-start gap-5">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('consent.title')}</h3>
              <p className="text-sm text-gray-600 mb-2"><b>{t('consent.age')}</b></p>
              <p className="text-sm text-gray-600">{t('consent.data')}</p>
              <button onClick={() => setShowPolicy(true)} className="mt-3 text-primary font-semibold text-sm hover:underline">
                {t('consent.readpolicy')} →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Company CTA */}
      <section className="py-24 bg-dark text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/10"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">{t('cta.title')}</h2>
          <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">{t('cta.desc')}</p>
          <button onClick={() => openAuth('company')}
            className="bg-primary hover:bg-primary-dark text-white text-lg font-bold py-4 px-10 rounded-xl shadow-lg transition-transform hover:scale-105">
            {t('cta.button')}
          </button>
        </div>
      </section>

      {/* Support */}
      <section id="support" className="py-24 bg-gray-50">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-3">{t('support.title')}</h2>
            <p className="text-lg text-gray-600">{t('support.subtitle')}</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <SupportView embedded />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-dark text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-10">
            <div className="md:col-span-2">
              <img src="/novuslogo.png" alt="NovusWork" className="h-11 w-auto object-contain mb-4" style={{ filter: 'invert(1) brightness(2)' }} />
              <p className="text-gray-400 text-sm max-w-sm">{t('footer.tagline')}</p>
              <p className="text-gray-400 text-sm mt-3 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-primary" /> {t('footer.located')}
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-100">{t('footer.talent')}</h4>
              <ul className="space-y-3">
                <li><button onClick={() => openAuth()} className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.findjobs')}</button></li>
                <li><button onClick={() => openAuth()} className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.createprofile')}</button></li>
                <li><button onClick={() => openAuth()} className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.premium')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-100">{t('footer.companies')}</h4>
              <ul className="space-y-3">
                <li><button onClick={() => openAuth('company')} className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.postjob')}</button></li>
                <li><button onClick={() => openAuth('company')} className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.browsetalent')}</button></li>
                <li><button onClick={() => openAuth('company')} className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.videointerviews')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4 text-gray-100">{t('footer.resources')}</h4>
              <ul className="space-y-3">
                <li><a href="https://academia809.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-white transition-colors text-sm font-bold">Learn at Academia809.com</a></li>
                <li><a href="#support" className="text-gray-400 hover:text-white transition-colors text-sm">{t('footer.help')}</a></li>
                <li><button onClick={() => setShowPolicy(true)} className="text-gray-400 hover:text-white transition-colors text-sm">{t('consent.readpolicy')}</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Durosier Contact Center. {t('footer.rights')} · Florida, USA · NovusWork.com
          </div>
        </div>
      </footer>
    </div>
  );
}

function DataPolicyModal({ onClose }: { onClose: () => void }) {
  const { t, lang } = useT();
  const en = [
    ['1. Who we are', 'NovusWork is operated by Durosier Contact Center, located in Florida, USA. This platform connects independent professionals with hiring companies.'],
    ['2. Age requirement', 'You must be at least 18 years old to create an account or use NovusWork. By signing up you confirm you meet this requirement.'],
    ['3. Data we collect', 'We collect the information you provide: your name, email (verified through Google Sign-In), phone number, profession, skills, work experience, education, and any profile details you add.'],
    ['4. How we use your data', 'Your professional profile is shown to hiring companies so they can contact you. We use your email and phone to send account and support communications. We never sell your personal data to third parties.'],
    ['5. Data manipulation & storage', 'Your data is stored securely on our own servers. You may request correction or deletion of your data at any time by contacting support. Administrators may edit or remove accounts that violate our terms.'],
    ['6. Payments', 'Premium upgrades are processed by PayPal. We do not store your card or bank details.'],
    ['7. Contact', 'For any privacy request, use the Support form or email us. We are located in Florida, USA.'],
  ];
  const es = [
    ['1. Quiénes somos', 'NovusWork es operado por Durosier Contact Center, ubicado en Florida, EE. UU. Esta plataforma conecta profesionales independientes con empresas.'],
    ['2. Requisito de edad', 'Debes tener al menos 18 años para crear una cuenta o usar NovusWork. Al registrarte confirmas que cumples este requisito.'],
    ['3. Datos que recopilamos', 'Recopilamos la información que proporcionas: nombre, correo (verificado con Google), teléfono, profesión, habilidades, experiencia laboral, educación y los detalles de tu perfil.'],
    ['4. Cómo usamos tus datos', 'Tu perfil profesional se muestra a las empresas para que puedan contactarte. Usamos tu correo y teléfono para comunicaciones de cuenta y soporte. Nunca vendemos tus datos personales a terceros.'],
    ['5. Manipulación y almacenamiento', 'Tus datos se almacenan de forma segura en nuestros propios servidores. Puedes solicitar la corrección o eliminación de tus datos en cualquier momento contactando a soporte. Los administradores pueden editar o eliminar cuentas que violen los términos.'],
    ['6. Pagos', 'Las mejoras Premium se procesan mediante PayPal. No almacenamos datos de tu tarjeta ni banco.'],
    ['7. Contacto', 'Para cualquier solicitud de privacidad, usa el formulario de Soporte o escríbenos. Estamos ubicados en Florida, EE. UU.'],
  ];
  const items = lang === 'es' ? es : en;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 relative max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800"><X className="w-5 h-5" /></button>
        <h2 className="text-2xl font-extrabold text-gray-900 mb-1">{t('consent.title')}</h2>
        <p className="text-sm text-gray-500 mb-6">Durosier Contact Center · Florida, USA</p>
        <div className="space-y-4">
          {items.map(([h, b]) => (
            <div key={h}>
              <h3 className="font-bold text-gray-900 text-sm">{h}</h3>
              <p className="text-sm text-gray-600 mt-1">{b}</p>
            </div>
          ))}
        </div>
        <a href="https://sites.google.com/view/novuswork-privacyvus/home" target="_blank" rel="noopener noreferrer"
          className="mt-6 inline-flex items-center gap-1 bg-primary hover:bg-primary-dark text-white font-bold text-sm px-5 py-2.5 rounded-lg">
          {t('consent.privacylink')} ↗
        </a>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description, items }: { icon: React.ReactNode, title: string, description: string, items: string[] }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 hover:-translate-y-1 hover:shadow-xl transition-all duration-200">
      <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-500 text-sm mb-5 leading-relaxed">{description}</p>
      <ul className="space-y-3">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="text-primary font-bold mt-0.5">✓</span> {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Badge({ icon, text }: { icon: React.ReactNode, text: string }) {
  return (
    <div className="bg-gray-100 p-4 rounded-xl flex flex-col items-center justify-center gap-2 text-center">
      {icon}
      <span className="font-semibold text-gray-700 text-sm">{text}</span>
    </div>
  );
}
