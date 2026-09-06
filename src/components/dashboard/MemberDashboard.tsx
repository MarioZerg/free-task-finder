import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import type { JobItem } from '@/lib/api';
import CreateJobDialog from '@/components/CreateJobDialog';
import ProfileDialog from '@/components/ProfileDialog';
import ActiveJobCard from '@/components/ActiveJobCard';
import LiveFeed from '@/components/LiveFeed';
import PeopleList from '@/components/PeopleList';
import InviteCard from '@/components/InviteCard';
import { toast } from '@/hooks/use-toast';
import DashTabs, { hoursLeft } from '@/components/dashboard/DashTabs';
import CustomerJobCard from '@/components/dashboard/CustomerJobCard';
import SubscriptionDialog from '@/components/SubscriptionDialog';
import DashBottomNav from '@/components/dashboard/DashBottomNav';

const feedWord = (n: number) => {
  const d = n % 10;
  const h = n % 100;
  if (d === 1 && h !== 11) return 'заказ';
  if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'заказа';
  return 'заказов';
};

/** Единый кабинет: один профиль и заказывает, и берёт работу.
 *
 *  Раньше кабинета было два — заказчика и исполнителя, и человек заводил
 *  под каждый отдельный аккаунт. Теперь вкладки просто показывают разные
 *  стороны одного профиля: «Мои задачи» — то, что человек разместил сам,
 *  «Моя работа» — заказы, которые он взял или на которые откликнулся.
 */
const MemberDashboard = () => {
  const { myJobs, feed, limits, invites, unread, user } = useAppState();
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState('feed');
  const [profileId, setProfileId] = useState<number | null>(null);
  const [editJob, setEditJob] = useState<JobItem | null>(null);
  const [proOpen, setProOpen] = useState(false);

  // Со страницы «оплата не прошла» человек возвращается с ?pro=1 —
  // сразу открываем окно подписки, чтобы он не искал кнопку заново.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('pro') !== '1') return;
    setProOpen(true);
    params.delete('pro');
    const rest = params.toString();
    window.history.replaceState(
      {},
      '',
      `${window.location.pathname}${rest ? `?${rest}` : ''}`,
    );
  }, []);

  const myId = user?.id;

  // Свои задачи — те, где человек автор. Работа — где он исполнитель
  // или откликнулся и ждёт выбора.
  const ownJobs = myJobs.filter((j) => j.ownerId === myId);
  const ownActive = ownJobs.filter((j) => ['open', 'assigned', 'expiring'].includes(j.status));
  const ownFinished = ownJobs.filter((j) => ['done', 'cancelled'].includes(j.status));

  const working = myJobs.filter(
    (j) => j.ownerId !== myId && ['assigned', 'expiring', 'done'].includes(j.status) && j.isAssignedExecutor,
  );
  const waiting = myJobs.filter((j) => j.ownerId !== myId && j.status === 'open');

  const startCreate = () => {
    if (!limits.canCreate && !limits.pro) {
      toast({
        title: 'Уже есть активная задача',
        description: 'Новую можно разместить после завершения текущей или через 24 часа.',
      });
      setTab('jobs');
      return;
    }
    setEditJob(null);
    setCreateOpen(true);
  };

  const tabItems = [
    { id: 'feed', label: 'Лента заказов', icon: 'Radio' },
    { id: 'work', label: `Моя работа · ${working.length + waiting.length}`, icon: 'Briefcase' },
    { id: 'jobs', label: `Мои задачи · ${ownActive.length}`, icon: 'ClipboardList' },
    { id: 'done', label: `Завершённые · ${ownFinished.length}`, icon: 'CheckCheck' },
    { id: 'people', label: 'Люди', icon: 'Users', badge: unread.total },
  ];

  // На узкой панели длинные подписи не помещаются — оставляем короткие,
  // счётчики и так видны на самих карточках.
  const navItems = [
    { id: 'feed', label: 'Лента', icon: 'Radio' },
    { id: 'work', label: 'Работа', icon: 'Briefcase', badge: working.length + waiting.length },
    { id: 'jobs', label: 'Задачи', icon: 'ClipboardList', badge: ownActive.length },
    { id: 'done', label: 'Готово', icon: 'CheckCheck' },
    { id: 'people', label: 'Люди', icon: 'Users', badge: unread.total },
  ];

  return (
    <div className="safe-x mx-auto w-full max-w-[1400px] px-5 py-8 md:px-10 md:py-12 lg:px-16">
      <span className="role-accent-bar mb-5 block h-1 w-24 rounded-full" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="role-accent-text text-xs uppercase tracking-[0.2em]">Личный кабинет</p>
          <h1 className="mt-2 font-head text-2xl font-normal tracking-tight md:text-4xl">
            Заказы и задачи
          </h1>
        </div>
        <button
          onClick={startCreate}
          className="btn-shine flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.03] disabled:opacity-60 sm:w-auto sm:px-8 sm:text-lg"
        >
          <Icon name="Plus" size={20} />
          Разместить задачу
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <span className="role-accent-soft flex min-h-[40px] items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium">
          <Icon name="Radio" size={16} className="role-accent-text" />
          {feed.length} {feedWord(feed.length)} в ленте
        </span>
        {limits.pro && (
          <span className="flex min-h-[40px] items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-600">
            <Icon name="Crown" size={16} />
            PRO: до {limits.activeLimit ?? 3} заказов и задачи без лимита
          </span>
        )}
        {typeof limits.activeCount === 'number' && (
          <span className="flex min-h-[40px] items-center gap-2 rounded-full border border-line bg-tile px-4 py-2 text-sm text-muted-foreground">
            <Icon name={limits.busy ? 'Lock' : 'ClipboardCheck'} size={16} />
            {limits.busy
              ? 'Лимит заказов в работе исчерпан'
              : `В работе: ${limits.activeCount} из ${limits.activeLimit ?? 1}`}
          </span>
        )}
      </div>

      {!limits.pro && !limits.canCreate && (
        <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-5 py-4 text-sm text-muted-foreground">
          <Icon name="Info" size={18} className="mt-0.5 shrink-0 text-primary" />
          Одновременно можно вести одну свою задачу. Новая станет доступна после завершения текущей
          {hoursLeft(limits.activeExpiresAt) ? ` или через ${hoursLeft(limits.activeExpiresAt)}` : ''}.
        </p>
      )}

      {invites.length > 0 && (
        <div className="mt-6 space-y-3">
          {invites.map((inv) => (
            <InviteCard key={inv.id} invite={inv} />
          ))}
        </div>
      )}

      <div className="mt-7 hidden md:block">
        <DashTabs value={tab} onChange={setTab} items={tabItems} />
      </div>

      <div className="mt-8">
        {tab === 'feed' && <LiveFeed />}
        {tab === 'people' && <PeopleList />}

        {tab === 'work' &&
          (working.length === 0 && waiting.length === 0 ? (
            <div className="rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
              <span className="role-accent-soft mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border">
                <Icon name="Send" size={24} className="role-accent-text" />
              </span>
              <p className="mt-4 font-head text-lg">Откликов пока нет</p>
              <p className="mx-auto mt-2 max-w-md text-sm text-chip">
                Сейчас в ленте {feed.length} {feedWord(feed.length)}. Откройте подходящую задачу и
                нажмите «Готов взяться» — автор увидит вас в списке откликов.
              </p>
              <button
                onClick={() => setTab('feed')}
                className="btn-shine mx-auto mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] sm:w-auto"
              >
                <Icon name="Radio" size={18} />
                Открыть ленту заказов
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {working.map((j) => (
                <ActiveJobCard key={j.id} job={j} collapsible defaultOpen={false} />
              ))}
              {waiting.map((j) => (
                <div
                  key={j.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-5"
                >
                  <div className="min-w-0">
                    <p className="break-words font-head text-lg font-medium">{j.title}</p>
                    <p className="mt-1 break-words text-sm text-chip">
                      {j.city} · {j.when} · автор {j.ownerName}
                    </p>
                  </div>
                  <span className="rounded-full border border-line bg-tile px-4 py-2 text-sm text-muted-foreground">
                    Ждём выбора автора
                  </span>
                </div>
              ))}
            </div>
          ))}

        {(tab === 'jobs' || tab === 'done') &&
          ((tab === 'jobs' ? ownActive : ownFinished).length === 0 ? (
            <div className="rounded-3xl border border-line bg-surface p-6 text-center sm:p-10">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon name={tab === 'jobs' ? 'ClipboardList' : 'Archive'} size={24} />
              </span>
              <p className="mt-4 font-head text-lg">
                {tab === 'jobs' ? 'Своих задач пока нет' : 'Завершённых задач пока нет'}
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm text-chip">
                {tab === 'jobs'
                  ? 'Опишите, что нужно сделать, и назначьте свою цену. После проверки модератором задача появится в ленте — исполнители откликнутся сами.'
                  : 'Здесь появятся задачи, которые вы завершили или отменили.'}
              </p>
              {tab === 'jobs' && (
                <button
                  onClick={startCreate}
                  className="btn-shine mx-auto mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] sm:w-auto"
                >
                  <Icon name="Plus" size={18} />
                  Разместить задачу
                </button>
              )}
              {tab === 'done' && (
                <button
                  onClick={() => setTab('feed')}
                  className="mx-auto mt-5 flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full border border-line px-6 text-base font-medium text-muted-foreground transition-colors hover:border-primary/50 sm:w-auto"
                >
                  <Icon name="Radio" size={18} />
                  Открыть ленту заказов
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {(tab === 'jobs' ? ownActive : ownFinished).map((j) => (
                <CustomerJobCard
                  key={j.id}
                  collapsible
                  defaultOpen={false}
                  job={j}
                  onProfile={setProfileId}
                  onEdit={(target) => {
                    setEditJob(target);
                    setCreateOpen(true);
                  }}
                />
              ))}
            </div>
          ))}
      </div>

      <CreateJobDialog
        open={createOpen}
        job={editJob}
        onOpenChange={(v) => {
          setCreateOpen(v);
          if (!v) setEditJob(null);
        }}
      />
      <ProfileDialog userId={profileId} showDetails onOpenChange={() => setProfileId(null)} />
      <SubscriptionDialog open={proOpen} onOpenChange={setProOpen} />

      {/* Запас снизу, чтобы панель не перекрывала последнюю карточку. */}
      <div className="h-24 md:hidden" />
      <DashBottomNav value={tab} onChange={setTab} items={navItems} />
    </div>
  );
};

export default MemberDashboard;
