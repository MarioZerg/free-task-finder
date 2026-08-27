import { useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import { JobItem } from '@/lib/api';
import { CATEGORIES, money } from '@/data/mock';
import CreateJobDialog from '@/components/CreateJobDialog';
import ActiveJobCard from '@/components/ActiveJobCard';
import ProfileDialog from '@/components/ProfileDialog';
import EditProfileDialog from '@/components/EditProfileDialog';
import Avatar from '@/components/Avatar';
import { toast } from '@/hooks/use-toast';

const statusLabel: Record<string, string> = {
  open: 'Открыт',
  assigned: 'В работе',
  expiring: 'Время вышло',
  done: 'Завершён',
  cancelled: 'Отменён',
};

const DashHeader = () => {
  const { user, logout } = useAppState();
  const [profileOpen, setProfileOpen] = useState(false);
  if (!user) return null;
  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 py-5 md:px-16">
        <Link to="/" className="font-head text-xl font-bold leading-none tracking-tight">
          ДОДЕЛАЙ<sup className="align-super text-[0.42em] font-normal">.РУ</sup>
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Avatar src={user.avatar} name={user.name} size={44} />
          <div className="leading-tight">
            <p className="text-sm font-medium">{user.name}</p>
            <p className="text-xs text-chip">
              ★ {user.rating.toFixed(1)} ·{' '}
              {user.role === 'customer' ? 'заказчик' : `${user.doneCount} работ`}
            </p>
          </div>
          {user.isAdmin && (
            <Link
              to="/admin"
              className="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/50"
            >
              Админка
            </Link>
          )}
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/50"
          >
            <Icon name="UserRound" size={16} />
            Мой профиль
          </button>
          <button
            onClick={logout}
            className="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/50"
          >
            Выйти
          </button>
        </div>
      </div>
      <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
};

const JobMeta = ({ job }: { job: JobItem }) => (
  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-chip">
    <span className="flex items-center gap-1.5">
      <Icon name="MapPin" size={14} />
      {job.city}
    </span>
    <span className="flex items-center gap-1.5">
      <Icon name="Clock" size={14} />
      {job.when}
    </span>
    <span className="flex items-center gap-1.5">
      <Icon name="Tag" size={14} />
      {job.category}
    </span>
  </div>
);

const CustomerJobCard = ({ job, onProfile }: { job: JobItem; onProfile: (id: number) => void }) => {
  const { assign } = useAppState();
  const [busy, setBusy] = useState(false);
  const responses = job.responses || [];

  if (job.status === 'assigned' || job.status === 'expiring' || job.status === 'done') {
    return <ActiveJobCard job={job} />;
  }

  return (
    <article className="rounded-3xl border border-line bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="font-head text-xl font-medium">{job.title}</h4>
          <p className="mt-1 max-w-[560px] text-sm text-muted-foreground/85">{job.description}</p>
        </div>
        <div className="text-right">
          <span className="font-head text-xl font-medium text-primary">{money(job.price)}</span>
          <p className="mt-1 text-xs text-chip">{statusLabel[job.status]}</p>
        </div>
      </div>

      <JobMeta job={job} />

      {job.status === 'open' && (
        <div className="mt-5 border-t border-line pt-4">
          <h5 className="font-head text-base font-medium">Отклики · {responses.length}</h5>
          {responses.length === 0 ? (
            <p className="mt-2 text-sm text-chip">
              Пока никто не откликнулся. Исполнители видят заказ в радаре.
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {responses.map((r) => (
                <div key={r.executorId} className="rounded-2xl border border-line bg-tile p-4">
                  <div className="flex items-start gap-3">
                    <Avatar src={r.avatar} name={r.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="font-medium">{r.name}</span>
                        <span className="text-xs text-chip">
                          ★ {r.rating.toFixed(1)} · {r.doneCount} работ · {r.reviewsCount} отзывов
                        </span>
                      </div>
                      {r.skill && <p className="text-xs text-chip">{r.skill}</p>}
                      <p className="mt-1.5 text-sm text-muted-foreground/85">{r.note}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => onProfile(r.executorId)}
                      className="rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/50"
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
                        } catch {
                          toast({ title: 'Не удалось назначить', description: 'Обновите страницу.' });
                        } finally {
                          setBusy(false);
                        }
                      }}
                      className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60"
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
  const { myJobs } = useAppState();
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<'active' | 'done'>('active');
  const [profileId, setProfileId] = useState<number | null>(null);

  const active = myJobs.filter((j) => ['open', 'assigned', 'expiring'].includes(j.status));
  const finished = myJobs.filter((j) => ['done', 'cancelled'].includes(j.status));
  const list = tab === 'active' ? active : finished;

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-16 md:py-14">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Кабинет заказчика</p>
          <h1 className="mt-3 font-head text-3xl font-normal tracking-tight md:text-4xl">
            Мои заказы
          </h1>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          <Icon name="Plus" size={18} />
          Выставить задачу
        </button>
      </div>

      <div className="mt-8 flex gap-1 rounded-full border border-line p-1 md:w-fit">
        <button
          onClick={() => setTab('active')}
          className={`flex-1 rounded-full px-6 py-2.5 text-sm font-medium transition-colors md:flex-none ${
            tab === 'active' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground/80'
          }`}
        >
          Активные · {active.length}
        </button>
        <button
          onClick={() => setTab('done')}
          className={`flex-1 rounded-full px-6 py-2.5 text-sm font-medium transition-colors md:flex-none ${
            tab === 'done' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground/80'
          }`}
        >
          Завершённые · {finished.length}
        </button>
      </div>

      {list.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-line bg-surface p-10 text-center">
          <p className="font-head text-lg">
            {tab === 'active' ? 'Активных заказов нет' : 'Завершённых заказов пока нет'}
          </p>
          <p className="mt-2 text-sm text-chip">
            Выставите задачу — исполнители области увидят её в радаре сразу.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {list.map((j) => (
            <CustomerJobCard key={j.id} job={j} onProfile={setProfileId} />
          ))}
        </div>
      )}

      <CreateJobDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ProfileDialog userId={profileId} onOpenChange={() => setProfileId(null)} />
    </div>
  );
};

const RadarCard = ({ job, mine }: { job: JobItem; mine: boolean }) => {
  const { respond } = useAppState();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      await respond(job.id, note.trim());
      setOpen(false);
      setNote('');
      toast({ title: 'Отклик отправлен', description: 'Заказчик увидит вас в списке откликов.' });
    } catch {
      toast({ title: 'Не получилось откликнуться', description: 'Возможно, заказ уже закрыт.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-3xl border border-line bg-surface">
      {job.photo ? (
        <img src={job.photo} alt={job.title} className="h-36 w-full object-cover" />
      ) : (
        <div className="photo-stub h-36 w-full" />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="font-head text-lg font-medium leading-snug">{job.title}</h4>
          <span className="whitespace-nowrap font-head text-lg font-medium text-primary">
            {money(job.price)}
          </span>
        </div>
        <p className="mt-2 line-clamp-3 text-sm text-muted-foreground/85">{job.description}</p>
        <JobMeta job={job} />
        <p className="mt-3 flex items-center gap-2 text-xs text-chip">
          <Avatar src={job.ownerAvatar} name={job.ownerName} size={24} />
          Заказчик: {job.ownerName} · ★ {job.ownerRating.toFixed(1)}
        </p>

        <div className="mt-auto pt-4">
          {mine ? (
            <p className="flex items-center justify-center gap-2 rounded-full border border-line bg-tile py-3 text-sm text-muted-foreground/85">
              <Icon name="CheckCheck" size={16} className="text-primary" />
              Отклик отправлен
            </p>
          ) : (
            <button
              onClick={() => setOpen(true)}
              className="w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Готов взяться
            </button>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-line bg-surface text-foreground sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="font-head text-2xl font-medium tracking-tight">
              Отклик на «{job.title}»
            </DialogTitle>
            <DialogDescription className="text-muted-foreground/80">
              Можно добавить пару слов заказчику — когда свободны, что есть из инструмента.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Необязательно"
            className="min-h-[90px] w-full resize-none rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none placeholder:text-chip focus:border-primary/60"
          />
          <button
            onClick={send}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            <Icon name="Send" size={18} />
            Отправить отклик
          </button>
        </DialogContent>
      </Dialog>
    </article>
  );
};

const ExecutorDashboard = () => {
  const { user, feed, myJobs } = useAppState();
  const [category, setCategory] = useState('Все');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () =>
      feed.filter(
        (j) =>
          (category === 'Все' || j.category === category) &&
          (query.trim() === '' ||
            `${j.title} ${j.description} ${j.city}`.toLowerCase().includes(query.toLowerCase())),
      ),
    [feed, category, query],
  );

  const working = myJobs.filter((j) =>
    ['assigned', 'expiring', 'done'].includes(j.status) && j.isAssignedExecutor,
  );
  const waiting = myJobs.filter((j) => j.status === 'open');

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-10 md:px-16 md:py-14">
      <p className="text-sm uppercase tracking-[0.2em] text-chip">Кабинет исполнителя</p>
      <h1 className="mt-3 font-head text-3xl font-normal tracking-tight md:text-4xl">
        Радар Доделай
      </h1>
      <p className="mt-3 max-w-[560px] text-base text-muted-foreground/85">
        Живая лента открытых заказов Ярославской области. Обновляется автоматически каждые несколько
        секунд.
      </p>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="flex items-center gap-3 rounded-full border border-line bg-tile px-5 py-3.5 md:w-[320px]">
          <Icon name="Search" size={18} className="text-chip" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Поиск по заказам"
            className="w-full bg-transparent text-base outline-none placeholder:text-chip"
          />
        </div>
        <div className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 md:mx-0 md:flex-wrap md:px-0">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-sm transition-colors ${
                category === c
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-line text-muted-foreground/85 hover:border-primary/60'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-line bg-surface p-10 text-center">
          <p className="font-head text-lg">В радаре пусто</p>
          <p className="mt-2 text-sm text-chip">
            Новые заказы появятся здесь сами — страницу обновлять не нужно.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((j) => (
            <RadarCard
              key={j.id}
              job={j}
              mine={(j.responses || []).some((r) => r.executorId === user?.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-16">
        <h2 className="font-head text-2xl font-normal tracking-tight md:text-3xl">Мои заказы</h2>
        {working.length === 0 && waiting.length === 0 ? (
          <div className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center">
            <p className="text-sm text-chip">Пока нет ни откликов, ни назначенных заказов.</p>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {working.map((j) => (
              <ActiveJobCard key={j.id} job={j} />
            ))}
            {waiting.map((j) => (
              <div
                key={j.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-surface p-5"
              >
                <div>
                  <p className="font-head text-lg font-medium">{j.title}</p>
                  <p className="mt-1 text-sm text-chip">
                    {j.city} · {j.when} · заказчик {j.ownerName}
                  </p>
                </div>
                <span className="rounded-full border border-line px-4 py-2 text-sm text-muted-foreground/85">
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