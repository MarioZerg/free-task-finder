import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { initials, money } from '@/data/mock';

const dateRu = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '';

const CompletedFeed = () => {
  const { completed } = useAppState();

  return (
    <section id="completed" className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-16">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">Итоги</p>
        <h2 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          Завершённые заказы
        </h2>
        <p className="mt-3 max-w-[560px] text-base text-muted-foreground/85">
          Реальные сделки Доделай.ру: кто заказал, кто сделал и на какую сумму договорились.
        </p>

        {completed.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-line bg-tile p-12 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Icon name="CircleCheck" size={26} />
            </span>
            <p className="mt-5 font-head text-xl font-medium">Первый завершённый заказ впереди</p>
            <p className="mt-2 text-sm text-chip">
              Как только заказчик закроет задачу, она появится здесь.
            </p>
          </div>
        ) : (
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((job, i) => (
              <article
                key={job.id}
                className="animate-fade-in rounded-3xl border border-line bg-tile p-6"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-head text-lg font-medium leading-snug">{job.title}</h3>
                  <span className="whitespace-nowrap font-head text-lg font-medium text-primary">
                    {money(job.finalPrice || job.price)}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground/80">
                  {job.description}
                </p>

                <div className="mt-5 space-y-2 border-t border-line pt-4 text-sm">
                  <p className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                      {initials(job.ownerName)}
                    </span>
                    <span className="text-muted-foreground/85">
                      Заказчик <span className="text-foreground">{job.ownerName}</span>
                    </span>
                  </p>
                  {job.executorName && (
                    <p className="flex items-center gap-2.5">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-semibold text-primary">
                        {initials(job.executorName)}
                      </span>
                      <span className="text-muted-foreground/85">
                        Исполнитель <span className="text-foreground">{job.executorName}</span>
                      </span>
                    </p>
                  )}
                </div>

                <p className="mt-4 flex items-center gap-1.5 text-xs text-chip">
                  <Icon name="CalendarCheck" size={14} />
                  {job.city} · {dateRu(job.completedAt)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CompletedFeed;
