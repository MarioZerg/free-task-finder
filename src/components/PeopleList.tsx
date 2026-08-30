import { memo, useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import ProfileDialog from '@/components/ProfileDialog';
import InviteDialog from '@/components/InviteDialog';
import DirectMessageDialog from '@/components/DirectMessageDialog';
import SubscriptionDialog from '@/components/SubscriptionDialog';
import { useAppState } from '@/hooks/use-app-state';
import {
  dmList,
  DirectThread,
  listProfessions,
  people,
  PeopleCounts,
  Profession,
  User,
} from '@/lib/api';

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

const PER_PAGE = 15;

const PeopleList = () => {
  const { user, unread, refresh } = useAppState();
  const [tab, setTab] = useState<'executor' | 'customer'>('executor');
  const [invite, setInvite] = useState<User | null>(null);
  const [message, setMessage] = useState<User | null>(null);
  const [proOpen, setProOpen] = useState(false);
  const [executors, setExecutors] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [counts, setCounts] = useState<PeopleCounts>({ executors: 0, customers: 0, online: 0 });
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [threads, setThreads] = useState<DirectThread[]>([]);

  useEffect(() => {
    let alive = true;
    listProfessions()
      .then((r) => alive && setProfessions(r.professions || []))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const key = picked.join(',');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await people({ professions: key ? key.split(',') : [] });
        if (!alive) return;
        setExecutors(r.executors || []);
        setCustomers(r.customers || []);
        setCounts(r.counts || { executors: 0, customers: 0, online: 0 });
      } catch {
        /* тихо */
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 60000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [key]);

  useEffect(() => setPage(1), [tab, key]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      dmList()
        .then((r) => alive && setThreads(r.threads || []))
        .catch(() => undefined);
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 30000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [message, unread.total]);

  const toggle = useCallback((slug: string) => {
    setPicked((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  const list = tab === 'executor' ? executors : customers;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const isPro = !!user?.isPro;
  const canInvite = user?.role === 'customer' && tab === 'executor' && isPro;
  const canMessage = user?.role === 'executor' && tab === 'customer' && isPro;
  const unreadOf = (id: number) => unread.byUser[String(id)] || 0;
  const handleInvite = (u: User) => setInvite(u);
  const handleMessage = (u: User) => setMessage(u);
  const messageFor = (u: User) => {
    if (canMessage) return handleMessage;
    return unreadOf(u.id) > 0 ? handleMessage : undefined;
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

      {professions.length > 0 && (
        <div className="scrollbar-none -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <button
            onClick={() => setPicked([])}
            className={`flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition-colors ${
              picked.length === 0
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-line bg-surface text-muted-foreground hover:border-primary/50'
            }`}
          >
            <Icon name="Users" size={15} />
            Все
          </button>
          {professions.map((p) => (
            <button
              key={p.id}
              onClick={() => toggle(p.slug)}
              className={`flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition-colors ${
                picked.includes(p.slug)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-line bg-surface text-muted-foreground hover:border-primary/50'
              }`}
            >
              <Icon name={p.icon} size={15} fallback="Wrench" />
              {p.label}
            </button>
          ))}
        </div>
      )}

      {!isPro && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-tile px-4 py-3">
          <p className="flex min-w-0 items-start gap-2.5 text-sm text-muted-foreground">
            <Icon name="Crown" size={16} className="mt-0.5 shrink-0 text-amber-600" />
            {user?.role === 'executor'
              ? 'С подпиской PRO можно писать заказчикам напрямую, минуя отклик'
              : 'С подпиской PRO можно пригласить нужного исполнителя прямо на свой заказ'}
          </p>
          <button
            onClick={() => setProOpen(true)}
            className="min-h-[44px] shrink-0 rounded-full border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20"
          >
            Подключить PRO
          </button>
        </div>
      )}

      {threads.length > 0 && (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-chip">
            <Icon name="MessagesSquare" size={15} />
            Диалоги
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {threads.map((t) => (
              <button
                key={t.userId}
                onClick={() =>
                  setMessage({ id: t.userId, name: t.name, avatar: t.avatar } as User)
                }
                className={`flex min-h-[44px] items-center gap-3 rounded-2xl border bg-surface p-3 text-left transition-colors hover:border-primary/50 ${
                  t.unread > 0 ? 'border-primary/50' : 'border-line'
                }`}
              >
                <Avatar src={t.avatar} name={t.name} size={38} online={t.online} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{t.name}</span>
                    {t.unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground">
                        {t.unread > 99 ? '99+' : t.unread}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-chip">{t.lastText}</span>
                </span>
                <Icon name="ChevronRight" size={16} className="shrink-0 text-chip" />
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-sm text-chip">Загружаем…</p>
      ) : list.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
          <p className="font-head text-lg">
            {picked.length > 0 ? 'Никто не подходит под фильтр' : 'Пока никого нет'}
          </p>
          <p className="mt-2 text-sm text-chip">
            {picked.length > 0
              ? 'Попробуйте выбрать другие специальности.'
              : 'Участники появятся здесь после регистрации.'}
          </p>
          {picked.length > 0 && (
            <button
              onClick={() => setPicked([])}
              className="mt-4 min-h-[44px] rounded-full border border-line bg-tile px-5 py-2.5 text-sm transition-colors hover:border-primary/60 hover:text-primary"
            >
              Сбросить фильтры
            </button>
          )}
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
                onMessage={messageFor(u)}
                unread={unreadOf(u.id)}
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
      <DirectMessageDialog
        peer={message}
        onOpenChange={() => {
          setMessage(null);
          refresh();
        }}
      />
      <SubscriptionDialog
        open={proOpen}
        onOpenChange={setProOpen}
        hint={
          user?.role === 'executor'
            ? 'Личные сообщения заказчикам доступны по подписке PRO'
            : 'Приглашение исполнителей доступно по подписке PRO'
        }
      />
    </section>
  );
};

export default PeopleList;