import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import Loader from '@/components/Loader';

interface Ticket {
  id: number;
  topic: string;
  text: string;
  status: 'new' | 'answered' | 'closed';
  answer?: string | null;
  created_at: string;
  answered_at?: string | null;
  user_id: number;
  name: string;
  role: string;
  avatar?: string | null;
  max_id?: string | null;
  phone?: string | null;
  contact?: string | null;
}

const filters = [
  { id: '', label: 'Все' },
  { id: 'new', label: 'Новые' },
  { id: 'answered', label: 'Отвеченные' },
  { id: 'closed', label: 'Закрытые' },
];

const statusMeta: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новое', cls: 'bg-primary/15 text-primary' },
  answered: { label: 'Отвечено', cls: 'bg-emerald-500/15 text-emerald-600' },
  closed: { label: 'Закрыто', cls: 'bg-chip/20 text-chip' },
};

const dateRu = (v: string) =>
  new Date(v).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const AdminSupport = ({ onProfile }: { onProfile: (id: number) => void }) => {
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const load = useCallback(async (s: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const r = await api.auth('admin_support', {
        method: 'POST',
        body: s ? { status: s } : {},
      });
      setItems(r.tickets || []);
    } catch {
      if (!silent) toast({ title: 'Не удалось загрузить обращения' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(status);
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load(status, true);
    }, 30000);
    return () => window.clearInterval(id);
  }, [status, load]);

  const act = async (t: Ticket, action: 'answer' | 'close' | 'delete') => {
    const answer = (answers[t.id] || '').trim();
    if (action === 'answer' && !answer) {
      toast({ title: 'Введите ответ' });
      return;
    }
    setBusy(t.id);
    try {
      await api.auth('admin_support_action', {
        method: 'POST',
        body: { ticketId: t.id, act: action, ...(action === 'answer' ? { answer } : {}) },
      });
      toast({
        title:
          action === 'delete'
            ? 'Обращение удалено'
            : action === 'close'
              ? 'Обращение закрыто'
              : 'Ответ отправлен',
      });
      setAnswers((p) => ({ ...p, [t.id]: '' }));
      await load(status, true);
    } catch {
      toast({ title: 'Не получилось' });
    } finally {
      setBusy(0);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id || 'all'}
            onClick={() => setStatus(f.id)}
            className={`min-h-[44px] rounded-full border px-5 py-2.5 text-sm transition-colors ${
              status === f.id
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
      ) : items.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-chip">
          Обращений нет
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((t) => (
            <article key={t.id} className="rounded-3xl border border-line bg-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar src={t.avatar} name={t.name} size={40} />
                  <div className="min-w-0">
                    <p className="font-medium">
                      <button
                        onClick={() => onProfile(t.user_id)}
                        className="underline underline-offset-2 hover:text-primary"
                      >
                        {t.name}
                      </button>
                      <span className="ml-2 text-xs text-chip">
                        {t.role === 'customer' ? 'заказчик' : 'исполнитель'}
                      </span>
                    </p>
                    <p className="mt-0.5 break-words text-xs text-chip">
                      {[t.max_id ? `MAX ${t.max_id}` : '', t.phone || '', t.contact || '']
                        .filter(Boolean)
                        .join(' · ') || 'контактов нет'}
                    </p>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    statusMeta[t.status]?.cls || 'bg-chip/20 text-chip'
                  }`}
                >
                  {statusMeta[t.status]?.label || t.status}
                </span>
              </div>

              <p className="mt-3 text-sm font-medium">
                {t.topic}
                <span className="ml-2 text-xs font-normal text-chip">{dateRu(t.created_at)}</span>
              </p>
              <p className="mt-1.5 whitespace-pre-line break-words text-sm text-muted-foreground">{t.text}</p>

              {t.answer && (
                <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
                  <p className="text-xs font-medium text-primary">Ответ отправлен</p>
                  <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                    {t.answer}
                  </p>
                </div>
              )}

              <div className="mt-4 space-y-3 border-t border-line pt-4">
                <textarea
                  value={answers[t.id] || ''}
                  onChange={(e) => setAnswers((p) => ({ ...p, [t.id]: e.target.value }))}
                  placeholder="Ответ пользователю"
                  className="min-h-[80px] w-full resize-none rounded-2xl border border-line bg-tile px-4 py-3 text-base outline-none placeholder:text-chip focus:border-primary/60 sm:text-sm"
                />
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <button
                    disabled={busy === t.id}
                    onClick={() => act(t, 'answer')}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  >
                    <Icon name="Send" size={15} />
                    Ответить
                  </button>
                  <button
                    disabled={busy === t.id}
                    onClick={() => act(t, 'close')}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-line px-5 py-2 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
                  >
                    <Icon name="CircleCheck" size={15} />
                    Закрыть
                  </button>
                  <button
                    disabled={busy === t.id}
                    onClick={() => act(t, 'delete')}
                    className="col-span-2 flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-line px-5 py-2 text-sm transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60 sm:col-span-1"
                  >
                    <Icon name="Trash2" size={15} />
                    Удалить
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminSupport;