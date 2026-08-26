import { createContext, useCallback, useContext, useMemo, useState, ReactNode } from 'react';
import { initialJobs, Job, Role } from '@/data/mock';

interface Session {
  role: Role;
  name: string;
  executorId?: string;
}

interface AppState {
  session: Session | null;
  login: (role: Role, name: string) => void;
  logout: () => void;
  jobs: Job[];
  addJob: (job: Omit<Job, 'id' | 'ownerId' | 'responses'>) => void;
  respond: (jobId: string, executorId: string, note: string) => void;
  confirm: (jobId: string, executorId: string) => void;
  cancelConfirm: (jobId: string) => void;
  loginOpen: boolean;
  loginRole: Role;
  openLogin: (role: Role) => void;
  setLoginOpen: (v: boolean) => void;
}

const Ctx = createContext<AppState | null>(null);

export const AppStateProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [loginOpen, setLoginOpen] = useState(false);
  const [loginRole, setLoginRole] = useState<Role>('customer');

  const login = useCallback((role: Role, name: string) => {
    setSession({ role, name, executorId: role === 'executor' ? 'e1' : undefined });
    setLoginOpen(false);
  }, []);

  const logout = useCallback(() => setSession(null), []);

  const openLogin = useCallback((role: Role) => {
    setLoginRole(role);
    setLoginOpen(true);
  }, []);

  const addJob = useCallback((job: Omit<Job, 'id' | 'ownerId' | 'responses'>) => {
    setJobs((prev) => [
      { ...job, id: `j${Date.now()}`, ownerId: 'me', responses: [] },
      ...prev,
    ]);
  }, []);

  const respond = useCallback((jobId: string, executorId: string, note: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId && !j.responses.some((r) => r.executorId === executorId)
          ? { ...j, responses: [...j.responses, { executorId, note }] }
          : j,
      ),
    );
  }, []);

  const confirm = useCallback((jobId: string, executorId: string) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, confirmed: executorId } : j)));
  }, []);

  const cancelConfirm = useCallback((jobId: string) => {
    setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, confirmed: undefined } : j)));
  }, []);

  const value = useMemo(
    () => ({
      session,
      login,
      logout,
      jobs,
      addJob,
      respond,
      confirm,
      cancelConfirm,
      loginOpen,
      loginRole,
      openLogin,
      setLoginOpen,
    }),
    [session, jobs, loginOpen, loginRole, login, logout, addJob, respond, confirm, cancelConfirm, openLogin],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAppState = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider');
  return ctx;
};
