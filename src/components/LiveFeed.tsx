import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import JobFeedCard from '@/components/JobFeedCard';
import { useAppState } from '@/hooks/use-app-state';
import { CITY_LIST } from '@/data/mock';

const CITY_KEY = 'dodelay_feed_city';

const cityOf = (raw: string) => {
  const found = CITY_LIST.find((c) => raw.startsWith(c));
  return found || raw.split(',')[0].trim();
};

const LiveFeed = ({ readOnly }: { readOnly?: boolean }) => {
  const { feed, user, limits } = useAppState();
  const canRespond = user?.role === 'executor' && !limits.busy;

  const [city, setCity] = useState(
    () => localStorage.getItem(CITY_KEY) || (user ? cityOf(user.city) : '') || '',
  );

  const cities = useMemo(() => {
    const map = new Map<string, number>();
    feed.forEach((j) => {
      const c = cityOf(j.city);
      map.set(c, (map.get(c) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [feed]);

  const visible = useMemo(
    () => (city ? feed.filter((j) => cityOf(j.city) === city) : feed),
    [feed, city],
  );

  const knownIds = useRef<Set<number> | null>(null);
  const [freshIds, setFreshIds] = useState<number[]>([]);
  const [banner, setBanner] = useState(0);

  useEffect(() => {
    if (!feed.length && knownIds.current === null) return;
    if (knownIds.current === null) {
      knownIds.current = new Set(feed.map((j) => j.id));
      return;
    }
    const known = knownIds.current;
    const added = feed.filter((j) => !known.has(j.id)).map((j) => j.id);
    feed.forEach((j) => known.add(j.id));
    if (!added.length) return;
    setFreshIds((prev) => [...prev, ...added]);
    setBanner(added.length);
    const t1 = window.setTimeout(
      () => setFreshIds((prev) => prev.filter((id) => !added.includes(id))),
      2500,
    );
    const t2 = window.setTimeout(() => setBanner(0), 4000);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [feed]);

  const plural = (n: number) => {
    const d = n % 10;
    const h = n % 100;
    if (d === 1 && h !== 11) return 'новый заказ';
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'новых заказа';
    return 'новых заказов';
  };

  const pick = (value: string) => {
    setCity(value);
    if (value) localStorage.setItem(CITY_KEY, value);
    else localStorage.removeItem(CITY_KEY);
  };

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-head text-2xl font-normal tracking-tight md:text-3xl">
            Лента заказов
          </h2>
          <p className="mt-2 flex items-center gap-2 text-sm text-chip">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Живая лента — новые заказы появляются сами
          </p>
        </div>
        <span className="rounded-full border border-line bg-tile px-4 py-2 text-sm text-chip">
          {visible.length} в ленте
        </span>
      </div>

      {cities.length > 0 && (
        <div className="scrollbar-none -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:px-0">
          <button
            onClick={() => pick('')}
            className={`flex min-h-[44px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition-colors ${
              city === ''
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-line bg-surface text-muted-foreground hover:border-primary/50'
            }`}
          >
            <Icon name="Globe" size={15} />
            Вся область · {feed.length}
          </button>
          {cities.map(([name, count]) => (
            <button
              key={name}
              onClick={() => pick(name)}
              className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm transition-colors ${
                city === name
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-line bg-surface text-muted-foreground hover:border-primary/50'
              }`}
            >
              {name} · {count}
            </button>
          ))}
        </div>
      )}

      {limits.busy && user?.role === 'executor' && (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-5 py-4 text-sm text-muted-foreground">
          <Icon name="Info" size={18} className="mt-0.5 shrink-0 text-primary" />
          Вы уже назначены на заказ. Пока он не завершён, взяться за новый нельзя.
        </p>
      )}

      {banner > 0 && (
        <p className="mt-5 flex animate-bubble-in items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-medium text-primary">
          <Icon name="Sparkles" size={16} />+{banner} {plural(banner)}
        </p>
      )}

      {visible.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="Radio" size={22} />
          </span>
          <p className="mt-4 font-head text-lg">
            {city ? `В городе ${city} заказов нет` : 'В ленте пока пусто'}
          </p>
          <p className="mt-2 text-sm text-chip">
            {city
              ? 'Посмотрите заказы по всей области — переключите фильтр выше.'
              : 'Новые заказы появятся здесь сами — страницу обновлять не нужно.'}
          </p>
          {city && (
            <button
              onClick={() => pick('')}
              className="mt-4 min-h-[44px] w-full rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground sm:w-auto"
            >
              Показать всю область
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visible.map((j) => (
            <div
              key={j.id}
              className={
                freshIds.includes(j.id)
                  ? 'animate-slide-up-in rounded-3xl ring-2 ring-primary/40 transition-shadow'
                  : ''
              }
            >
              <JobFeedCard
                job={j}
                readOnly={readOnly}
                responded={(j.responses || []).some((r) => r.executorId === user?.id)}
                canRespond={canRespond}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default LiveFeed;