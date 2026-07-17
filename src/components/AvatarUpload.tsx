import { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { uploadPhoto } from '../api';
import { Session } from '../types';
import { useT } from '../i18n';

interface Props {
  picture?: string;
  name: string;
  size?: number;
  onUploaded: (s: Session) => void;
}

/** Circular avatar that uploads a new profile photo on click. */
export default function AvatarUpload({ picture, name, size = 80, onUploaded }: Props) {
  const { t } = useT();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t('prof.phototoobig'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const s = await uploadPhoto(file);
      onUploaded(s);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col items-center gap-1.5">
      <button type="button" onClick={() => inputRef.current?.click()}
        className="relative group shrink-0 rounded-full" style={{ width: size, height: size }}
        title={t('prof.changephoto')}>
        <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow">
          {picture ? (
            <img src={picture} alt={name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl font-bold text-gray-500">
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
        <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
          <Camera className="w-6 h-6 text-white" />
        </div>
        {!picture && (
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-2 border-white">
            <Camera className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        {busy && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
            <span className="text-white text-[10px] font-semibold">{t('prof.uploading')}</span>
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onChange} />
      {error && <p className="text-xs text-red-600 text-center max-w-[140px]">{error}</p>}
    </div>
  );
}
