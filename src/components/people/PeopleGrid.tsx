import Icon from '@/components/ui/icon';
import PersonCard from '@/components/people/PersonCard';
import type { User } from '@/lib/api';

const PeopleGrid = ({
  loading,
  list,
  shown,
  picked,
  onResetPicked,
  onOpenProfile,
  onInvite,
  messageFor,
  unreadOf,
  pages,
  current,
  onPage,
}: {
  loading: boolean;
  list: User[];
  shown: User[];
  picked: string[];
  onResetPicked: () => void;
  onOpenProfile: (id: number) => void;
  onInvite?: (u: User) => void;
  messageFor: (u: User) => ((u: User) => void) | undefined;
  unreadOf: (id: number) => number;
  pages: number;
  current: number;
  onPage: (n: number) => void;
}) => {
  if (loading) return <p className="mt-6 text-sm text-chip">Загружаем…</p>;

  if (list.length === 0) {
    return (
      <div className="mt-6 rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
        <p className="font-head text-lg">
          {picked.length > 0 ? 'Никто не подходит под фильтр' : 'Пока никого нет'}
        </p>
        <p className="mt-2 text-sm text-chip">
          {picked.length > 0
            ? 'Попробуйте выбрать другие специальности.'
            : 'Участники появятся здесь после регистрации.'}
        </p>
        {picked.length > 0 && (
          <button
            onClick={onResetPicked}
            className="mt-4 min-h-[44px] rounded-full border border-line bg-tile px-5 py-2.5 text-sm transition-colors hover:border-primary/60 hover:text-primary"
          >
            Сбросить фильтры
          </button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((u) => (
          <PersonCard
            key={`${u.role}-${u.id}`}
            user={u}
            onOpen={onOpenProfile}
            onInvite={onInvite}
            onMessage={messageFor(u)}
            unread={unreadOf(u.id)}
          />
        ))}
      </div>

      {pages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => onPage(current - 1)}
            disabled={current === 1}
            aria-label="Назад"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:border-primary/50 disabled:opacity-40"
          >
            <Icon name="ChevronLeft" size={18} />
          </button>

          {Array.from({ length: pages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === pages || Math.abs(n - current) <= 1)
            .map((n, i, arr) => (
              <span key={n} className="flex items-center gap-2">
                {i > 0 && arr[i - 1] !== n - 1 && <span className="text-chip">…</span>}
                <button
                  onClick={() => onPage(n)}
                  className={`h-11 min-w-11 rounded-full px-3 text-sm font-medium transition-colors ${
                    n === current
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-line bg-surface text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {n}
                </button>
              </span>
            ))}

          <button
            onClick={() => onPage(current + 1)}
            disabled={current === pages}
            aria-label="Вперёд"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface transition-colors hover:border-primary/50 disabled:opacity-40"
          >
            <Icon name="ChevronRight" size={18} />
          </button>
        </div>
      )}

      <p className="mt-3 text-center text-xs text-chip">
        Страница {current} из {pages} · показано {shown.length} из {list.length}
      </p>
    </>
  );
};

export default PeopleGrid;
