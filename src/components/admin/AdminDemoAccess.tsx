import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api, getToken, setToken } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const ADMIN_BACKUP = 'dodelay_admin_token';

const AdminDemoAccess = () => {
  const [busy, setBusy] = useState('');

  const enter = async (role: 'customer' | 'executor') => {
    setBusy(role);
    try {
      const r = await api.auth('admin_demo_login', { method: 'POST', body: { role } });
      localStorage.setItem(ADMIN_BACKUP, getToken());
      setToken(r.user.token);
      window.location.href = '/dashboard';
    } catch {
      toast({ title: 'Не удалось открыть демо-кабинет' });
      setBusy('');
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name="FlaskConical" size={20} />
        </span>
        <div className="min-w-0">
          <h3 className="font-head text-lg font-medium">Тестовые кабинеты</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Войдите демо-аккаунтом, чтобы вживую посмотреть кабинет роли. Ваш админ-доступ
            сохранится — вернуться можно кнопкой ниже.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          disabled={!!busy}
          onClick={() => enter('customer')}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          <Icon name="ClipboardList" size={16} />
          Кабинет заказчика
        </button>
        <button
          disabled={!!busy}
          onClick={() => enter('executor')}
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60"
        >
          <Icon name="Hammer" size={16} />
          Кабинет исполнителя
        </button>
      </div>
    </div>
  );
};

export const AdminReturnBanner = () => {
  const backup = localStorage.getItem(ADMIN_BACKUP);
  if (!backup) return null;

  return (
    <div className="border-b border-primary/30 bg-primary/10">
      <div className="mx-auto flex w-full max-w-[1400px] flex-wrap items-center justify-between gap-3 px-5 py-3 md:px-10 lg:px-16">
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon name="FlaskConical" size={16} className="text-primary" />
          Вы в тестовом кабинете. Реальные пользователи это не видят.
        </p>
        <button
          onClick={() => {
            setToken(backup);
            localStorage.removeItem(ADMIN_BACKUP);
            window.location.href = '/admin';
          }}
          className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Вернуться в админку
        </button>
      </div>
    </div>
  );
};

export default AdminDemoAccess;
