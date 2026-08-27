import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import ProfileDialog from '@/components/ProfileDialog';
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

const PersonCard = ({ user, onOpen }: { user: User; onOpen: (id: number) => void }) => (
  <button
    onClick={() => onOpen(user.id)}
    className="flex w-full items-center gap-3 rounded-3xl border border-line bg-surface p-4 text-left transition-colors hover:border-primary/50"
  >
    <Avatar src={user.avatar} name={user.name} size={46} online={user.online} />
    <div className="min-w-0 flex-1">
      <p className="flex items-center gap-1.5 truncate font-medium">
        {user.name}
        {user.verified && <Icon name="BadgeCheck" size={15} className="shrink-0 text-primary" />}
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
);

const PeopleList = () => {
  const [tab, setTab] = useState<'executor' | 'customer'>('executor');
  const [executors, setExecutors] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [counts, setCounts] = useState({ executors: 0, customers: 0, online: 0 });
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await api.auth('people');
        setExecutors(r.executors || []);
        setCustomers(r.customers || []);
        if (r.counts) setCounts(r.counts);
      } catch {
        /* тихо */
      } finally {
        setLoading(false);
      }
    };
    load();
    const id = window.setInterval(load, 30000);
    return () => window.clearInterval(id);
  }, []);

  const list = tab === 'executor' ? executors : customers;

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
        <div className="flex gap-1 rounded-full border border-line bg-surface p-1">
          {(['executor', 'customer'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
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
        <div className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center">
          <p className="font-head text-lg">Пока никого нет</p>
          <p className="mt-2 text-sm text-chip">Участники появятся здесь после регистрации.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((u) => (
            <PersonCard key={`${u.role}-${u.id}`} user={u} onOpen={setProfileId} />
          ))}
        </div>
      )}

      <ProfileDialog userId={profileId} onOpenChange={() => setProfileId(null)} />
    </section>
  );
};

export default PeopleList;
