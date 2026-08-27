import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import CreateJobDialog from '@/components/CreateJobDialog';
import ProfileDialog from '@/components/ProfileDialog';
import LiveFeed from '@/components/LiveFeed';
import PeopleList from '@/components/PeopleList';
import { toast } from '@/hooks/use-toast';
import DashTabs, { hoursLeft } from '@/components/dashboard/DashTabs';
import CustomerJobCard from '@/components/dashboard/CustomerJobCard';

const CustomerDashboard = () => {
  const { myJobs, limits } = useAppState();
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState('feed');
  const [profileId, setProfileId] = useState<number | null>(null);

  const active = myJobs.filter((j) => ['open', 'assigned', 'expiring'].includes(j.status));
  const finished = myJobs.filter((j) => ['done', 'cancelled'].includes(j.status));
  const left = hoursLeft(limits.activeExpiresAt);

  return (
    <div className="mx-auto w-full max-w-[1400px] px-5 py-8 md:px-10 md:py-12 lg:px-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-chip">Кабинет заказчика</p>
          <h1 className="mt-2 font-head text-2xl font-normal tracking-tight md:text-4xl">
            Задания и лента
          </h1>
        </div>
        <button
          onClick={() => {
            if (!limits.canCreate && !limits.pro) {
              toast({
                title: 'Уже есть активное задание',
                description: 'Новое можно выставить после завершения текущего или через 24 часа.',
              });
              setTab('jobs');
              return;
            }
            setCreateOpen(true);
          }}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60 sm:w-auto sm:px-7"
        >
          <Icon name="Plus" size={18} />
          Выставить задачу
        </button>
      </div>

      {limits.pro ? (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-primary/40 bg-primary/5 px-5 py-4 text-sm text-muted-foreground">
          <Icon name="Crown" size={18} className="mt-0.5 shrink-0 text-primary" />
          PRO: публикуйте новое задание каждый час
        </p>
      ) : (
        !limits.canCreate && (
          <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-5 py-4 text-sm text-muted-foreground">
            <Icon name="Info" size={18} className="mt-0.5 shrink-0 text-primary" />
            Одновременно можно вести одно задание. Новое станет доступно после завершения текущего
            {left ? ` или через ${left}` : ''}.
          </p>
        )
      )}

      <div className="mt-7">
        <DashTabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'feed', label: 'Лента заказов' },
            { id: 'jobs', label: `Мои задания · ${active.length}` },
            { id: 'done', label: `Завершённые · ${finished.length}` },
            { id: 'people', label: 'Люди' },
          ]}
        />
      </div>

      <div className="mt-8">
        {tab === 'feed' && <LiveFeed readOnly />}
        {tab === 'people' && <PeopleList />}

        {tab !== 'feed' &&
          tab !== 'people' &&
          ((tab === 'jobs' ? active : finished).length === 0 ? (
            <div className="rounded-3xl border border-line bg-surface p-10 text-center">
              <p className="font-head text-lg">
                {tab === 'jobs' ? 'Активных заданий нет' : 'Завершённых заданий пока нет'}
              </p>
              <p className="mt-2 text-sm text-chip">
                Выставите задачу — после проверки модератором она появится в ленте заказов.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {(tab === 'jobs' ? active : finished).map((j) => (
                <CustomerJobCard key={j.id} job={j} onProfile={setProfileId} />
              ))}
            </div>
          ))}
      </div>

      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ProfileDialog userId={profileId} showDetails onOpenChange={() => setProfileId(null)} />
    </div>
  );
};

export default CustomerDashboard;
