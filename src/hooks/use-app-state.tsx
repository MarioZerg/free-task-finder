import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { api, clearToken, getToken, payStart, setToken } from '@/lib/api';
import type { JobInvite, JobItem, UnreadInfo, User } from '@/lib/api';
import { reachGoal } from '@/hooks/use-metrika';

export type Role = 'customer' | 'executor';

export interface ProfilePayload {
  name?: string;
  city?: string;
  phone?: string;
  contact?: string;
  skill?: string;
  about?: string;
  avatar?: string;
  gender?: string;
}

export interface Limits {
  busy: boolean;
  canCreate: boolean;
  activeJobId: number | null;
  activeExpiresAt: string | null;
  pro?: boolean;
  activeCount?: number;
  activeLimit?: number;
}

interface AppState {
  user: User | null;
  loading: boolean;
  limits: Limits;
  maxEnabled: boolean;
  feed: JobItem[];
  myJobs: JobItem[];
  stats: { openJobs: number; doneJobs: number; executors: number; avgCheck: number };
  loginOpen: boolean;
  loginRole: Role;
  openLogin: (role: Role) => void;
  setLoginOpen: (v: boolean) => void;
  signIn: (payload: {
    maxId?: string;
    code?: string;
    role: Role;
    name?: string;
    city?: string;
    phone?: string;
    contact?: string;
    skill?: string;
    about?: string;
    acceptedTerms?: boolean;
  }) => Promise<User>;
  startMaxLogin: () => Promise<{ code: string; botLink: string; botName: string }>;
  updateProfile: (payload: ProfilePayload) => Promise<void>;
  setUserData: (user: User) => void;
  subscribe: (months: number) => Promise<void>;
  startPayment: (months: number) => Promise<{
    paymentsEnabled: boolean;
    paymentUrl?: string;
    paymentId?: number;
    amount: number;
  }>;
  unsubscribe: (immediate: boolean) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  createJob: (job: {
    title: string;
    description: string;
    price: number;
    city: string;
    when: string;
    category: string;
    photoThumb?: string;
    photoFull?: string;
  }) => Promise<void>;
  editJob: (job: {
    jobId: number;
    title: string;
    description: string;
    price: number;
    city: string;
    when: string;
    category: string;
    photoThumb?: string;
    photoFull?: string;
  }) => Promise<void>;
  respond: (jobId: number, note: string) => Promise<void>;
  assign: (jobId: number, executorId: number) => Promise<void>;
  shareContact: (jobId: number) => Promise<void>;
  complete: (jobId: number, finalPrice: number) => Promise<void>;
  cancel: (jobId: number) => Promise<void>;
  removeJob: (jobId: number) => Promise<void>;
  bumpJob: (jobId: number) => Promise<void>;
  sendMessage: (jobId: number, text: string) => Promise<void>;
  review: (jobId: number, rating: number, text: string) => Promise<void>;
  invites: JobInvite[];
  acceptInvite: (inviteId: number) => Promise<void>;
  declineInvite: (inviteId: number) => Promise<void>;
  unread: UnreadInfo;
}

const Ctx = createContext<AppState | null>(null);

const emptyStats = { openJobs: 0, doneJobs: 0, executors: 0, avgCheck: 0 };

const emptyLimits: Limits = {
  busy: false,
  canCreate: true,
  activeJobId: null,
  activeExpiresAt: null,
  pro: false,
};

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<JobItem[]>([]);
  const [myJobs, setMyJobs] = useState<JobItem[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [limits, setLimits] = useState<Limits>(emptyLimits);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<Role>('customer');
  const [maxEnabled, setMaxEnabled] = useState(false);
  const [invites, setInvites] = useState<JobInvite[]>([]);
  const [unread, setUnread] = useState<UnreadInfo>({ total: 0, byUser: {} });

  const loadPublic = useCallback(async () => {
    const f = await api.jobs('feed').catch(() => ({ jobs: [] }));
    setFeed(f.jobs || []);
  }, []);

  const loadStats = useCallback(async () => {
    const s = await api.jobs('stats').catch(() => emptyStats);
    setStats({ ...emptyStats, ...s });
  }, []);

  const loadMine = useCallback(async () => {
    if (!getToken()) {
      setMyJobs([]);
      setLimits(emptyLimits);
      setInvites([]);
      setUnread({ total: 0, byUser: {} });
      return;
    }
    const r = await api.jobs('mine').catch(() => ({ jobs: [], limits: emptyLimits, invites: [] }));
    setMyJobs(r.jobs || []);
    setLimits({ ...emptyLimits, ...(r.limits || {}) });
    setInvites(r.invites || []);
    setUnread(r.unread || { total: 0, byUser: {} });
  }, []);

  const refreshing = useRef(false);

  const refresh = useCallback(async () => {
    if (refreshing.current) return;
    refreshing.current = true;
    try {
      await Promise.all([loadPublic(), loadMine()]);
    } finally {
      refreshing.current = false;
    }
  }, [loadPublic, loadMine]);

  useEffect(() => {
    const init = async () => {
      api
        .auth('config')
        .then((r) => setMaxEnabled(!!r.maxEnabled))
        .catch(() => undefined);
      if (getToken()) {
        try {
          const r = await api.auth('me');
          setUser(r.user);
        } catch {
          clearToken();
        }
      }
      await refresh();
      setLoading(false);
      loadStats();
    };
    init();
  }, [refresh, loadStats]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, 12000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const openLogin = useCallback((role: Role) => {
    setLoginRole(role);
    setLoginOpen(true);
  }, []);

  const signIn = useCallback<AppState['signIn']>(
    async (payload) => {
      const r = await api.auth('login', { method: 'POST', body: payload });
      if (r.user?.token) setToken(r.user.token);
      reachGoal(r.created ? 'signup' : 'login', { role: r.user?.role });
      setUser(r.user);
      setLoginOpen(false);
      await refresh();
      return r.user as User;
    },
    [refresh],
  );

  const startMaxLogin = useCallback<AppState['startMaxLogin']>(async () => {
    const r = await api.auth('login_start', { method: 'POST', body: {} });
    setMaxEnabled(!!r.maxEnabled);
    return { code: r.code, botLink: r.botLink, botName: r.botName };
  }, []);

  const updateProfile = useCallback<AppState['updateProfile']>(async (payload) => {
    const r = await api.auth('profile', { method: 'PUT', body: payload });
    setUser(r.user);
  }, []);

  const setUserData = useCallback<AppState['setUserData']>((next) => {
    setUser((prev) => (prev ? { ...prev, ...next } : next));
  }, []);

  const subscribe = useCallback<AppState['subscribe']>(
    async (months) => {
      const r = await api.auth('subscribe', { method: 'POST', body: { months } });
      setUser(r.user);
      await refresh();
    },
    [refresh],
  );

  const startPayment = useCallback<AppState['startPayment']>(async (months) => {
    const r = await payStart(months);
    reachGoal('pay_start', { months, amount: r.amount ?? 0 });
    return {
      paymentsEnabled: !!r.paymentsEnabled,
      paymentUrl: r.paymentUrl,
      paymentId: r.paymentId,
      amount: r.amount ?? 0,
    };
  }, []);

  const unsubscribe = useCallback<AppState['unsubscribe']>(async (immediate) => {
    const r = await api.auth('unsubscribe', { method: 'POST', body: { immediate } });
    setUser(r.user);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setMyJobs([]);
    setLimits(emptyLimits);
  }, []);

  const act = useCallback(
    async (action: string, body: Record<string, unknown>) => {
      await api.jobs(action, { method: 'POST', body });
      await refresh();
    },
    [refresh],
  );

  const value = useMemo<AppState>(
    () => ({
      user,
      loading,
      limits,
      maxEnabled,
      feed,
      myJobs,
      stats,
      loginOpen,
      loginRole,
      openLogin,
      setLoginOpen,
      signIn,
      startMaxLogin,
      updateProfile,
      setUserData,
      subscribe,
      startPayment,
      unsubscribe,
      logout,
      refresh,
      createJob: (job) => act('create', job),
      editJob: (job) => act('edit', job),
      respond: (jobId, note) => act('respond', { jobId, note }),
      assign: (jobId, executorId) => act('assign', { jobId, executorId }),
      shareContact: (jobId) => act('share_contact', { jobId }),
      complete: (jobId, finalPrice) => act('complete', { jobId, finalPrice }),
      cancel: (jobId) => act('cancel', { jobId }),
      removeJob: (jobId) => act('delete', { jobId }),
      bumpJob: (jobId) => act('bump', { jobId }),
      sendMessage: (jobId, text) => act('message', { jobId, text }),
      review: (jobId, rating, text) => act('review', { jobId, rating, text }),
      invites,
      acceptInvite: (inviteId) => act('invite_accept', { inviteId }),
      declineInvite: (inviteId) => act('invite_decline', { inviteId }),
      unread,
    }),
    [
      user,
      loading,
      limits,
      maxEnabled,
      feed,
      invites,
      unread,
      myJobs,
      stats,
      loginOpen,
      loginRole,
      openLogin,
      signIn,
      startMaxLogin,
      updateProfile,
      setUserData,
      subscribe,
      startPayment,
      unsubscribe,
      logout,
      refresh,
      act,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAppState = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
};