import { useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { money } from '@/data/mock';
import type { ReviewItem } from '@/lib/api';
import { dateMsk } from '@/lib/time';

const dateRu = (v: string) =>
  dateMsk(v);

const ReviewCard = ({ r }: { r: ReviewItem }) => (
  <div className="rounded-2xl border border-line bg-tile p-4">
    <div className="flex items-start gap-3">
      <Avatar src={r.author_avatar} name={r.author_name} size={36} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="min-w-0 break-words text-sm font-medium">{r.author_name}</span>
          <span className="shrink-0 text-sm text-primary">
            {'★'.repeat(r.rating)}
            <span className="text-chip">{'★'.repeat(5 - r.rating)}</span>
          </span>
        </div>
        <p className="mt-1 break-words text-xs text-chip">
          {r.job_title}
          {r.final_price ? ` · ${money(r.final_price)}` : ''} · {dateRu(r.created_at)}
        </p>
        {r.text && (
          <p className="mt-2 break-words text-sm text-muted-foreground">{r.text}</p>
        )}
      </div>
    </div>
  </div>
);

interface Props {
  asExecutor: boolean;
  asCustomer: boolean;
  executorReviews: ReviewItem[];
  customerReviews: ReviewItem[];
}

/** Отзывы разложены по двум сторонам сделки.
 *
 *  Отзыв о качестве работы и отзыв о том, каким человек был заказчиком, —
 *  разные вещи, поэтому они не смешиваются в общую ленту. Вкладки
 *  показываются только тогда, когда у профиля включены оба режима. */
const ProfileReviews = ({
  asExecutor,
  asCustomer,
  executorReviews,
  customerReviews,
}: Props) => {
  const [tab, setTab] = useState<'executor' | 'customer'>(
    asExecutor ? 'executor' : 'customer',
  );
  const both = asExecutor && asCustomer;
  const active = tab === 'customer' ? customerReviews : executorReviews;

  return (
    <div className="border-t border-line pt-4">
      <h4 className="font-head text-lg font-medium">Отзывы</h4>

      {both && (
        <div className="mt-3 flex gap-1 rounded-full border border-line bg-surface p-1">
          <button
            onClick={() => setTab('executor')}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${
              tab === 'executor'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="Hammer" size={14} />
            За работу · {executorReviews.length}
          </button>
          <button
            onClick={() => setTab('customer')}
            className={`flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${
              tab === 'customer'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name="ClipboardList" size={14} />
            Как заказчику · {customerReviews.length}
          </button>
        </div>
      )}

      {active.length === 0 ? (
        <p className="mt-3 text-sm text-chip">
          {tab === 'customer'
            ? 'Исполнители пока не оставляли отзывов об этом заказчике.'
            : 'Отзывов о выполненных работах пока нет.'}
        </p>
      ) : (
        <div className="mt-3 space-y-3">
          {active.map((r, i) => (
            <ReviewCard key={i} r={r} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileReviews;
