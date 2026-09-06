import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import Loader from '@/components/Loader';
import { api } from '@/lib/api';
import { money } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import { dayMsk } from '@/lib/time';

interface Side {
  id: number;
  name: string;
  avatar?: string | null;
}

interface ChatRow {
  kind: 'job' | 'direct';
  id: string;
  jobId?: number;
  title: string;
  status?: string;
  price?: number | null;
  total: number;
  lastAt: string;
  sideA: Side;
  sideB: Side | null;
}

interface ChatMessage {
  id: number;
  text: string;
  createdAt: string;
  authorId: number;
  authorName: string;
  authorAvatar?: string | null;
  read: boolean;
}

interface JobInfo {
  id: number;
  title: string;
  description: string;
  status: string;
  price: number | null;
  createdAt: string;
  completedAt: string | null;
  ownerName: string;
  execName: string | null;
}

const kinds = [
  { id: 'jobs', label: 'Сделки' },
  { id: 'direct', label: 'Личные' },
];

const statusRu: Record<string, string> = {
  open: 'Открыт',
  assigned: 'В работе',
  expiring: 'Время вышло',
  done: 'Завершён',
  cancelled: 'Отменён',
  moderation: 'На проверке',
};

const statusStyle: Record<string, string> = {
  done: 'border-primary/40 bg-primary/10 text-primary',
  cancelled: 'border-destructive/40 bg-destructive/10 text-destructive',
  assigned: 'border-line bg-tile text-foreground',
};

const time = (v: string) =>
  new Date(v).toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Moscow',
  });

const AdminChats = () => {
  const [kind, setKind] = useState('jobs');
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ChatRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [open, setOpen] = useState<ChatRow | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [job, setJob] = useState<JobInfo | null>(null);
  const [loadingChat, setLoadingChat] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.jobs('admin_chats', {
        method: 'POST',
        body: { kind, search },
      });
      setRows(r.chats || []);
    } catch {
      toast({ title: 'Не удалось загрузить переписки' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  /* Поиск ждёт паузы в наборе — иначе запрос уходит на каждую букву. */
  useEffect(() => {
    const t = window.setTimeout(load, 400);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const openChat = async (row: ChatRow) => {
    setOpen(row);
    setMessages([]);
    setJob(null);
    setLoadingChat(true);
    try {
      const r = await api.jobs('admin_chat', {
        method: 'POST',
        body: { kind: row.kind, id: row.id, jobId: row.jobId },
      });
      setMessages(r.messages || []);
      setJob(r.job || null);
    } catch {
      toast({ title: 'Не удалось открыть переписку' });
    } finally {
      setLoadingChat(false);
    }
  };

  if (open) {
    /* Первый участник задаёт сторону: его сообщения справа, ответы слева —
       так переписка читается как привычный чат, а не как список строк. */
    const rightId = open.sideA.id;
    return (
      <div>
        <button
          onClick={() => setOpen(null)}
          className="mb-5 flex min-h-[44px] items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="ArrowLeft" size={17} />
          Ко всем перепискам
        </button>

        <div className="rounded-3xl border border-line bg-surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-head text-xl font-medium tracking-tight">{open.title}</h3>
              <p className="mt-1 text-sm text-chip">
                {open.kind === 'job' ? 'Переписка по сделке' : 'Личная переписка'} ·{' '}
                {messages.length} сообщений
              </p>
            </div>
            {job && (
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-3.5 py-1.5 text-xs font-medium ${
                    statusStyle[job.status] || 'border-line bg-tile text-muted-foreground'
                  }`}
                >
                  {statusRu[job.status] || job.status}
                </span>
                {!!job.price && (
                  <span className="rounded-full border border-line bg-tile px-3.5 py-1.5 text-xs font-medium">
                    {money(job.price)}
                  </span>
                )}
              </div>
            )}
          </div>

          {job && (
            <div className="mt-4 rounded-2xl border border-line bg-tile p-4">
              <p className="text-sm text-muted-foreground">{job.description}</p>
              <p className="mt-2.5 text-xs text-chip">
                Заказчик: {job.ownerName}
                {job.execName ? ` · Исполнитель: ${job.execName}` : ' · Исполнитель не назначен'}
                {' · Создан '}
                {dayMsk(job.createdAt)}
              </p>
            </div>
          )}
        </div>

        {loadingChat ? (
          <Loader />
        ) : messages.length === 0 ? (
          <p className="mt-6 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-chip">
            Сообщений нет
          </p>
        ) : (
          <div className="mt-4 space-y-3 rounded-3xl border border-line bg-surface p-5">
            {messages.map((m, i) => {
              const mine = m.authorId === rightId;
              const prev = messages[i - 1];
              const newDay =
                !prev || dayMsk(prev.createdAt) !== dayMsk(m.createdAt);
              return (
                <div key={m.id}>
                  {newDay && (
                    <p className="py-2 text-center text-xs text-chip">
                      {dayMsk(m.createdAt)}
                    </p>
                  )}
                  <div className={`flex items-end gap-2 ${mine ? 'flex-row-reverse' : ''}`}>
                    <Avatar src={m.authorAvatar} name={m.authorName} size={30} />
                    <div
                      className={`max-w-[76%] rounded-2xl px-4 py-2.5 ${
                        mine
                          ? 'bg-primary text-primary-foreground'
                          : 'border border-line bg-tile text-foreground'
                      }`}
                    >
                      <p className="text-[11px] font-medium opacity-70">{m.authorName}</p>
                      <p className="mt-0.5 whitespace-pre-wrap break-words text-sm">{m.text}</p>
                      <p
                        className={`mt-1 text-[10px] ${
                          mine ? 'text-primary-foreground/70' : 'text-chip'
                        }`}
                      >
                        {time(m.createdAt)}
                        {open.kind === 'direct' && !m.read && ' · не прочитано'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {kinds.map((k) => (
          <button
            key={k.id}
            onClick={() => setKind(k.id)}
            className={`min-h-[44px] rounded-full border px-5 py-2.5 text-sm transition-colors ${
              kind === k.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-line text-muted-foreground hover:border-primary/50'
            }`}
          >
            {k.label}
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-[280px]">
          <Icon
            name="Search"
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chip"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Имя или название заказа"
            className="min-h-[44px] w-full rounded-full border border-line bg-surface pl-10 pr-4 text-sm outline-none placeholder:text-chip focus:border-primary/60"
          />
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : rows.length === 0 ? (
        <p className="mt-8 rounded-3xl border border-line bg-surface p-10 text-center text-sm text-chip">
          {search ? 'Ничего не найдено' : 'Переписок пока нет'}
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => (
            <button
              key={r.id}
              onClick={() => openChat(r)}
              className="flex w-full items-center gap-4 rounded-3xl border border-line bg-surface p-4 text-left transition-colors hover:border-primary/50 sm:p-5"
            >
              <div className="flex shrink-0 -space-x-3">
                <Avatar src={r.sideA.avatar} name={r.sideA.name} size={40} />
                {r.sideB && <Avatar src={r.sideB.avatar} name={r.sideB.name} size={40} />}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{r.title}</p>
                <p className="mt-1 truncate text-sm text-chip">
                  {r.sideA.name}
                  {r.sideB ? ` · ${r.sideB.name}` : ''}
                  {' · '}
                  {r.total} сообщений
                </p>
              </div>

              <div className="shrink-0 text-right">
                {r.status && (
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${
                      statusStyle[r.status] || 'border-line bg-tile text-muted-foreground'
                    }`}
                  >
                    {statusRu[r.status] || r.status}
                  </span>
                )}
                <p className="mt-1.5 text-xs text-chip">{dayMsk(r.lastAt)}</p>
              </div>

              <Icon name="ChevronRight" size={18} className="shrink-0 text-chip" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminChats;
