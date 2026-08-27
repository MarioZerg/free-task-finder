import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { api, JobItem } from '@/lib/api';
import { money } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

export const statusLabel: Record<string, string> = {
  open: 'Открыт',
  assigned: 'Назначен',
  expiring: 'Время вышло',
  done: 'Завершён',
  cancelled: 'Отменён',
};

const filters = ['moderation', 'all', 'open', 'assigned', 'done', 'cancelled'];

const filterLabel: Record<string, string> = {
  moderation: 'На модерации',
  all: 'Все',
  ...statusLabel,
};

const dateRu = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) : '—';

const AdminJobs = () => {
  const [status, setStatus] = useState('all');
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<JobItem | null>(null);
  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [busy, setBusy] = useState(false);

  const load = async (s = status) => {
    setLoading(true);
    try {
      const r = await api.jobs('admin_jobs', {
        method: 'POST',
        body: s === 'all' ? {} : { status: s },
      });
      setJobs(r.jobs || []);
    } catch {
      toast({ title: 'Не удалось загрузить заказы' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const update = async (body: Record<string, unknown>, ok: string) => {
    setBusy(true);
    try {
      await api.jobs('admin_update_job', { method: 'POST', body });
      toast({ title: ok });
      await load(status);
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
            key={f}
            onClick={() => setStatus(f)}
            className={`rounded-full border px-5 py-2.5 text-sm transition-colors ${
              status === f
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-line text-muted-foreground hover:border-primary/50'
            }`}
          >
            {filterLabel[f]}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-sm text-chip">Загружаем…</p>
      ) : jobs.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-chip">
          Заказов нет
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {jobs.map((j) => (
            <div
              key={j.id}
              className="flex flex-wrap items-center gap-4 rounded-3xl border border-line bg-surface p-5"
            >
              <div className="min-w-[220px] flex-1">
                <p className="font-head text-lg font-medium">{j.title}</p>
                <p className="mt-1 text-sm text-chip">
                  {money(j.finalPrice || j.price)} · {j.city} · {dateRu(j.createdAt)}
                </p>
                <p className="mt-0.5 text-xs text-chip">
                  Заказчик: {j.ownerName} · Исполнитель: {j.executorName || '—'}
                </p>
                {j.moderation === 'pending' && (
                  <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
                    <Icon name="ShieldQuestion" size={13} />
                    Ждёт проверки модератора
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {j.moderation === 'pending' && (
                  <>
                    <button
                      disabled={busy}
                      onClick={() =>
                        update(
                          { jobId: j.id, moderation: 'approved' },
                          'Задание выставлено в ленту',
                        )
                      }
                      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60"
                    >
                      Одобрить
                    </button>
                    <button
                      disabled={busy}
                      onClick={() =>
                        update(
                          { jobId: j.id, moderation: 'rejected', status: 'cancelled' },
                          'Задание отклонено',
                        )
                      }
                      className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
                    >
                      Отклонить
                    </button>
                  </>
                )}
                <Select
                  value={j.status}
                  onValueChange={(v) => update({ jobId: j.id, status: v }, 'Статус обновлён')}
                >
                  <SelectTrigger className="w-[170px] rounded-full border-line bg-tile">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="border-line bg-surface">
                    {['open', 'assigned', 'done', 'cancelled'].map((s) => (
                      <SelectItem key={s} value={s}>
                        {statusLabel[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <button
                  onClick={() => {
                    setEdit(j);
                    setForm({
                      title: j.title,
                      description: j.description,
                      price: String(j.price),
                    });
                  }}
                  className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                >
                  Изменить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={!!edit} onOpenChange={() => setEdit(null)}>
        <DialogContent className="border-line bg-surface text-foreground sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="font-head text-2xl font-medium tracking-tight">
              Редактирование заказа
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Заказ #{edit?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Заголовок"
              className={field}
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Описание"
              className={`${field} min-h-[110px] resize-none`}
            />
            <input
              value={form.price}
              inputMode="numeric"
              onChange={(e) => setForm({ ...form, price: e.target.value.replace(/\D/g, '') })}
              placeholder="Сумма, ₽"
              className={field}
            />
          </div>
          <button
            disabled={busy}
            onClick={async () => {
              if (!edit) return;
              await update(
                {
                  jobId: edit.id,
                  title: form.title,
                  description: form.description,
                  price: Number(form.price) || 0,
                },
                'Заказ обновлён',
              );
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

export default AdminJobs;