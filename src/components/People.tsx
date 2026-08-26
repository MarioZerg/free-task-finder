import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { initials } from '@/data/mock';
import { api, User } from '@/lib/api';
import ProfileDialog from '@/components/ProfileDialog';

const dateRu = (v: string) =>
  new Date(v).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });

const People = () => {
  const [tab, setTab] = useState<'executors' | 'customers'>('executors');
  const [executors, setExecutors] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [profileId, setProfileId] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    api
      .auth('people')
      .then((r) => {
        if (!alive) return;
        setExecutors(r.executors || []);
        setCustomers(r.customers || []);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const empty = tab === 'executors' ? executors.length === 0 : customers.length === 0;

  return (
    <section id="people" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Люди сервиса</p>
            <h2 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
              Кто уже в Доделай.ру
            </h2>
            <p className="mt-3 max-w-[520px] text-base text-muted-foreground/85">
              Настоящие исполнители и заказчики Ярославской области: видно город, рейтинг, число
              работ и отзывы.
            </p>
          </div>

          <div className="flex gap-1 rounded-full border border-foreground/25 p-1">
            <button
              onClick={() => setTab('executors')}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                tab === 'executors' ? 'bg-primary text-primary-foreground' : 'text-foreground/85'
              }`}
            >
              Исполнители
            </button>
            <button
              onClick={() => setTab('customers')}
              className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                tab === 'customers' ? 'bg-primary text-primary-foreground' : 'text-foreground/85'
              }`}
            >
              Заказчики
            </button>
          </div>
        </div>

        {empty ? (
          <div className="mt-12 rounded-3xl border border-line bg-surface p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon name="Users" size={26} />
            </span>
            <p className="mt-5 font-head text-xl font-medium">
              {tab === 'executors' ? 'Исполнителей пока нет' : 'Заказчиков пока нет'}
            </p>
            <p className="mt-2 text-sm text-chip">
              Войдите через MAX — и попадёте в этот список первым.
            </p>
          </div>
        ) : tab === 'executors' ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {executors.map((e, i) => (
              <button
                key={e.id}
                onClick={() => setProfileId(e.id)}
                className="animate-fade-in rounded-3xl border border-line bg-surface p-6 text-left transition-colors hover:border-primary/50"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 font-head text-sm font-semibold text-primary">
                    {initials(e.name)}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-head text-lg font-medium">{e.name}</h3>
                    <p className="truncate text-sm text-chip">{e.skill || 'Разнорабочий'}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 text-sm">
                  <div>
                    <p className="font-head text-lg text-primary">★ {e.rating.toFixed(1)}</p>
                    <p className="text-xs text-chip">рейтинг</p>
                  </div>
                  <div>
                    <p className="font-head text-lg">{e.doneCount}</p>
                    <p className="text-xs text-chip">работ</p>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-head text-base" title={e.city}>
                      {e.city.replace('Ярославль, ', '').replace(' район', '')}
                    </p>
                    <p className="text-xs text-chip">город</p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-chip">В сервисе с {dateRu(e.createdAt)}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-surface">
            {customers.map((c) => (
              <div
                key={c.id}
                className="flex flex-wrap items-center gap-4 border-b border-line px-6 py-5 last:border-b-0"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                  {initials(c.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 font-medium">
                    {c.name}
                    <Icon name="BadgeCheck" size={16} className="text-primary" />
                  </p>
                  <p className="text-sm text-chip">
                    {c.city} · в сервисе с {dateRu(c.createdAt)}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground/85">★ {c.rating.toFixed(1)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <ProfileDialog userId={profileId} onOpenChange={() => setProfileId(null)} />
    </section>
  );
};

export default People;
