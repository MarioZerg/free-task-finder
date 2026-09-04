import { memo } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import type { User } from '@/lib/api';

export const lastSeenText = (u: User) => {
  if (u.online) return 'в сети';
  if (!u.lastSeen) return 'давно не заходил';
  const min = Math.floor((Date.now() - new Date(u.lastSeen).getTime()) / 60000);
  if (min < 60) return `был ${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `был ${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `был ${d} дн назад`;
  return 'давно не заходил';
};

const PersonCard = memo(
  ({
    user,
    onOpen,
    onInvite,
    onMessage,
    unread = 0,
  }: {
    user: User;
    onOpen: (id: number) => void;
    onInvite?: (u: User) => void;
    onMessage?: (u: User) => void;
    unread?: number;
  }) => {
    const list = user.professions || [];
    const shown = list.slice(0, 3);
    const rest = list.length - shown.length;
    return (
      <div
        className={`rounded-3xl border bg-surface p-4 transition-colors hover:border-primary/50 ${
          unread > 0 ? 'border-primary/50' : 'border-line'
        }`}
      >
        <button
          onClick={() => onOpen(user.id)}
          className="flex min-h-[44px] w-full items-center gap-3 text-left"
        >
          <Avatar src={user.avatar} name={user.name} size={46} online={user.online} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 truncate font-medium">
              {user.name}
              {user.verified && (
                <Icon name="BadgeCheck" size={15} className="shrink-0 text-primary" />
              )}
              {unread > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </p>
            <p className={`mt-0.5 text-xs ${user.online ? 'text-emerald-600' : 'text-chip'}`}>
              {lastSeenText(user)}
            </p>
            <p className="mt-1 text-xs text-chip">
              ★ {user.rating.toFixed(1)} · {user.reviewsCount} отзывов
              {user.role === 'executor' ? ` · ${user.doneCount} работ` : ''}
            </p>
          </div>
          <Icon name="ChevronRight" size={18} className="shrink-0 text-chip" />
        </button>

        {shown.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shown.map((p) => (
              <span
                key={p.id}
                className="flex items-center gap-1 rounded-full border border-line bg-tile px-2.5 py-1 text-xs text-muted-foreground"
              >
                <Icon name={p.icon} size={12} fallback="Wrench" />
                {p.label}
              </span>
            ))}
            {rest > 0 && (
              <span className="rounded-full border border-line bg-tile px-2.5 py-1 text-xs text-chip">
                +{rest}
              </span>
            )}
          </div>
        )}

        {onInvite && (
          <button
            onClick={() => onInvite(user)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-tile px-4 py-2.5 text-sm transition-colors hover:border-primary/60 hover:text-primary"
          >
            <Icon name="UserPlus" size={16} />
            Пригласить на заказ
          </button>
        )}

        {onMessage && (
          <button
            onClick={() => onMessage(user)}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-tile px-4 py-2.5 text-sm transition-colors hover:border-primary/60 hover:text-primary"
          >
            <Icon name="MessageCircle" size={16} />
            Написать
          </button>
        )}
      </div>
    );
  },
);
PersonCard.displayName = 'PersonCard';

export default PersonCard;
