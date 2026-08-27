import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import { JobItem } from '@/lib/api';
import { money } from '@/data/mock';
import CreateJobDialog from '@/components/CreateJobDialog';
import ActiveJobCard from '@/components/ActiveJobCard';
import ProfileDialog from '@/components/ProfileDialog';
import DashHeader from '@/components/DashHeader';
import LiveFeed from '@/components/LiveFeed';
import Avatar from '@/components/Avatar';
import { toast } from '@/hooks/use-toast';

const statusLabel: Record<string, string> = {
  open: 'В ленте',
  assigned: 'В работе',
  expiring: 'Время вышло',
  done: 'Завершён',
  cancelled: 'Отменён',
};

const hoursLeft = (iso?: string | null) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
};

const Tabs = ({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { id: string; label: string }[];
}) => (
  <div className="flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
    {items.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={`whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors sm:px-6 ${
          value === t.id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
        }`}
      >
        {t.label}
      </button>
    ))}
  </div>
);

const CustomerJobCard = ({ job, onProfile }: { job: JobItem; onProfile: (id: number) => void }) => {
  const { assign } = useAppState();
  const [busy, setBusy] = useState(false);
  const responses = job.responses || [];

  if (job.status === 'assigned' || job.status === 'expiring' || job.status === 'done') {
    return <ActiveJobCard job={job} />;
  }

  const left = hoursLeft(job.expiresAt);
  const pending = job.moderation === 'pending';

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="font-head text-lg font-medium md:text-xl">{job.title}</h4>
          <p className="mt-1.5 text-sm text-muted-foreground">{job.description}</p>
        </div>
        <div className="text-right">
          <span className="font-head text-lg font-medium text-primary md:text-xl">
            {money(job.price)}
          </span>
          <p className="mt-1 text-xs text-chip">{statusLabel[job.status]}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-chip">
        <span className="flex items-center gap-1.5">
          <Icon name="MapPin" size={14} />
          {job.city}
        </span>
        <span className="flex items-center gap-1.5">
          <Icon name="Clock" size={14} />
          {job.when}
        </span>
        {left && (
          <span className="flex items-center gap-1.5">
            <Icon name="Timer" size={14} />
            активно ещё {left}
          </span>
        )}
      </div>

      {pending && (
        <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-4 py-3 text-sm text-muted-foreground">
          <Icon name="ShieldQuestion" size={18} className="mt-0.5 shrink-0 text-primary" />
          Задание на проверке у модератора. После проверки оно появится в ленте заказов.
        </p>
      )}

      {job.status === 'open' && !pending && (
        <div className="mt-5 border-t border-line pt-4">
          <h5 className="font-head text-base font-medium">Отклики · {responses.length}</h5>
          {responses.length === 0 ? (
            <p className="mt-2 text-sm text-chip">
              Пока никто не откликнулся. Исполнители видят задание в ленте.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {responses.map((r) => (
                <div key={r.executorId} className="rounded-2xl border border-line bg-tile p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={r.avatar} name={r.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs text-chip">
                        ★ {r.rating.toFixed(1)} · {r.doneCount} работ · {r.reviewsCount} отзывов
                      </p>
                      {r.skill && <p className="mt-0.5 text-xs text-chip">{r.skill}</p>}
                      <p className="mt-1.5 text-sm text-muted-foreground">{r.note}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => onProfile(r.executorId)}
                      className="flex-1 rounded-full border border-line bg-surface px-4 py-2.5 text-sm transition-colors hover:border-primary/60 sm:flex-none"
                    >
                      Посмотреть профиль
                    </button>
                    <button
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          await assign(job.id, r.executorId);
                          toast({
                            title: 'Исполнитель назначен',
                            description: `${r.name} получил ваши контакты. На работу — 48 часов.`,
                          });
                        } catch (e) {
                          const code = (e as Error).message;
                          toast({
                            title:
                              code === 'executor_already_busy'
                                ? 'Исполнитель уже занят'
                                : 'Не удалось назначить',
                            description:
                              code === 'executor_already_busy'
                                ? 'Он взял другой заказ — выберите другого кандидата.'
                                : 'Обновите страницу и попробуйте ещё раз.',
                          });
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="flex-1 rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60 sm:flex-none"
                    >
                      Назначить на заказ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
};

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
            if (!limits.canCreate) {
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

      {!limits.canCreate && (
        <p className="mt-5 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-5 py-4 text-sm text-muted-foreground">
          <Icon name="Info" size={18} className="mt-0.5 shrink-0 text-primary" />
          Одновременно можно вести одно задание. Новое станет доступно после завершения текущего
          {left ? ` или через ${left}` : ''}.
        </p>
      )}

      <div className="mt-7">
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'feed', label: 'Лента заказов' },
            { id: 'jobs', label: `Мои задания · ${active.length}` },
            { id: 'done', label: `Завершённые · ${finished.length}` },
          ]}
        />
      </div>

      <div className="mt-8">
        {tab === 'feed' && <LiveFeed readOnly />}

        {tab !== 'feed' &&
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
      <ProfileDialog userId={profileId} onOpenChange={() => setProfileId(null)} />
    </div>
  );
};

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
        <Tabs
          value={tab}
          onChange={setTab}
          items={[
            { id: 'feed', label: 'Лента заказов' },
            { id: 'mine', label: `Мои отклики · ${working.length + waiting.length}` },
          ]}
        />
      </div>

      <div className="mt-8">
        {tab === 'feed' ? (
          <LiveFeed />
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

const DashboardInner = () => {
  const { user, loading } = useAppState();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-chip">
        Загружаем кабинет…
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background font-body text-foreground">
      <DashHeader />
      <main>{user.role === 'customer' ? <CustomerDashboard /> : <ExecutorDashboard />}</main>
    </div>
  );
};

const Dashboard = () => (
  <AppStateProvider>
    <DashboardInner />
  </AppStateProvider>
);

export default Dashboard;
