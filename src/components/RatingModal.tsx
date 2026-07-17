import { useState } from 'react';
import { X, Star } from 'lucide-react';
import { api } from '../api';
import { useModalHistory } from '../history';
import { useT } from '../i18n';

interface RatingModalProps {
  targetUser: { id: number; name: string; picture: string };
  jobId: number;
  jobTitle: string;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function RatingModal({ targetUser, jobId, jobTitle, onClose, onSubmitted }: RatingModalProps) {
  const { t } = useT();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useModalHistory(true, onClose);

  const submit = async () => {
    if (rating < 1) return;
    setBusy(true);
    setError('');
    try {
      await api('/ratings', {
        method: 'POST',
        body: JSON.stringify({ to_user_id: targetUser.id, job_id: jobId, rating, review }),
      });
      onSubmitted();
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md relative p-8">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 p-1">
          <X className="w-5 h-5" />
        </button>

        {/* Target user */}
        <div className="text-center mb-6">
          <img
            src={targetUser.picture}
            alt={targetUser.name}
            className="w-16 h-16 rounded-full object-cover mx-auto mb-3 border-2 border-gray-100"
          />
          <h2 className="text-xl font-bold text-gray-900">{targetUser.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{jobTitle}</p>
        </div>

        {/* Star rating */}
        <div className="flex items-center justify-center gap-1 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  star <= activeRating
                    ? 'text-amber-400 fill-amber-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Review textarea */}
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder={t('rating.placeholder') as string}
          rows={3}
          className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none mb-4"
        />

        {error && <p className="text-sm text-red-600 text-center font-medium mb-3">{error}</p>}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-50"
          >
            {t('rating.cancel')}
          </button>
          <button
            onClick={submit}
            disabled={busy || rating < 1}
            className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-3 rounded-xl disabled:opacity-50"
          >
            {busy ? t('rating.submitting') : t('rating.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
