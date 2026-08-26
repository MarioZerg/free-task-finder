import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { CATEGORIES, money } from '@/data/mock';
import CreateJobDialog from '@/components/CreateJobDialog';

const Feed = () => {
  const { feed, stats, user, openLogin } = useAppState();
  const navigate = useNavigate();
  const [category, setCategory] = useState('Все');
  const [query, setQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  const filtered = useMemo(
    () =>
      feed.filter(
        (j) =>
          (category === 'Все' || j.category === category) &&
          (query.trim() === '' ||
            `${j.title} ${j.description} ${j.city}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [feed, category, query],
  );

  const onCreate = () => {
    if (!user) {
      openLogin('customer');
      return;
    }
    if (user.role === 'executor') {
      navigate('/dashboard');
      return;
    }
    setCreateOpen(true);
  };

  const onCard = () => {
    if (!user) {
      openLogin('executor');
      return;
    }
    navigate('/dashboard');
  };

  return (
    <section id="feed" className="bg-background py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Радар</p>
            <h2 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
              Радар Доделай
            </h2>
            <p className="mt-3 max-w-[520px] text-base text-muted-foreground/85">
              Живая лента открытых заказов Ярославской области — обновляется в реальном времени, без
              перезагрузки страницы. Оплата от 500 до 1500 ₽.
            </p>
          </div>
          <button
            onClick={onCreate}
            className="flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Icon name="Plus" size={18} />
            Выставить задачу
          </button>
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'открытых заказов', value: stats.openJobs, icon: 'Radar' },
            { label: 'исполнителей в области', value: stats.executors, icon: 'Users' },
            {
              label: 'средний чек',
              value: stats.avgCheck ? money(stats.avgCheck) : '—',
              icon: 'Wallet',
            },
          ].map((s) => (
            <div
              key={s.label}
              className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Icon name={s.icon} size={20} />
              </span>
              <div>
                <p className="font-head text-2xl font-medium">{s.value}</p>
                <p className="text-sm text-chip">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-3 rounded-full border border-foreground/25 bg-surface/40 px-5 py-3.5 md:w-[320px]">
            <Icon name="Search" size={18} className="text-foreground/60" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск по заказам"
              className="w-full bg-transparent text-base outline-none placeholder:text-foreground/50"
            />
          </div>
          <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:px-0">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm transition-colors ${
                  category === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-foreground/25 text-foreground/85 hover:border-primary/60'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-line bg-surface p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon name="Radar" size={26} />
            </span>
            <p className="mt-5 font-head text-xl font-medium">
              {feed.length === 0
                ? 'Пока заказов нет — станьте первым заказчиком'
                : 'Ничего не нашлось'}
            </p>
            <p className="mt-2 text-sm text-chip">
              {feed.length === 0
                ? 'Выставите задачу — исполнители области увидят её в радаре сразу.'
                : 'Попробуйте другую категорию или запрос.'}
            </p>
            {feed.length === 0 && (
              <button
                onClick={onCreate}
                className="mt-6 rounded-full bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
              >
                Выставить задачу
              </button>
            )}
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((job) => (
              <button
                key={job.id}
                onClick={onCard}
                className="group flex animate-fade-in flex-col overflow-hidden rounded-3xl border border-line bg-surface text-left transition-all hover:-translate-y-1 hover:border-primary/50"
              >
                {job.photo ? (
                  <img
                    src={job.photo}
                    alt={job.title}
                    className="h-40 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="photo-stub h-40 w-full" />
                )}

                <div className="flex flex-1 flex-col p-6">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="font-head text-lg font-medium leading-snug">{job.title}</h3>
                    <span className="whitespace-nowrap font-head text-lg font-medium text-primary">
                      {money(job.price)}
                    </span>
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground/80">
                    {job.description}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-chip">
                    <span className="flex items-center gap-1.5">
                      <Icon name="MapPin" size={14} />
                      {job.city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Icon name="Clock" size={14} />
                      {job.when}
                    </span>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-sm">
                    <span className="text-muted-foreground/80">
                      {(job.responses || []).length} откликов
                    </span>
                    <span className="text-chip">{job.ownerName}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} />
    </section>
  );
};

export default Feed;
