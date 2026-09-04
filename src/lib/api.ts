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
  lastSeen?: string | null;
  blocked?: boolean;
  isDemo?: boolean;
  createdAt: string;
  phone?: string | null;
  contact?: string | null;
  token?: string;
  isAdmin?: boolean;
  subscriptionUntil?: string | null;
  autoRenew?: boolean;
  isPro?: boolean;
  notifyMessages?: boolean;
  notifyResponses?: boolean;
  notifyStatus?: boolean;
  gender?: string;
  professions?: Profession[];
}

export interface Profession {
  id: number;
  slug: string;
  label: string;
  icon: string;
}

export interface BillingConfig {
  paymentsEnabled: boolean;
  price: number;
  currency: string;
}

export interface PeopleCounts {
  executors: number;
  customers: number;
  online: number;
}

export const billingConfig = (): Promise<BillingConfig> =>
  api.auth('billing_config') as Promise<BillingConfig>;

export const listProfessions = (): Promise<{ professions: Profession[] }> =>
  api.auth('professions') as Promise<{ professions: Profession[] }>;

export const updateMyProfessions = (ids: number[]): Promise<{ user: User }> =>
  api.auth('my_professions', { method: 'PUT', body: { ids } }) as Promise<{ user: User }>;

export const payStart = (
  months: number,
): Promise<{
  paymentsEnabled: boolean;
  paymentId?: number;
  paymentUrl?: string;
  amount: number;
}> =>
  api.auth('pay_start', { method: 'POST', body: { months } }) as Promise<{
    paymentsEnabled: boolean;
    paymentId?: number;
    paymentUrl?: string;
    amount: number;
  }>;

export const payCheck = (paymentId: number): Promise<{ status: 'paid' | 'pending'; user?: User }> =>
  api.auth('pay_check', { method: 'POST', body: { paymentId } }) as Promise<{
    status: 'paid' | 'pending';
    user?: User;
  }>;

export const people = (options: {
  role?: string;
  city?: string;
  professions?: string[];
} = {}): Promise<{ executors: User[]; customers: User[]; counts: PeopleCounts }> => {
  const params: Record<string, string> = {};
  if (options.role) params.role = options.role;
  if (options.city) params.city = options.city;
  if (options.professions && options.professions.length)
    params.professions = options.professions.join(',');
  return api.auth('people', { params }) as Promise<{
    executors: User[];
    customers: User[];
    counts: PeopleCounts;
  }>;
};

export interface PushConfig {
  publicKey: string;
  enabled: boolean;
}

export const pushConfig = (): Promise<PushConfig> =>
  api.auth('push_config') as Promise<PushConfig>;

export const pushSubscribe = (
  sub: { endpoint: string; keys: { p256dh: string; auth: string } },
  userAgent: string,
) =>
  api.auth('push_subscribe', {
    method: 'POST',
    body: { endpoint: sub.endpoint, keys: sub.keys, userAgent },
  });

export const pushUnsubscribe = (endpoint: string) =>
  api.auth('push_unsubscribe', { method: 'POST', body: { endpoint } });

export const pushTest = (): Promise<{ ok: boolean; sent: number }> =>
  api.auth('push_test', { method: 'POST', body: {} }) as Promise<{ ok: boolean; sent: number }>;

export const updateNotifyPrefs = (prefs: {
  messages: boolean;
  responses: boolean;
  status: boolean;
}): Promise<{ user: User }> =>
  api.auth('notify_prefs', { method: 'PUT', body: prefs }) as Promise<{ user: User }>;

export interface SupportTicket {
  id: number;
  topic: string;
  text: string;
  status: 'new' | 'answered' | 'closed';
  answer?: string | null;
  created_at: string;
  answered_at?: string | null;
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

export interface DirectMessage {
  id: number;
  text: string;
  createdAt: string;
  fromId: number;
  fromName: string;
  fromAvatar?: string | null;
  mine: boolean;
}

export interface DirectThread {
  userId: number;
  name: string;
  avatar?: string | null;
  role: 'customer' | 'executor';
  online?: boolean;
  lastAt: string;
  lastText: string;
  unread: number;
}

export interface UnreadInfo {
  total: number;
  byUser: Record<string, number>;
}

export const dmThread = (userId: number): Promise<{ messages: DirectMessage[] }> =>
  api.jobs('dm_thread', { params: { userId: String(userId) } }) as Promise<{
    messages: DirectMessage[];
  }>;

export const dmList = (
  archived = false,
): Promise<{ threads: DirectThread[]; archivedCount: number }> =>
  api.jobs('dm_list', { params: archived ? { archived: '1' } : {} }) as Promise<{
    threads: DirectThread[];
    archivedCount: number;
  }>;

export const dmArchive = (peerId: number, restore = false) =>
  api.jobs('dm_archive', { method: 'POST', body: { peerId, restore } });

export const dmSend = (toId: number, text: string) =>
  api.jobs('dm_send', { method: 'POST', body: { toId, text } });

export interface JobInvite {
  id: number;
  jobId: number;
  note: string;
  createdAt: string;
  title: string;
  price: number;
  city: string;
  when: string;
  customerName: string;
  customerAvatar?: string | null;
  customerRating: number;
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
  lastSeen?: string | null;
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
  hasFullPhoto?: boolean;
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
  isDemo?: boolean;
  profession?: string;
  expiresAt?: string | null;
  bumpedAt?: string | null;
  responses?: JobResponseItem[];
  myReviewDone?: boolean;
  ownerContact?: { contact: string | null; phone: string | null };
  executorContact?: { contact: string | null; phone: string | null } | null;
}