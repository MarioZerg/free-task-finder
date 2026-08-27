import Icon from '@/components/ui/icon';
import JobFeedCard from '@/components/JobFeedCard';
import { useAppState } from '@/hooks/use-app-state';

const LiveFeed = ({ readOnly }: { readOnly?: boolean }) => {
  const { feed, user, limits } = useAppState();
  const canRespond = user?.role === 'executor' && !limits.busy;

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
          {feed.length} в ленте
        </span>
      </div>

      {limits.busy && user?.role === 'executor' && (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-5 py-4 text-sm text-muted-foreground">
          <Icon name="Info" size={18} className="mt-0.5 shrink-0 text-primary" />
          Вы уже назначены на заказ. Пока он не завершён, взяться за новый нельзя.
        </p>
      )}

      {feed.length === 0 ? (
        <div className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon name="Radio" size={22} />
          </span>
          <p className="mt-4 font-head text-lg">В ленте пока пусто</p>
          <p className="mt-2 text-sm text-chip">
            Новые заказы появятся здесь сами — страницу обновлять не нужно.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {feed.map((j) => (
            <JobFeedCard
              key={j.id}
              job={j}
              readOnly={readOnly}
              responded={(j.responses || []).some((r) => r.executorId === user?.id)}
              canRespond={canRespond}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default LiveFeed;
