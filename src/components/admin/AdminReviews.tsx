import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { api } from '@/lib/api';
import { money } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

interface AdminReview {
  id: number;
  rating: number;
  text: string;
  created_at: string;
  hidden: boolean;
  author_name: string;
  author_role: string;
  author_avatar?: string | null;
  target_id: number;
  target_name: string;
  target_role: string;
  job_title: string;
  final_price: number | null;
}

const filters = [
  { id: '', label: 'Все отзывы' },
  { id: 'to_executor', label: 'Заказчики → исполнителям' },
  { id: 'to_customer', label: 'Исполнители → заказчикам' },
];

const dateRu = (v: string) =>
  new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

const AdminReviews = ({ onProfile }: { onProfile: (id: number) => void }) => {
  const [direction, setDirection] = useState('');
  const [items, setItems] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(0);

  const load = async (d = direction) => {
    setLoading(true);
    try {
      const r = await api.jobs('admin_reviews', {
        method: 'POST',
        body: d ? { direction: d } : {},
      });
      setItems(r.reviews || []);
    } catch {
      toast({ title: 'Не удалось загрузить отзывы' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(direction);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [direction]);

  const act = async (id: number, action: 'hide' | 'show' | 'delete') => {
    setBusy(id);
    try {
      await api.jobs('admin_review_action', {
        method: 'POST',
        body: { reviewId: id, act: action },
      });
      toast({
        title:
          action === 'delete'
            ? 'Отзыв удалён'
            : action === 'hide'
              ? 'Отзыв скрыт'
              : 'Отзыв опубликован',
      });
      await load(direction);
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
            onClick={() => setDirection(f.id)}
            className={`min-h-[44px] rounded-full border px-5 py-2.5 text-sm transition-colors ${
              direction === f.id
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
      ) : items.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-chip">
          Отзывов нет
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((r) => (
            <article
              key={r.id}
              className={`rounded-3xl border bg-surface p-4 sm:p-5 ${
                r.hidden ? 'border-destructive/40 opacity-70' : 'border-line'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <Avatar src={r.author_avatar} name={r.author_name} size={40} />
                  <div className="min-w-0">
                    <p className="font-medium">
                      {r.author_name}
                      <span className="ml-2 text-xs text-chip">
                        {r.author_role === 'customer' ? 'заказчик' : 'исполнитель'}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-chip">
                      о{' '}
                      <button
                        onClick={() => onProfile(r.target_id)}
                        className="underline underline-offset-2 hover:text-foreground"
                      >
                        {r.target_name}
                      </button>{' '}
                      · заказ «{r.job_title}»
                      {r.final_price ? ` · ${money(r.final_price)}` : ''} · {dateRu(r.created_at)}
                    </p>
                  </div>
                </div>
                <span className="font-head text-lg text-primary">
                  {'★'.repeat(r.rating)}
                  <span className="text-chip">{'★'.repeat(5 - r.rating)}</span>
                </span>
              </div>

              {r.text && <p className="mt-3 break-words text-sm text-muted-foreground">{r.text}</p>}

              {r.hidden && (
                <p className="mt-3 flex items-center gap-2 text-xs text-destructive">
                  <Icon name="EyeOff" size={14} />
                  Скрыт — не влияет на рейтинг и не виден в профиле
                </p>
              )}

              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:flex sm:flex-wrap">
                {r.hidden ? (
                  <button
                    disabled={busy === r.id}
                    onClick={() => act(r.id, 'show')}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
                  >
                    <Icon name="Eye" size={15} />
                    Опубликовать
                  </button>
                ) : (
                  <button
                    disabled={busy === r.id}
                    onClick={() => act(r.id, 'hide')}
                    className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-line px-5 py-2 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
                  >
                    <Icon name="EyeOff" size={15} />
                    Скрыть
                  </button>
                )}
                <button
                  disabled={busy === r.id}
                  onClick={() => act(r.id, 'delete')}
                  className="flex min-h-[44px] items-center justify-center gap-1.5 rounded-full border border-line px-5 py-2 text-sm transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60"
                >
                  <Icon name="Trash2" size={15} />
                  Удалить
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
