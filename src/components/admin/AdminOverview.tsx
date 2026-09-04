import Icon from '@/components/ui/icon';
import { money } from '@/data/mock';
import type { SectionId } from '@/components/admin/AdminNav';

export interface Stats {
  customers: number;
  executors: number;
  blocked: number;
  open_jobs: number;
  active_jobs: number;
  done_jobs: number;
  cancelled_jobs: number;
  turnover: number;
  reviews: number;
}

const groups: {
  title: string;
  tiles: { key: keyof Stats; label: string; icon: string; money?: boolean }[];
}[] = [
  {
    title: 'Люди',
    tiles: [
      { key: 'customers', label: 'заказчиков', icon: 'UserRound' },
      { key: 'executors', label: 'исполнителей', icon: 'Hammer' },
      { key: 'blocked', label: 'заблокировано', icon: 'Ban' },
    ],
  },
  {
    title: 'Заказы',
    tiles: [
      { key: 'open_jobs', label: 'открытых', icon: 'Radar' },
      { key: 'active_jobs', label: 'в работе', icon: 'Timer' },
      { key: 'done_jobs', label: 'завершено', icon: 'CircleCheck' },
      { key: 'cancelled_jobs', label: 'отменено', icon: 'CircleX' },
    ],
  },
  {
    title: 'Итоги',
    tiles: [
      { key: 'turnover', label: 'оборот', icon: 'Wallet', money: true },
      { key: 'reviews', label: 'отзывов', icon: 'Star' },
    ],
  },
];

const AdminOverview = ({
  stats,
  newTickets,
  pendingJobs,
  onGo,
}: {
  stats: Stats | null;
  newTickets: number;
  pendingJobs: number;
  onGo: (id: SectionId) => void;
}) => (
  <div className="flex flex-col gap-8">
    {(newTickets > 0 || pendingJobs > 0) && (
      <div className="rounded-3xl border border-primary/40 bg-primary/5 p-5">
        <p className="flex items-center gap-2 font-head text-lg font-medium">
          <Icon name="BellRing" size={18} className="text-primary" />
          Требует вашего внимания
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          {pendingJobs > 0 && (
            <button
              onClick={() => onGo('moderation')}
              className="flex min-h-[44px] flex-1 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-primary/60"
            >
              <span className="flex items-center gap-2.5">
                <Icon name="ShieldCheck" size={16} className="text-primary" />
                Заданий на проверке
              </span>
              <span className="font-head text-lg font-medium">{pendingJobs}</span>
            </button>
          )}
          {newTickets > 0 && (
            <button
              onClick={() => onGo('support')}
              className="flex min-h-[44px] flex-1 items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-primary/60"
            >
              <span className="flex items-center gap-2.5">
                <Icon name="LifeBuoy" size={16} className="text-primary" />
                Новых обращений
              </span>
              <span className="font-head text-lg font-medium">{newTickets}</span>
            </button>
          )}
        </div>
      </div>
    )}

    {groups.map((g) => (
      <div key={g.title}>
        <p className="text-[11px] uppercase tracking-[0.16em] text-chip">{g.title}</p>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {g.tiles.map((t) => (
            <div
              key={t.key}
              className="flex items-center gap-3 rounded-3xl border border-line bg-surface p-4 sm:p-5"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <Icon name={t.icon} size={20} />
              </span>
              <div className="min-w-0">
                <p className="break-words font-head text-xl font-medium sm:text-2xl">
                  {stats ? (t.money ? money(stats[t.key]) : stats[t.key]) : '—'}
                </p>
                <p className="truncate text-sm text-chip">{t.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

export default AdminOverview;
