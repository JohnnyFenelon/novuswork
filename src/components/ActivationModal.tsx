import { useEffect, useRef, useState } from 'react';
import { X, BadgeCheck } from 'lucide-react';
import { api, loadScript } from '../api';
import { AppConfig, Session } from '../types';
import { useModalHistory } from '../history';
import { useT } from '../i18n';

declare global {
  interface Window { paypal?: any }
}

interface Props {
  config: AppConfig;
  onClose: () => void;
  onPaid: (s: Session) => void;
}

export default function ActivationModal({ config, onClose, onPaid }: Props) {
  const { t } = useT();
  const btnRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  useModalHistory(true, onClose);

  useEffect(() => {
    if (!config.paypalConfigured || !config.paypalClientId) return;
    let cancelled = false;
    loadScript(`https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(config.paypalClientId)}&currency=USD&intent=capture`)
      .then(() => {
        if (cancelled || !window.paypal || !btnRef.current) return;
        btnRef.current.innerHTML = '';
        window.paypal.Buttons({
          style: { layout: 'vertical', shape: 'pill', label: 'pay' },
          createOrder: async () => {
            const { orderId } = await api<{ orderId: string }>('/payments/create-order', { method: 'POST' });
            return orderId;
          },
          onApprove: async (data: any) => {
            try {
              const session = await api<Session>('/payments/capture', {
                method: 'POST',
                body: JSON.stringify({ orderId: data.orderID }),
              });
              setDone(true);
              setTimeout(() => onPaid(session), 1200);
            } catch (e: any) {
              setError(e.message);
            }
          },
          onError: () => setError('PayPal checkout failed. Please try again.'),
        }).render(btnRef.current);
      })
      .catch(() => setError('Could not load PayPal'));
    return () => { cancelled = true; };
  }, [config.paypalClientId, config.paypalConfigured]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 p-1">
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="text-center py-8">
            <BadgeCheck className="w-16 h-16 text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900">{t('prem.done')}</h2>
            <p className="text-gray-500 mt-2">{t('prem.donedesc')}</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <BadgeCheck className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{t('prem.title')}</h2>
              <p className="text-gray-500 mt-2 text-sm">{t('prem.desc')}</p>
            </div>

            <ul className="space-y-2 mb-6 text-sm text-gray-700">
              <li className="flex gap-2"><span className="text-primary font-bold">✓</span> {t('prem.b1')}</li>
              <li className="flex gap-2"><span className="text-primary font-bold">✓</span> {t('prem.b2')}</li>
              <li className="flex gap-2"><span className="text-primary font-bold">✓</span> {t('prem.b3')}</li>
              <li className="flex gap-2"><span className="text-primary font-bold">✓</span> {t('prem.b4')}</li>
            </ul>

            {config.paypalConfigured ? (
              <div ref={btnRef} className="min-h-[45px]" />
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 text-center">
                Payments are being configured. Please check back shortly — your profile is already live for free.
              </div>
            )}
            {error && <p className="mt-3 text-sm text-red-600 text-center font-medium">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
