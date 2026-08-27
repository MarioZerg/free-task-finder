import { useState } from 'react';
import { useAppState } from '@/hooks/use-app-state';
import ActiveJobCard from '@/components/ActiveJobCard';
import LiveFeed from '@/components/LiveFeed';
import PeopleList from '@/components/PeopleList';
import DashTabs from '@/components/dashboard/DashTabs';

const ExecutorDashboard = () => {
  const { myJobs } = useAppState();
  const [tab, setTab] = useState('feed');

  const working = myJobs.filter(
    (j) => ['assigned', 'expiring', 'done'].includes(j.status) && j.isAssignedExecutor,
  );
  const waiting = myJobs.filter((j) => j.status === 'open');

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-8 md:px-10 md:py-12 lg:px-16">
      <p className="text-xs uppercase tracking-[0.2em] text-chip">Кабинет исполнителя</p>
      <h1 className="mt-2 font-head text-2xl font-normal tracking-tight md:text-4xl">
        Заказы рядом
      </h1>

      <div className="mt-7">
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
          <div className="rounded-3xl border border-line bg-surface p-10 text-center">
            <p className="font-head text-lg">Откликов пока нет</p>
            <p className="mt-2 text-sm text-chip">
              Откройте ленту заказов и нажмите «Готов взяться» на подходящей задаче.
            </p>
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
                  <p className="font-head text-lg font-medium">{j.title}</p>
                  <p className="mt-1 text-sm text-chip">
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
