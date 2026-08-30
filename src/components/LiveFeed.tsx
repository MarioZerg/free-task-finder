import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import JobFeedCard from '@/components/JobFeedCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
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
  const [cityOpen, setCityOpen] = useState(false);

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
      </div>

      {cities.length > 0 && (
        <div className="mt-5">
          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <PopoverTrigger asChild>
              <button className="flex min-h-[44px] w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 sm:w-auto sm:min-w-[260px]">
                <Icon name="MapPin" size={15} className="shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate text-left">
                  {city || 'Вся область'} ·{' '}
                  {city ? cities.find(([n]) => n === city)?.[1] || 0 : feed.length}
                </span>
                <Icon name="ChevronDown" size={16} className="shrink-0" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="start"
              className="max-h-[320px] w-[min(320px,calc(100vw-2.5rem))] overflow-y-auto border-line bg-surface p-2"
            >
              <button
                onClick={() => {
                  pick('');
                  setCityOpen(false);
                }}
                className={`flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-colors ${
                  city === ''
                    ? 'bg-primary/10 font-medium text-primary'
                    : 'text-muted-foreground hover:bg-tile'
                }`}
              >
                <Icon name="Globe" size={15} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">Вся область</span>
                <span className="shrink-0 text-xs text-chip">{feed.length}</span>
              </button>
              <div className="my-1 h-px bg-line" />
              {cities.map(([name, count]) => (
                <button
                  key={name}
                  onClick={() => {
                    pick(name);
                    setCityOpen(false);
                  }}
                  className={`flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-colors ${
                    city === name
                      ? 'bg-primary/10 font-medium text-primary'
                      : 'text-muted-foreground hover:bg-tile'
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{name}</span>
                  <span className="shrink-0 text-xs text-chip">{count}</span>
                  {city === name && <Icon name="Check" size={15} className="shrink-0" />}
                </button>
              ))}
            </PopoverContent>
          </Popover>
        </div>
      )}

      {limits.busy && user?.role === 'executor' && (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-5 py-4 text-sm text-muted-foreground">
          <Icon name="Info" size={18} className="mt-0.5 shrink-0 text-primary" />
          {limits.pro
            ? `Вы уже ведёте ${limits.activeLimit ?? 3} заказа одновременно — лимит PRO. Завершите один, чтобы взять новый.`
            : 'Вы уже назначены на заказ. Пока он не завершён, взяться за новый нельзя.'}
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
        <div className="mt-6 grid grid-cols-[minmax(0,1fr)] gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visible.map((j) => (
            <div
              key={j.id}
              className={`min-w-0 ${
                freshIds.includes(j.id)
                  ? 'animate-slide-up-in rounded-3xl ring-2 ring-primary/40 transition-shadow'
                  : ''
              }`}
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