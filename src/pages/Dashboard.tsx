import { Navigate } from 'react-router-dom';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import DashHeader from '@/components/DashHeader';
import { AdminReturnBanner } from '@/components/admin/AdminDemoAccess';
import CustomerDashboard from '@/components/dashboard/CustomerDashboard';
import ExecutorDashboard from '@/components/dashboard/ExecutorDashboard';

const DashboardInner = () => {
  const { user, loading } = useAppState();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-chip">
        Загружаем кабинет…
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <AdminReturnBanner />
      <DashHeader />
      <main>{user.role === 'customer' ? <CustomerDashboard /> : <ExecutorDashboard />}</main>
    </div>
  );
};

const Dashboard = () => (
  <AppStateProvider>
    <DashboardInner />
  </AppStateProvider>
);

export default Dashboard;
