import Icon from '@/components/ui/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { PeopleCounts, Profession, User } from '@/lib/api';

const PeopleFilters = ({
  counts,
  tab,
  onTab,
  professions,
  picked,
  onPicked,
  onToggle,
  isPro,
  user,
  onPro,
}: {
  counts: PeopleCounts;
  tab: 'executor' | 'customer';
  onTab: (t: 'executor' | 'customer') => void;
  professions: Profession[];
  picked: string[];
  onPicked: (v: string[]) => void;
  onToggle: (slug: string) => void;
  isPro: boolean;
  user: User | null;
  onPro: () => void;
}) => (
  <>
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-head text-2xl font-normal tracking-tight md:text-3xl">
          Люди сервиса
        </h2>
        <p className="mt-2 text-sm text-chip">
          {counts.executors + counts.customers} участников · {counts.online} сейчас в сети
        </p>
      </div>
      <div className="scrollbar-none flex w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 sm:w-auto">
        {(['executor', 'customer'] as const).map((t) => (
          <button
            key={t}
            onClick={() => onTab(t)}
            className={`min-h-[44px] shrink-0 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {t === 'executor'
              ? `Исполнители · ${counts.executors}`
              : `Заказчики · ${counts.customers}`}
          </button>
        ))}
      </div>
    </div>

    {professions.length > 0 && (
      <div className="mt-5">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex min-h-[44px] w-full items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 sm:w-auto sm:min-w-[280px]">
              <Icon name="SlidersHorizontal" size={15} className="shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-left">
                {picked.length === 0
                  ? 'Все профессии'
                  : professions
                      .filter((p) => picked.includes(p.slug))
                      .map((p) => p.label)
                      .join(', ')}
              </span>
              {picked.length > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-none text-primary-foreground">
                  {picked.length}
                </span>
              )}
              <Icon name="ChevronDown" size={16} className="shrink-0" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="max-h-[320px] w-[min(320px,calc(100vw-2.5rem))] overflow-y-auto border-line bg-surface p-2"
          >
            <button
              onClick={() => onPicked([])}
              className={`flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-colors ${
                picked.length === 0
                  ? 'bg-primary/10 font-medium text-primary'
                  : 'text-muted-foreground hover:bg-tile'
              }`}
            >
              <Icon name="Users" size={15} className="shrink-0" />
              Все профессии
            </button>
            <div className="my-1 h-px bg-line" />
            {professions.map((p) => {
              const on = picked.includes(p.slug);
              return (
                <button
                  key={p.id}
                  onClick={() => onToggle(p.slug)}
                  className={`flex min-h-[42px] w-full items-center gap-2.5 rounded-xl px-3 text-left text-sm transition-colors ${
                    on ? 'bg-primary/10 font-medium text-primary' : 'text-muted-foreground hover:bg-tile'
                  }`}
                >
                  <Icon name={p.icon} size={15} fallback="Wrench" className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{p.label}</span>
                  {on && <Icon name="Check" size={15} className="shrink-0" />}
                </button>
              );
            })}
          </PopoverContent>
        </Popover>
      </div>
    )}

    {!isPro && (
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-tile px-4 py-3">
        <p className="flex min-w-0 items-start gap-2.5 text-sm text-muted-foreground">
          <Icon name="Crown" size={16} className="mt-0.5 shrink-0 text-amber-600" />
          {user?.role === 'executor'
            ? 'С подпиской PRO можно писать заказчикам напрямую, минуя отклик'
            : 'С подпиской PRO можно пригласить нужного исполнителя прямо на свой заказ'}
        </p>
        <button
          onClick={onPro}
          className="min-h-[44px] shrink-0 rounded-full border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20"
        >
          Подключить PRO
        </button>
      </div>
    )}
  </>
);

export default PeopleFilters;
