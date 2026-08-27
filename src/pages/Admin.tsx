import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import { api } from '@/lib/api';
import { money } from '@/data/mock';
import EditProfileDialog from '@/components/EditProfileDialog';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminJobs from '@/components/admin/AdminJobs';
import AdminRoleView from '@/components/admin/AdminRoleView';
import AdminModeration from '@/components/admin/AdminModeration';
import AdminDemoAccess from '@/components/admin/AdminDemoAccess';
import AdminReviews from '@/components/admin/AdminReviews';
import AdminSupport from '@/components/admin/AdminSupport';
import ProfileDialog from '@/components/ProfileDialog';

type Mode = 'customer' | 'executor' | 'admin';

interface Stats {
  customers: number;
  executors: number;
  blocked: number;
  open_jobs: number;
  active_jobs: number;
  done_jobs: number;
  cancelled_jobs: number;
  turnover: number;
  reviews: number;
}

const tiles: { key: keyof Stats; label: string; icon: string; money?: boolean }[] = [
  { key: 'customers', label: 'заказчиков', icon: 'UserRound' },
  { key: 'executors', label: 'исполнителей', icon: 'Hammer' },
  { key: 'blocked', label: 'заблокировано', icon: 'Ban' },
  { key: 'open_jobs', label: 'открытых заказов', icon: 'Radar' },
  { key: 'active_jobs', label: 'в работе', icon: 'Timer' },
  { key: 'done_jobs', label: 'завершено', icon: 'CircleCheck' },
  { key: 'cancelled_jobs', label: 'отменено', icon: 'CircleX' },
  { key: 'turnover', label: 'оборот', icon: 'Wallet', money: true },
  { key: 'reviews', label: 'отзывов', icon: 'Star' },
];

const modes: { id: Mode; label: string }[] = [
  { id: 'customer', label: 'Заказчик' },
  { id: 'executor', label: 'Исполнитель' },
  { id: 'admin', label: 'Админ' },
];

const modeNote: Record<Mode, string> = {
  customer: 'Режим просмотра: Заказчик (только для чтения, действия недоступны)',
  executor: 'Режим просмотра: Исполнитель (только для чтения, действия недоступны)',
  admin: 'Режим просмотра: Админ — доступны все действия',
};

const AdminInner = () => {
  const { user, loading, logout } = useAppState();
  const [mode, setMode] = useState<Mode>('admin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState<number | null>(null);
  const [newTickets, setNewTickets] = useState(0);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api
      .jobs('admin_stats', { method: 'POST', body: {} })
      .then((r) => setStats(r as Stats))
      .catch(() => undefined);
  }, [user?.isAdmin]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    const load = () =>
      api
        .auth('admin_support', { method: 'POST', body: { status: 'new' } })
        .then((r) => setNewTickets((r.tickets || []).length))
        .catch(() => undefined);
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    return () => window.clearInterval(id);
  }, [user?.isAdmin]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-chip">
        Загружаем админку…
      </div>
    );
  }
  if (!user?.isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-5 py-4 md:px-10 md:py-5 lg:px-16">
          <div>
            <p className="font-head text-xl font-bold leading-none tracking-tight">
              Админка Доделай.ру
            </p>
            <p className="mt-1 text-xs text-chip">Панель управления сервисом</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex items-center gap-3 rounded-full border border-line px-3 py-1.5 transition-colors hover:border-primary/50"
            >
              <Avatar src={user.avatar} name={user.name} size={34} />
              <span className="text-sm font-medium">{user.name}</span>
            </button>
            <Link
              to="/"
              className="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/50"
            >
              На сайт
            </Link>
            <button
              onClick={logout}
              className="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/50"
            >
              Выйти
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-12 lg:px-16">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          {tiles.map((t) => (
            <div
              key={t.key}
              className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Icon name={t.icon} size={20} />
              </span>
              <div className="min-w-0">
                <p className="font-head text-2xl font-medium">
                  {stats ? (t.money ? money(stats[t.key]) : stats[t.key]) : '—'}
                </p>
                <p className="truncate text-sm text-chip">{t.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8">
          <AdminDemoAccess />
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <p className="text-sm text-chip">Смотрю как:</p>
          <div className="flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
            {modes.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  mode === m.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <p className="mt-5 flex items-center gap-2 rounded-2xl border border-line bg-tile px-5 py-3.5 text-sm text-muted-foreground">
          <Icon name="Eye" size={16} className="text-primary" />
          {modeNote[mode]}
        </p>

        <div className="mt-8">
          {mode === 'admin' ? (
            <Tabs defaultValue="moderation">
              <TabsList className="flex w-full flex-wrap justify-start gap-1 rounded-full border border-line bg-surface p-1 sm:w-auto">
                <TabsTrigger value="moderation" className="rounded-full px-6 py-2 text-sm">
                  Модерация
                </TabsTrigger>
                <TabsTrigger value="support" className="rounded-full px-6 py-2 text-sm">
                  Обращения{newTickets > 0 ? ` · ${newTickets}` : ''}
                </TabsTrigger>
                <TabsTrigger value="users" className="rounded-full px-6 py-2 text-sm">
                  Пользователи
                </TabsTrigger>
                <TabsTrigger value="jobs" className="rounded-full px-6 py-2 text-sm">
                  Заказы
                </TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-full px-6 py-2 text-sm">
                  Отзывы
                </TabsTrigger>
              </TabsList>
              <TabsContent value="moderation" className="mt-6">
                <AdminModeration />
              </TabsContent>
              <TabsContent value="support" className="mt-6">
                <AdminSupport onProfile={setViewProfile} />
              </TabsContent>
              <TabsContent value="users" className="mt-6">
                <AdminUsers onProfile={setViewProfile} />
              </TabsContent>
              <TabsContent value="reviews" className="mt-6">
                <AdminReviews onProfile={setViewProfile} />
              </TabsContent>
              <TabsContent value="jobs" className="mt-6">
                <AdminJobs />
              </TabsContent>
            </Tabs>
          ) : (
            <AdminRoleView mode={mode} />
          )}
        </div>
      </main>

      <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ProfileDialog
        userId={viewProfile}
        showDetails
        onOpenChange={() => setViewProfile(null)}
      />
    </div>
  );
};

const Admin = () => (
  <AppStateProvider>
    <AdminInner />
  </AppStateProvider>
);

export default Admin;