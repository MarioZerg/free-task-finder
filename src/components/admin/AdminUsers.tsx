import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { api, User } from '@/lib/api';
import { CITIES } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

const filters = [
  { id: 'all', label: 'Все' },
  { id: 'customer', label: 'Заказчики' },
  { id: 'executor', label: 'Исполнители' },
];

const AdminUsers = ({ onProfile }: { onProfile: (id: number) => void }) => {
  const [role, setRole] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', city: '', skill: '' });
  const [busy, setBusy] = useState(false);

  const load = async (r = role) => {
    setLoading(true);
    try {
      const res = await api.auth('admin_users', {
        method: 'POST',
        body: r === 'all' ? {} : { role: r },
      });
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
        <p className="mt-8 text-sm text-chip">Загружаем…</p>
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
                </p>
                <p className="mt-0.5 break-words text-sm text-chip">
                  @{u.maxId} · {u.city} · {u.role === 'customer' ? 'заказчик' : 'исполнитель'}
                </p>
                <p className="mt-0.5 break-words text-xs text-chip">
                  ★ {u.rating.toFixed(1)} · {u.doneCount} работ · {u.reviewsCount} отзывов
                  {u.skill ? ` · ${u.skill}` : ''}
                </p>
                <p className="mt-0.5 break-words text-xs text-chip">
                  {u.phone || 'телефон не указан'} · {u.contact || 'контакт не указан'}
                </p>
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
                  onClick={() => {
                    setEdit(u);
                    setForm({ name: u.name, city: u.city, skill: u.skill || '' });
                  }}
                  className="min-h-[44px] rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  Изменить
                </button>
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
    </div>
  );
};

export default AdminUsers;