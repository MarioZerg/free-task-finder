import { useEffect, useRef, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import DashHeader from '@/components/DashHeader';
import { AdminReturnBanner } from '@/components/admin/AdminDemoAccess';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import ExecutorDashboard from '@/components/dashboard/ExecutorDashboard';
import Icon from '@/components/ui/icon';
import { payCheck } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import useSeo from '@/hooks/use-seo';
import { PageLoader } from '@/components/Loader';
import { reachGoal } from '@/hooks/use-metrika';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DashboardInner = () => {
  const { user, loading, setUserData, refresh } = useAppState();
  const [checking, setChecking] = useState(false);
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (!payment) return;
    handled.current = true;

    const pid = Number(params.get('pid'));
    params.delete('payment');
    params.delete('pid');
    const rest = params.toString();
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${rest ? `?${rest}` : ''}${window.location.hash}`,
    );

    if (payment === 'fail' || !pid) {
      if (payment === 'fail') toast({ title: 'Оплата не прошла. Попробуйте ещё раз.' });
      return;
    }

    let alive = true;
    const poll = async () => {
      setChecking(true);
      try {
        for (let i = 0; i < 5; i += 1) {
          if (i > 0) await wait(3000);
          if (!alive) return;
          const r = await payCheck(pid).catch(() => null);
          if (!alive) return;
          if (r?.status === 'paid') {
            if (r.user) setUserData(r.user);
            reachGoal('pay_success');
            await refresh();
            toast({
              title: 'Подписка Доделай PRO активна',
              description: 'Спасибо за оплату — все возможности уже включены.',
            });
            return;
          }
        }
        toast({
          title: 'Платёж обрабатывается банком',
          description: 'Обновите страницу через минуту.',
        });
      } finally {
        if (alive) setChecking(false);
      }
    };
    poll();
    return () => {
      alive = false;
    };
  }, [setUserData, refresh]);

  if (loading) {
    return (
      <PageLoader />
    );
  }
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <AdminReturnBanner />
      <DashHeader />
      {checking && (
        <div className="mx-auto flex max-w-5xl items-center gap-2.5 px-5 pt-4">
          <p className="flex w-full items-center gap-2.5 rounded-2xl border border-line bg-tile px-4 py-3 text-sm text-muted-foreground">
            <Icon name="Loader" size={16} className="shrink-0 animate-spin text-primary" />
            Проверяем оплату…
          </p>
        </div>
      )}
      <main>{user.role === 'customer' ? <CustomerDashboard /> : <ExecutorDashboard />}</main>
    </div>
  );
};

const Dashboard = () => {
  useSeo({
    title: 'Личный кабинет — Доделай.ру',
    description: 'Личный кабинет сервиса Доделай.ру: ваши задания, отклики и подписка.',
    canonical: 'https://dodelay.ru/dashboard',
    robots: 'noindex, nofollow',
  });

  return (
    <AppStateProvider>
      <DashboardInner />
    </AppStateProvider>
  );
};

export default Dashboard;