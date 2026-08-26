import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { customers, executors, initials } from '@/data/mock';
import { useAppState } from '@/hooks/use-app-state';

const People = () => {
  const { jobs } = useAppState();
  const [tab, setTab] = useState<'executors' | 'customers'>('executors');

  return (
    <section id="people" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Люди сервиса</p>
            <h2 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
              Списки для контроля
            </h2>
            <p className="mt-3 max-w-[520px] text-base text-muted-foreground/85">
              Открытые списки исполнителей и заказчиков: видно, кто рядом, сколько работ за
              плечами и как давно человек в сервисе.
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

        {tab === 'executors' ? (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {executors.map((e, i) => (
              <article
                key={e.id}
                className="animate-fade-in rounded-3xl border border-line bg-surface p-6 transition-colors hover:border-primary/50"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className="flex items-center gap-4">
                  <span className="relative flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 font-head text-sm font-semibold text-primary">
                    {initials(e.name)}
                    {e.online && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface bg-primary" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <h3 className="truncate font-head text-lg font-medium">{e.name}</h3>
                    <p className="truncate text-sm text-chip">{e.skill}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2 border-t border-line pt-5 text-sm">
                  <div>
                    <p className="font-head text-lg text-primary">★ {e.rating}</p>
                    <p className="text-xs text-chip">рейтинг</p>
                  </div>
                  <div>
                    <p className="font-head text-lg">{e.done}</p>
                    <p className="text-xs text-chip">работ</p>
                  </div>
                  <div>
                    <p className="font-head text-lg">{e.city}</p>
                    <p className="text-xs text-chip">район</p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-chip">В сервисе с {e.since}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-12 overflow-hidden rounded-3xl border border-line bg-surface">
            {customers.map((c) => {
              const count = jobs.filter((j) => j.ownerId === c.id).length;
              return (
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
                      {c.verified && <Icon name="BadgeCheck" size={16} className="text-primary" />}
                    </p>
                    <p className="text-sm text-chip">
                      {c.city} · в сервисе с {c.since}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground/85">
                    {count || c.posted} объявлений
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default People;
