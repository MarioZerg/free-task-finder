import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import ActiveJobCard from '@/components/ActiveJobCard';
import LiveFeed from '@/components/LiveFeed';
import PeopleList from '@/components/PeopleList';
import InviteCard from '@/components/InviteCard';
import DashTabs from '@/components/dashboard/DashTabs';

const ExecutorDashboard = () => {
  const { myJobs, feed, limits, invites } = useAppState();
  const [tab, setTab] = useState('feed');

  const working = myJobs.filter(
    (j) => ['assigned', 'expiring', 'done'].includes(j.status) && j.isAssignedExecutor,
  );
  const waiting = myJobs.filter((j) => j.status === 'open');

  const feedWord = (n: number) => {
    const d = n % 10;
    const h = n % 100;
    if (d === 1 && h !== 11) return 'заказ';
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'заказа';
    return 'заказов';
  };

  return (
    <div className="role-executor safe-x safe-bottom mx-auto w-full max-w-[1400px] px-5 py-8 md:px-10 md:py-12 lg:px-16">
      <span className="role-accent-bar mb-5 block h-1 w-24 rounded-full" />
      <p className="role-accent-text text-xs uppercase tracking-[0.2em]">Кабинет исполнителя</p>
      <h1 className="mt-2 font-head text-2xl font-normal tracking-tight md:text-4xl">
        Заказы рядом
      </h1>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="role-accent-soft flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium">
          <Icon name="Radio" size={16} className="role-accent-text" />
          {feed.length} {feedWord(feed.length)} в ленте
        </span>
        {limits.pro && (
          <span className="flex min-h-[40px] items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600">
            <Icon name="Crown" size={16} />
            PRO: до {limits.activeLimit ?? 3} заказов одновременно
          </span>
        )}
        {typeof limits.activeCount === 'number' && (
          <span className="flex min-h-[40px] items-center gap-2 rounded-full border border-line bg-tile px-4 py-2 text-sm text-muted-foreground">
            <Icon name={limits.busy ? 'Lock' : 'ClipboardCheck'} size={16} />
            {limits.busy ? 'Лимит заказов исчерпан' : `В работе: ${limits.activeCount} из ${limits.activeLimit ?? 1}`}
          </span>
        )}
      </div>

      {invites.length > 0 && (
        <div className="mt-6 space-y-3">
          {invites.map((inv) => (
            <InviteCard key={inv.id} invite={inv} />
          ))}
        </div>
      )}

      <div className="mt-6">
        <DashTabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'feed', label: 'Лента заказов' },
            { id: 'mine', label: `Мои отклики · ${working.length + waiting.length}` },
            { id: 'people', label: 'Люди' },
          ]}
        />
      </div>

      <div className="mt-8">
        {tab === 'feed' ? (
          <LiveFeed />
        ) : tab === 'people' ? (
          <PeopleList />
        ) : working.length === 0 && waiting.length === 0 ? (
          <div className="rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
            <span className="role-accent-soft mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border">
              <Icon name="Send" size={24} className="role-accent-text" />
            </span>
            <p className="mt-4 font-head text-lg">Откликов пока нет</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-chip">
              Сейчас в ленте {feed.length} {feedWord(feed.length)}. Откройте подходящую задачу и
              нажмите «Готов взяться» — заказчик увидит вас в списке откликов.
            </p>
            <button
              onClick={() => setTab('feed')}
              className="mx-auto mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] sm:w-auto"
            >
              <Icon name="Radio" size={18} />
              Открыть ленту заказов
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {working.map((j) => (
              <ActiveJobCard key={j.id} job={j} />
            ))}
            {waiting.map((j) => (
              <div
                key={j.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-5"
              >
                <div className="min-w-0">
                  <p className="break-words font-head text-lg font-medium">{j.title}</p>
                  <p className="mt-1 break-words text-sm text-chip">
                    {j.city} · {j.when} · заказчик {j.ownerName}
                  </p>
                </div>
                <span className="rounded-full border border-line bg-tile px-4 py-2 text-sm text-muted-foreground">
                  Ждём выбора заказчика
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExecutorDashboard;