export type Role = 'worker' | 'company' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  picture: string;
  phone: string;
  role: Role;
  paid: boolean;
  onboarded: boolean;
  banned: boolean;
  last_seen: string | null;
  created_at: string;
}

export interface WorkerProfile {
  user_id: number;
  headline: string;
  profession: string;
  skills: string[];
  bio: string;
  hourly_rate: string | null;
  job_seeking: string;
  availability: string;
  years_total: string | null;
  education: string;
  languages: string;
  location: string;
  links: Record<string, string>;
  cv_url: string;
  cv_filename: string;
  promoted: boolean;
  promoted_until: string | null;
}

export interface Experience {
  id?: number;
  title: string;
  company: string;
  years: string;
  description: string;
}

export interface CompanyProfile {
  user_id: number;
  company_name: string;
  website: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  hiring_roles: string[];
}

export interface Session {
  user: User;
  profile?: WorkerProfile | null;
  experiences?: Experience[];
  company?: CompanyProfile | null;
}

export interface AppConfig {
  googleClientId: string;
  paypalClientId: string;
  paypalConfigured: boolean;
  activationPrice: string;
  devLogin: boolean;
}

export interface Job {
  id: number;
  company_id: number;
  title: string;
  category: string;
  description: string;
  job_type: string;
  budget: string;
  location: string;
  status: string;
  created_at: string;
  completed_at?: string | null;
  completed_by_admin?: number | null;
  company_name?: string;
  applicants?: number;
  applications?: JobApplication[];
}

export interface JobApplication {
  id: number;
  job_id?: number;
  status: string;
  cover_letter: string;
  created_at: string;
  worker_id?: number;
  worker_name?: string;
  worker_picture?: string;
  headline?: string;
  profession?: string;
  title?: string;
  category?: string;
  location?: string;
  company_name?: string;
}

export interface TalentCard {
  id: number;
  name: string;
  picture: string;
  premium?: boolean;
  promoted?: boolean;
  headline: string;
  profession: string;
  skills: string[];
  hourly_rate: string | null;
  location: string;
  availability: string;
  job_seeking: string;
  avg_rating?: number | null;
  rating_count?: number;
  cv_url?: string;
}

export interface Message {
  id: number;
  from_id: number;
  to_id: number;
  body: string;
  read: boolean;
  created_at: string;
  from_name?: string;
  from_picture?: string;
}

export interface Thread {
  id: number;
  name: string;
  picture: string;
  role: Role;
  last_message: string;
  last_at: string;
  unread: number;
}

export interface Rating {
  id: number;
  from_user_id: number;
  to_user_id: number;
  job_id: number;
  rating: number;
  review: string;
  created_at: string;
  from_name?: string;
  from_picture?: string;
  job_title?: string;
}

export interface UserRatingSummary {
  avg_rating: number;
  total_ratings: number;
  ratings: Rating[];
}

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AdminUser extends User {
  headline?: string;
  profession?: string;
  company_name?: string;
  promoted?: boolean;
  online: boolean;
}

export type AppView = 'dashboard' | 'jobs' | 'talent' | 'messages' | 'profile' | 'support';

