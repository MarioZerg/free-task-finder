import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { CITY_PAGES, countOpenJobsInCity, pluralJobs } from '@/data/cityPages';
import { useAppState } from '@/hooks/use-app-state';

const CityLinks = () => {
  const { feed } = useAppState();

  return (
    <section id="cities" className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">География</p>
        <h2 className="mt-4 max-w-[720px] font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          Работаем в этих городах
        </h2>
        <p className="mt-4 max-w-[620px] text-base text-muted-foreground">
          В каждом городе — своя лента заказов. Выберите свой, чтобы посмотреть районы, типовые
          задачи и ориентировочные цены.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CITY_PAGES.map((c) => {
            const openCount = countOpenJobsInCity(feed, c.nameNominative);
            return (
              <Link
                key={c.slug}
                to={`/podrabotka/${c.slug}`}
                className="group overflow-hidden rounded-3xl border border-line bg-tile transition-colors hover:border-primary/45"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-chip/10">
                  <img
                    src={c.image}
                    alt={`Подработка и разовые заказы в ${c.nameNominative}`}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-black/0" />
                  {openCount > 0 && (
                    <span className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                      </span>
                      {openCount} {pluralJobs(openCount)} сейчас
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between p-6">
                  <div>
                    <h3 className="font-head text-lg font-medium">{c.nameNominative}</h3>
                    <p className="mt-1 text-sm text-chip">
                      {c.districts.length > 0
                        ? `${c.districts.length} районов`
                        : 'Подработка и разовые заказы'}
                    </p>
                  </div>
                  <Icon
                    name="ArrowRight"
                    size={18}
                    className="shrink-0 text-primary transition-transform group-hover:translate-x-1"
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CityLinks;
