import { AppConfig, Session, Rating, UserRatingSummary } from './types';

export const PROFESSIONS = [
  'BPO',
  'Programmers',
  'AI Automation',
  'Customer Service',
  'Back End',
  'Front End',
  'Full Stack',
  'Virtual Assistant',
  'Sales & Marketing',
  'Design & Creative',
  'Data Entry',
  'Project Management',
  'QA & Testing',
  'Other',
] as const;

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T = any>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || `Request failed (${res.status})`);
  return data as T;
}

export const getConfig = () => api<AppConfig>('/config');
export const getMe = () => api<Session>('/me').catch(() => null);
export const logout = () => api('/auth/logout', { method: 'POST' });

/** Upload a profile photo (multipart). Returns the refreshed session. */
export async function uploadPhoto(file: File): Promise<Session> {
  const fd = new FormData();
  fd.append('photo', file);
  const res = await fetch('/api/me/photo', { method: 'POST', credentials: 'include', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || 'Upload failed');
  return data as Session;
}

/** Upload a CV (PDF/DOCX). Returns the refreshed session. */
export async function uploadCV(file: File): Promise<Session> {
  const fd = new FormData();
  fd.append('cv', file);
  const res = await fetch('/api/me/cv', { method: 'POST', credentials: 'include', body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(res.status, data.error || 'CV upload failed');
  return data as Session;
}

/** Delete your uploaded CV. */
export const deleteCV = () => api<Session>('/me/cv', { method: 'DELETE' });

/** Submit a rating */
export const submitRating = (to_user_id: number, job_id: number, rating: number, review: string) =>
  api('/ratings', { method: 'POST', body: JSON.stringify({ to_user_id, job_id, rating, review }) });

/** Get ratings for a user */
export const getUserRatings = (userId: number) => api<UserRatingSummary>(`/users/${userId}/ratings`);

/** Get pending ratings */
export const getPendingRatings = () => api<any[]>('/ratings/pending');

/** AI Assistant chat */
export const aiChat = (message: string, context?: string) =>
  api<{ reply: string }>('/ai/chat', { method: 'POST', body: JSON.stringify({ message, context }) });

/** Load an external script once. */
const loaded: Record<string, Promise<void>> = {};
export function loadScript(src: string): Promise<void> {
  if (!loaded[src]) {
    loaded[src] = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load ${src}`));
      document.head.appendChild(s);
    });
  }
  return loaded[src];
}

