import { useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppState } from '@/hooks/use-app-state';
import DashHeader from '@/components/DashHeader';
import { AdminReturnBanner } from '@/components/admin/AdminDemoAccess';
import MemberDashboard from '@/components/dashboard/MemberDashboard';
import useSeo from '@/hooks/use-seo';
import { PageLoader } from '@/components/Loader';

const DashboardInner = () => {
  const { user, loading } = useAppState();
  const handled = useRef(false);

  // Старые ссылки из банка вида /dashboard?payment=... больше не приходят:
  // теперь возврат идёт на /payment/success и /payment/fail. Но письма и
  // вкладки со старым адресом ещё могут быть открыты — переводим их туда же.
  useEffect(() => {
    if (handled.current) return;
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (!payment) return;
    handled.current = true;
    const pid = params.get('pid') || '';
    const page = payment === 'fail' ? 'fail' : 'success';
    window.location.replace(`/payment/${page}${pid ? `?pid=${pid}` : ''}`);
  }, []);

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
      <main>
        <MemberDashboard />
      </main>
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
    <DashboardInner />
  );
};

export default Dashboard;