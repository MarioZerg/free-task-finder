import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { api } from '@/lib/api';
import type { User } from '@/lib/api';
import { CITIES } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import Loader from '@/components/Loader';

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

const proUntilText = (u: User | null) => {
  if (!u?.subscriptionUntil) return '';
  const d = new Date(u.subscriptionUntil);
  // Бессрочную подписку держим датой далеко в будущем — показываем словом.
  if (d.getFullYear() >= 2099) return 'бессрочно';
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
};

const filters = [
  { id: 'all', label: 'Все' },
  { id: 'real', label: 'Реальные' },
  { id: 'demo', label: 'Демо' },
];

const AdminUsers = ({ onProfile }: { onProfile: (id: number) => void }) => {
  const [role, setRole] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', city: '', skill: '' });
  const [busy, setBusy] = useState(false);
  const [toDelete, setToDelete] = useState<User | null>(null);
  const [proUser, setProUser] = useState<User | null>(null);

  const load = async (r = role) => {
    setLoading(true);
    try {
      const res = await api.auth('admin_users', {
        method: 'POST',
        body: r === 'all' ? {} : { role: r },
      });
      if (r === 'all') {
        const list = (res.users || []) as User[];
        setUsers([...list].sort((a, b) => Number(a.isDemo) - Number(b.isDemo)));
        return;
      }
      setUsers(res.users || []);
    } catch {
      toast({ title: 'Не удалось загрузить пользователей' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role]);

  const update = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try {
      await api.auth('admin_update_user', { method: 'POST', body });
      toast({ title: ok });
      await load(role);
    } catch {
      toast({ title: 'Не получилось', description: 'Действие не выполнено.' });
    } finally {
      setBusy(false);
    }
  };

  const grantPro = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try {
      await api.auth('admin_grant_pro', { method: 'POST', body });
      toast({ title: ok });
      setProUser(null);
      await load(role);
    } catch {
      toast({ title: 'Не получилось', description: 'Подписка не изменена.' });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (user: User) => {
    setBusy(true);
    try {
      await api.auth('admin_delete_user', {
        method: 'POST',
        body: { userId: user.id },
      });
      toast({
        title: 'Пользователь удалён',
        description: `${user.name} и его личные данные стёрты без возможности восстановления.`,
      });
      setToDelete(null);
      await load(role);
    } catch (e) {
      const code = e instanceof Error ? e.message : '';
      const reason = code.includes('admin_protected')
        ? 'Нельзя удалить администратора.'
        : code.includes('self_delete')
          ? 'Нельзя удалить самого себя.'
          : 'Действие не выполнено.';
      toast({ title: 'Не получилось', description: reason });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setRole(f.id)}
            className={`min-h-[44px] rounded-full border px-5 py-2.5 text-sm transition-colors ${
              role === f.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-line text-muted-foreground hover:border-primary/50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <Loader />
      ) : users.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-chip">
          Пользователей нет
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {users.map((u) => (
            <div
              key={u.id}
              className="flex flex-col gap-4 rounded-3xl border border-line bg-surface p-4 sm:flex-row sm:flex-wrap sm:items-center sm:p-5"
            >
              <div className="flex min-w-0 flex-1 items-start gap-3 sm:items-center">
              <Avatar src={u.avatar} name={u.name} size={48} online={u.online} />
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 break-words font-medium">
                  {u.name}
                  {u.verified && <Icon name="BadgeCheck" size={16} className="text-primary" />}
                  {u.blocked && (
                    <span className="rounded-full border border-destructive/60 px-2.5 py-0.5 text-xs">
                      заблокирован
                    </span>
                  )}
                  {u.isDemo && (
                    <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-600">
                      демо
                    </span>
                  )}
                  {u.isPro && (
                    <span className="flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-600">
                      <Icon name="Crown" size={11} />
                      PRO
                    </span>
                  )}
                </p>
                <p className="mt-0.5 break-words text-sm text-chip">
                  @{u.maxId} · {u.city}
                </p>
                <p className="mt-0.5 break-words text-xs text-chip">
                  ★ {u.rating.toFixed(1)} · {u.doneCount} работ · {u.reviewsCount} отзывов
                  {u.skill ? ` · ${u.skill}` : ''}
                </p>
                <p className="mt-0.5 break-words text-xs text-chip">
                  {u.phone || 'телефон не указан'} · {u.contact || 'контакт не указан'}
                </p>
                {u.isPro && (
                  <p className="mt-0.5 break-words text-xs font-medium text-amber-600">
                    PRO {proUntilText(u) === 'бессрочно' ? 'бессрочно' : `до ${proUntilText(u)}`}
                  </p>
                )}
                {u.about && (
                  <p className="mt-1 line-clamp-2 break-words text-xs text-muted-foreground">
                    {u.about}
                  </p>
                )}
              </div>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                <button
                  onClick={() => onProfile(u.id)}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/50"
                >
                  <Icon name="IdCard" size={15} />
                  Профиль
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    update(
                      { userId: u.id, verified: !u.verified },
                      u.verified ? 'Галочка снята' : 'Пользователь проверен',
                    )
                  }
                  className="min-h-[44px] rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
                >
                  {u.verified ? 'Снять «проверен»' : 'Проверен'}
                </button>
                <button
                  disabled={busy}
                  onClick={() =>
                    update(
                      { userId: u.id, blocked: !u.blocked },
                      u.blocked ? 'Разблокирован' : 'Заблокирован',
                    )
                  }
                  className="min-h-[44px] rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
                >
                  {u.blocked ? 'Разблокировать' : 'Заблокировать'}
                </button>
                <button
                  onClick={() => setProUser(u)}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-amber-500/50 px-4 py-2 text-sm text-amber-600 transition-colors hover:bg-amber-500/10"
                >
                  <Icon name="Crown" size={15} />
                  PRO
                </button>
                <button
                  onClick={() => {
                    setEdit(u);
                    setForm({ name: u.name, city: u.city, skill: u.skill || '' });
                  }}
                  className="min-h-[44px] rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  Изменить
                </button>
                {!u.isAdmin && (
                  <button
                    disabled={busy}
                    onClick={() => setToDelete(u)}
                    title="Удалить навсегда"
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-destructive/40 px-4 py-2 text-sm text-destructive transition-colors hover:border-destructive hover:bg-destructive/10 disabled:opacity-60"
                  >
                    <Icon name="Trash2" size={15} />
                    Удалить
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={() => setEdit(null)}>
        <DialogContent className="border-line bg-surface text-foreground sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-head text-2xl font-medium tracking-tight">
              Редактирование пользователя
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              @{edit?.maxId}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Имя"
              className={field}
            />
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="Город"
              list="admin-cities"
              className={field}
            />
            <datalist id="admin-cities">
              {CITIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
            <input
              value={form.skill}
              onChange={(e) => setForm({ ...form, skill: e.target.value })}
              placeholder="Специализация"
              className={field}
            />
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              if (!edit) return;
              await update({ userId: edit.id, ...form }, 'Профиль обновлён');
              setEdit(null);
            }}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            <Icon name="Check" size={18} />
            Сохранить
          </button>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent className="border-line bg-surface text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head text-2xl font-medium tracking-tight">
              Удалить {toDelete?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Профиль, переписка, отклики и отзывы будут стёрты без возможности
              восстановления. Активные задания снимутся с публикации, а история
              оплат сохранится для отчётности.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-[44px] rounded-full border-line bg-transparent px-6">
              Отмена
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={(e) => {
                e.preventDefault();
                if (toDelete) remove(toDelete);
              }}
              className="min-h-[44px] rounded-full bg-destructive px-6 text-destructive-foreground hover:bg-destructive/90"
            >
              {busy ? 'Удаляю…' : 'Удалить навсегда'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!proUser} onOpenChange={(v) => !v && setProUser(null)}>
        <DialogContent className="border-line bg-surface text-foreground sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-head text-xl font-medium">
              Доделай PRO для {proUser?.name}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {proUser?.isPro
                ? `Подписка активна до ${proUntilText(proUser)}. Новый срок добавится к текущему.`
                : 'Подписка включится сразу. Человек получит уведомление в MAX.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-2">
            {[1, 3, 6, 12].map((m) => (
              <button
                key={m}
                disabled={busy}
                onClick={() =>
                  grantPro(
                    { userId: proUser?.id, months: m },
                    `PRO выдан на ${m} мес.`,
                  )
                }
                className="min-h-[48px] rounded-2xl border border-line bg-tile px-3 text-sm font-medium transition-colors hover:border-primary/60 disabled:opacity-60"
              >
                {m} мес
              </button>
            ))}
            <button
              disabled={busy}
              onClick={() =>
                grantPro({ userId: proUser?.id, forever: true }, 'PRO выдан бессрочно')
              }
              className="col-span-2 flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-amber-500/50 bg-amber-500/10 px-3 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20 disabled:opacity-60"
            >
              <Icon name="Infinity" size={16} />
              Бессрочно
            </button>
          </div>

          {proUser?.isPro && (
            <button
              disabled={busy}
              onClick={() =>
                grantPro({ userId: proUser?.id, revoke: true }, 'PRO отключён')
              }
              className="min-h-[44px] rounded-full border border-destructive/40 px-5 text-sm text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-60"
            >
              Отключить подписку
            </button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;