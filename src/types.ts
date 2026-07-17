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
  headline: string;
  profession: string;
  skills: string[];
  hourly_rate: string | null;
  location: string;
  availability: string;
  job_seeking: string;
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

export interface AdminUser extends User {
  headline?: string;
  profession?: string;
  company_name?: string;
  online: boolean;
}

export type AppView = 'dashboard' | 'jobs' | 'talent' | 'messages' | 'profile' | 'support';
