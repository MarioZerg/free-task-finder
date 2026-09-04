import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import { api } from '@/lib/api';
import EditProfileDialog from '@/components/EditProfileDialog';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminJobs from '@/components/admin/AdminJobs';
import AdminModeration from '@/components/admin/AdminModeration';
import AdminDemoAccess from '@/components/admin/AdminDemoAccess';
import AdminBroadcast from '@/components/admin/AdminBroadcast';
import AdminReviews from '@/components/admin/AdminReviews';
import AdminSupport from '@/components/admin/AdminSupport';
import AdminNav, { allNavItems } from '@/components/admin/AdminNav';
import type { SectionId } from '@/components/admin/AdminNav';
import AdminOverview from '@/components/admin/AdminOverview';
import type { Stats } from '@/components/admin/AdminOverview';
import AdminPreview from '@/components/admin/AdminPreview';
import ProfileDialog from '@/components/ProfileDialog';
import useSeo from '@/hooks/use-seo';

const AdminInner = () => {
  const { user, loading, logout } = useAppState();
  const [section, setSection] = useState<SectionId>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [viewProfile, setViewProfile] = useState<number | null>(null);
  const [newTickets, setNewTickets] = useState(0);
  const [pendingJobs, setPendingJobs] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!user?.isAdmin) return;
    api
      .jobs('admin_stats', { method: 'POST', body: {} })
      .then((r) => setStats(r as Stats))
      .catch(() => undefined);
  }, [user?.isAdmin, section]);

  useEffect(() => {
    if (!user?.isAdmin) return;
    const load = () => {
      api
        .auth('admin_support', { method: 'POST', body: { status: 'new' } })
        .then((r) => setNewTickets((r.tickets || []).length))
        .catch(() => undefined);
      api
        .jobs('admin_jobs', { method: 'POST', body: { status: 'moderation' } })
        .then((r) => setPendingJobs((r.jobs || []).length))
        .catch(() => undefined);
    };
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    return () => window.clearInterval(id);
  }, [user?.isAdmin, section]);

  const badges = useMemo(
    () => ({ support: newTickets, moderation: pendingJobs }),
    [newTickets, pendingJobs],
  );

  const active = allNavItems.find((i) => i.id === section);

  const go = (id: SectionId) => {
    setSection(id);
    setMenuOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-chip">
        Загружаем админку…
      </div>
    );
  }
  if (!user?.isAdmin) return <Navigate to="/" replace />;

  const content = (
    <>
      {section === 'overview' && (
        <AdminOverview
          stats={stats}
          newTickets={newTickets}
          pendingJobs={pendingJobs}
          onGo={go}
        />
      )}
      {section === 'moderation' && <AdminModeration />}
      {section === 'support' && <AdminSupport onProfile={setViewProfile} />}
      {section === 'jobs' && <AdminJobs />}
      {section === 'reviews' && <AdminReviews onProfile={setViewProfile} />}
      {section === 'users' && <AdminUsers onProfile={setViewProfile} />}
      {section === 'broadcast' && <AdminBroadcast />}
      {section === 'preview' && <AdminPreview />}
      {section === 'sandbox' && <AdminDemoAccess />}
    </>
  );

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <header className="safe-top sticky top-0 z-30 border-b border-line bg-surface">
        <div className="safe-x mx-auto flex max-w-[1500px] items-center justify-between gap-3 px-5 py-3.5 md:px-8 md:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Меню разделов"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-line transition-colors hover:border-primary/50 lg:hidden"
                >
                  <Icon name="Menu" size={19} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] overflow-y-auto border-line bg-surface p-5">
                <p className="mb-5 font-head text-lg font-bold tracking-tight">
                  Админка Доделай.ру
                </p>
                <AdminNav active={section} onSelect={go} badges={badges} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0">
              <p className="truncate font-head text-lg font-bold leading-none tracking-tight">
                Админка Доделай.ру
              </p>
              <p className="mt-1 truncate text-xs text-chip">
                {active ? active.hint : 'Панель управления сервисом'}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => setProfileOpen(true)}
              className="flex min-h-[44px] items-center gap-2.5 rounded-full border border-line px-2.5 py-1.5 transition-colors hover:border-primary/50"
            >
              <Avatar src={user.avatar} name={user.name} size={30} />
              <span className="hidden max-w-[120px] truncate text-sm font-medium sm:block">
                {user.name}
              </span>
            </button>
            <Link
              to="/"
              title="На сайт"
              aria-label="На сайт"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line transition-colors hover:border-primary/50"
            >
              <Icon name="ExternalLink" size={17} />
            </Link>
            <button
              onClick={logout}
              title="Выйти"
              aria-label="Выйти"
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-line transition-colors hover:border-primary/50"
            >
              <Icon name="LogOut" size={17} />
            </button>
          </div>
        </div>
      </header>

      <div className="safe-x safe-bottom mx-auto flex w-full max-w-[1500px] gap-8 px-5 py-6 md:px-8 md:py-8">
        <aside className="hidden w-[230px] shrink-0 lg:block">
          <div className="sticky top-[92px]">
            <AdminNav active={section} onSelect={go} badges={badges} />
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-head text-2xl font-normal tracking-tight md:text-3xl">
                {active ? active.label : 'Сводка'}
              </h1>
              <p className="mt-1.5 text-sm text-chip">{active ? active.hint : ''}</p>
            </div>
            {section !== 'overview' && (
              <button
                onClick={() => go('overview')}
                className="flex min-h-[40px] items-center gap-1.5 rounded-full border border-line bg-surface px-4 text-sm text-muted-foreground transition-colors hover:border-primary/50"
              >
                <Icon name="ArrowLeft" size={15} />
                К сводке
              </button>
            )}
          </div>

          {content}
        </main>
      </div>

      <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <ProfileDialog
        userId={viewProfile}
        showDetails
        onOpenChange={() => setViewProfile(null)}
      />
    </div>
  );
};

const Admin = () => {
  useSeo({
    title: 'Администрирование — Доделай.ру',
    description: 'Служебный раздел сервиса Доделай.ру.',
    canonical: 'https://dodelay.ru/admin',
    robots: 'noindex, nofollow',
  });

  return (
    <AppStateProvider>
      <AdminInner />
    </AppStateProvider>
  );
};

export default Admin;
