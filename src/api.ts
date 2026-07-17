import { AppConfig, Session } from './types';

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
