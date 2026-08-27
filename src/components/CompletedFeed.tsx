import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { money } from '@/data/mock';

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
          Обезличенная сводка закрытых задач: категория, город и сумма чека. Без имён и профилей.
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
          <div className="mt-12 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {completed.map((job, i) => (
              <article
                key={job.id}
                className="flex animate-fade-in items-center gap-3 rounded-3xl border border-line bg-tile px-6 py-5"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon name="CircleCheck" size={18} />
                </span>
                <p className="min-w-0 text-sm text-muted-foreground/85">
                  <span className="text-foreground">{job.category}</span> · {job.city} ·{' '}
                  <span className="font-head text-primary">{money(job.finalPrice || job.price)}</span>{' '}
                  · {dateRu(job.completedAt)}
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
