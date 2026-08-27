export const AUTH_URL = 'https://functions.poehali.dev/ed035bdd-fa92-41df-9f81-85c5cf6555f4';
export const JOBS_URL = 'https://functions.poehali.dev/c4596d30-5943-4916-a85e-5e317cbaf903';

export const TOKEN_KEY = 'dodelay_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY) || '';
export const setToken = (t: string) => localStorage.setItem(TOKEN_KEY, t);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const request = async (
  base: string,
  action: string,
  options: { method?: string; body?: unknown; params?: Record<string, string> } = {},
) => {
  const url = new URL(base);
  url.searchParams.set('action', action);
  Object.entries(options.params || {}).forEach(([k, v]) => url.searchParams.set(k, v));

  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['X-Auth-Token'] = token;

  const res = await fetch(url.toString(), {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'request_failed');
  return data;
};

export const api = {
  auth: (action: string, options?: Parameters<typeof request>[2]) =>
    request(AUTH_URL, action, options),
  jobs: (action: string, options?: Parameters<typeof request>[2]) =>
    request(JOBS_URL, action, options),
};

export interface User {
  id: number;
  maxId: string;
  role: 'customer' | 'executor';
  name: string;
  city: string;
  skill?: string | null;
  about?: string | null;
  avatar?: string | null;
  rating: number;
  reviewsCount: number;
  doneCount: number;
  verified?: boolean;
  online?: boolean;
  blocked?: boolean;
  createdAt: string;
  phone?: string | null;
  contact?: string | null;
  token?: string;
  isAdmin?: boolean;
}

export interface ReviewItem {
  rating: number;
  text: string;
  created_at: string;
  author_name: string;
  job_title: string;
  final_price: number | null;
}

export interface ChatMessage {
  id: number;
  text: string;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string | null;
  mine: boolean;
}

export interface JobResponseItem {
  executorId: number;
  avatar?: string | null;
  note: string;
  createdAt: string;
  name: string;
  city: string;
  skill?: string | null;
  about?: string | null;
  rating: number;
  doneCount: number;
  reviewsCount: number;
  online?: boolean;
}

export type JobStatus = 'open' | 'assigned' | 'expiring' | 'done' | 'cancelled';

export interface JobItem {
  id: number;
  title: string;
  description: string;
  price: number;
  city: string;
  when: string;
  category: string;
  photo?: string | null;
  status: JobStatus;
  ownerId: number;
  ownerName: string;
  ownerCity: string;
  ownerRating: number;
  ownerAvatar?: string | null;
  executorAvatar?: string | null;
  assignedExecutorId?: number | null;
  executorName?: string | null;
  executorRating?: number | null;
  executorSkill?: string | null;
  executorDone?: number | null;
  assignedAt?: string | null;
  deadlineAt?: string | null;
  finalPrice?: number | null;
  createdAt: string;
  completedAt?: string | null;
  isOwner: boolean;
  isAssignedExecutor: boolean;
  executorContactShared: boolean;
  ownerContactShared?: boolean;
  ownerOnline?: boolean;
  executorOnline?: boolean;
  moderation?: 'pending' | 'approved' | 'rejected';
  expiresAt?: string | null;
  bumpedAt?: string | null;
  responses?: JobResponseItem[];
  myReviewDone?: boolean;
  ownerContact?: { contact: string | null; phone: string | null };
  executorContact?: { contact: string | null; phone: string | null } | null;
}