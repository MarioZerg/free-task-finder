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
import { api, clearToken, getToken, JobItem, setToken, User } from '@/lib/api';

export type Role = 'customer' | 'executor';

interface AppState {
  user: User | null;
  loading: boolean;
  feed: JobItem[];
  myJobs: JobItem[];
  completed: JobItem[];
  stats: { openJobs: number; doneJobs: number; executors: number; avgCheck: number };
  loginOpen: boolean;
  loginRole: Role;
  openLogin: (role: Role) => void;
  setLoginOpen: (v: boolean) => void;
  signIn: (payload: {
    maxId: string;
    role: Role;
    name?: string;
    city?: string;
    phone?: string;
    contact?: string;
    skill?: string;
    about?: string;
    acceptedTerms?: boolean;
  }) => Promise<void>;
  logout: () => void;
  refresh: () => Promise<void>;
  createJob: (job: {
    title: string;
    description: string;
    price: number;
    city: string;
    when: string;
    category: string;
    photo?: string;
  }) => Promise<void>;
  respond: (jobId: number, note: string) => Promise<void>;
  assign: (jobId: number, executorId: number) => Promise<void>;
  shareContact: (jobId: number) => Promise<void>;
  complete: (jobId: number, finalPrice: number) => Promise<void>;
  cancel: (jobId: number) => Promise<void>;
  review: (jobId: number, rating: number, text: string) => Promise<void>;
}

const Ctx = createContext<AppState | null>(null);

const emptyStats = { openJobs: 0, doneJobs: 0, executors: 0, avgCheck: 0 };

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [feed, setFeed] = useState<JobItem[]>([]);
  const [myJobs, setMyJobs] = useState<JobItem[]>([]);
  const [completed, setCompleted] = useState<JobItem[]>([]);
  const [stats, setStats] = useState(emptyStats);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<Role>('customer');
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const loadPublic = useCallback(async () => {
    const [f, c, s] = await Promise.all([
      api.jobs('feed').catch(() => ({ jobs: [] })),
      api.jobs('completed').catch(() => ({ jobs: [] })),
      api.jobs('stats').catch(() => emptyStats),
    ]);
    setFeed(f.jobs || []);
    setCompleted(c.jobs || []);
    setStats({ ...emptyStats, ...s });
  }, []);

  const loadMine = useCallback(async () => {
    if (!getToken()) {
      setMyJobs([]);
      return;
    }
    const r = await api.jobs('mine').catch(() => ({ jobs: [] }));
    setMyJobs(r.jobs || []);
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([loadPublic(), loadMine()]);
  }, [loadPublic, loadMine]);

  useEffect(() => {
    const init = async () => {
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
    };
    init();
  }, [refresh]);

  useEffect(() => {
    const id = window.setInterval(() => {
      refresh();
    }, 7000);
    return () => window.clearInterval(id);
  }, [refresh]);

  const openLogin = useCallback((role: Role) => {
    setLoginRole(role);
    setLoginOpen(true);
  }, []);

  const signIn = useCallback<AppState['signIn']>(
    async (payload) => {
      const r = await api.auth('login', { method: 'POST', body: payload });
      if (r.user?.token) setToken(r.user.token);
      setUser(r.user);
      setLoginOpen(false);
      await refresh();
    },
    [refresh],
  );

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
    setMyJobs([]);
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
      feed,
      myJobs,
      completed,
      stats,
      loginOpen,
      loginRole,
      openLogin,
      setLoginOpen,
      signIn,
      logout,
      refresh,
      createJob: (job) => act('create', job),
      respond: (jobId, note) => act('respond', { jobId, note }),
      assign: (jobId, executorId) => act('assign', { jobId, executorId }),
      shareContact: (jobId) => act('share_contact', { jobId }),
      complete: (jobId, finalPrice) => act('complete', { jobId, finalPrice }),
      cancel: (jobId) => act('cancel', { jobId }),
      review: (jobId, rating, text) => act('review', { jobId, rating, text }),
    }),
    [user, loading, feed, myJobs, completed, stats, loginOpen, loginRole, openLogin, signIn, logout, refresh, act],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAppState = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
};
