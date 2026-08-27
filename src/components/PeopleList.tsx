import { memo, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import ProfileDialog from '@/components/ProfileDialog';
import InviteDialog from '@/components/InviteDialog';
import SubscriptionDialog from '@/components/SubscriptionDialog';
import { useAppState } from '@/hooks/use-app-state';
import { api, User } from '@/lib/api';

const lastSeenText = (u: User) => {
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

interface Counts {
  executors: number;
  customers: number;
  online: number;
}

const PersonCard = memo(
  ({
    user,
    onOpen,
    onInvite,
  }: {
    user: User;
    onOpen: (id: number) => void;
    onInvite?: (u: User) => void;
  }) => (
    <div className="rounded-3xl border border-line bg-surface p-4 transition-colors hover:border-primary/50">
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
      {onInvite && (
        <button
          onClick={() => onInvite(user)}
          className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-tile px-4 py-2.5 text-sm transition-colors hover:border-primary/60 hover:text-primary"
        >
          <Icon name="UserPlus" size={16} />
          Пригласить на заказ
        </button>
      )}
    </div>
  ),
);
PersonCard.displayName = 'PersonCard';

const PER_PAGE = 15;

let cache: { executors: User[]; customers: User[]; counts: Counts; at: number } | null = null;

const PeopleList = () => {
  const { user } = useAppState();
  const [tab, setTab] = useState<'executor' | 'customer'>('executor');
  const [invite, setInvite] = useState<User | null>(null);
  const [proOpen, setProOpen] = useState(false);
  const [executors, setExecutors] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [counts, setCounts] = useState<Counts>(
    cache?.counts || { executors: 0, customers: 0, online: 0 },
  );
  const [loading, setLoading] = useState(!cache);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await api.auth('people');
        if (!alive) return;
        const next = {
          executors: r.executors || [],
          customers: r.customers || [],
          counts: r.counts || { executors: 0, customers: 0, online: 0 },
          at: Date.now(),
        };
        cache = next;
        setExecutors(next.executors);
        setCustomers(next.customers);
        setCounts(next.counts);
      } catch {
        /* тихо */
      } finally {
        if (alive) setLoading(false);
      }
    };
    if (!cache || Date.now() - cache.at > 60000) load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 60000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => setPage(1), [tab]);

  const list = tab === 'executor' ? executors : customers;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const canInvite = user?.role === 'customer' && tab === 'executor';
  const handleInvite = (u: User) => {
    if (user?.isPro) setInvite(u);
    else setProOpen(true);
  };

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-head text-2xl font-normal tracking-tight md:text-3xl">
            Люди сервиса
          </h2>
          <p className="mt-2 text-sm text-chip">
            {counts.executors + counts.customers} участников · {counts.online} сейчас в сети
          </p>
        </div>
        <div className="scrollbar-none flex w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 sm:w-auto">
          {(['executor', 'customer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {t === 'executor'
                ? `Исполнители · ${counts.executors}`
                : `Заказчики · ${counts.customers}`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-chip">Загружаем…</p>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
          <p className="font-head text-lg">Пока никого нет</p>
          <p className="mt-2 text-sm text-chip">Участники появятся здесь после регистрации.</p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((u) => (
              <PersonCard
                key={`${u.role}-${u.id}`}
                user={u}
                onOpen={setProfileId}
                onInvite={canInvite ? handleInvite : undefined}
              />
            ))}
          </div>

          {pages > 1 && (
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={() => setPage(current - 1)}
                disabled={current === 1}
                aria-label="Назад"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:border-primary/50 disabled:opacity-40"
              >
                <Icon name="ChevronLeft" size={18} />
              </button>

              {Array.from({ length: pages }, (_, i) => i + 1)
                .filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1)
                .map((n, i, arr) => (
                  <span key={n} className="flex items-center gap-2">
                    {i > 0 && arr[i - 1] !== n - 1 && <span className="text-chip">…</span>}
                    <button
                      onClick={() => setPage(n)}
                      className={`h-11 min-w-11 rounded-full px-3 text-sm font-medium transition-colors ${
                        n === current
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-line bg-surface text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {n}
                    </button>
                  </span>
                ))}

              <button
                onClick={() => setPage(current + 1)}
                disabled={current === pages}
                aria-label="Вперёд"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:border-primary/50 disabled:opacity-40"
              >
                <Icon name="ChevronRight" size={18} />
              </button>
            </div>
          )}

          <p className="mt-3 text-center text-xs text-chip">
            Страница {current} из {pages} · показано {shown.length} из {list.length}
          </p>
        </>
      )}

      <ProfileDialog userId={profileId} onOpenChange={() => setProfileId(null)} />
      <InviteDialog executor={invite} onOpenChange={() => setInvite(null)} />
      <SubscriptionDialog
        open={proOpen}
        onOpenChange={setProOpen}
        hint="Приглашение исполнителей доступно по подписке PRO"
      />
    </section>
  );
};

export default PeopleList;