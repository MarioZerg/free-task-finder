import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { JobItem } from '@/lib/api';
import { money } from '@/data/mock';
import Avatar, { OnlineBadge } from '@/components/Avatar';
import JobChat from '@/components/JobChat';
import PhotoViewer from '@/components/PhotoViewer';
import { toast } from '@/hooks/use-toast';

const leftText = (deadline?: string | null) => {
  if (!deadline) return '';
  const ms = new Date(deadline).getTime() - Date.now();
  if (ms <= 0) return '';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return `Осталось ${h} ч ${m} мин`;
};

const Contacts = ({
  label,
  data,
}: {
  label: string;
  data?: { contact: string | null; phone: string | null } | null;
}) => (
  <div className="rounded-2xl border border-line bg-tile p-4">
    <p className="text-xs uppercase tracking-[0.16em] text-chip">{label}</p>
    {data ? (
      <div className="mt-2 space-y-1 text-sm">
        {data.contact && (
          <p className="flex items-start gap-2">
            <Icon name="MessageCircle" size={16} className="mt-0.5 shrink-0 text-primary" />
            <span className="min-w-0 break-words">{data.contact}</span>
          </p>
        )}
        {data.phone && (
          <p className="flex items-start gap-2">
            <Icon name="Phone" size={16} className="mt-0.5 shrink-0 text-primary" />
            <span className="min-w-0 break-words">{data.phone}</span>
          </p>
        )}
        {!data.contact && !data.phone && <p className="text-chip">Контакты не указаны</p>}
      </div>
    ) : (
      <p className="mt-2 text-sm text-chip">Собеседник ещё не открыл контакты</p>
    )}
  </div>
);

const ActiveJobCard = ({
  job,
  defaultOpen = true,
  collapsible = false,
}: {
  job: JobItem;
  defaultOpen?: boolean;
  collapsible?: boolean;
}) => {
  const { shareContact, complete, cancel, review } = useAppState();
  const [, setTick] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [finalPrice, setFinalPrice] = useState(String(job.price));
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(defaultOpen);
  const [specOpen, setSpecOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const expanded = collapsible ? open : true;

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  const expired = job.status === 'expiring';
  const left = leftText(job.deadlineAt);
  const partner = (job.isOwner ? job.executorName : job.ownerName) || 'собеседник';
  const partnerOnline = job.isOwner ? job.executorOnline : job.ownerOnline;
  const iShared = job.isOwner ? job.ownerContactShared : job.executorContactShared;

  const completeGate = (() => {
    if (!job.assignedAt) return null;
    const ms = new Date(job.assignedAt).getTime() + 15 * 60000 - Date.now();
    if (ms <= 0) return null;
    return Math.max(1, Math.ceil(ms / 60000));
  })();

  const run = async (fn: () => Promise<void>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast({ title: ok });
    } catch {
      toast({ title: 'Не получилось', description: 'Попробуйте ещё раз.' });
    } finally {
      setBusy(false);
    }
  };

  const doComplete = async () => {
    const v = Number(finalPrice);
    if (!v) {
      toast({ title: 'Укажите сумму', description: 'Впишите итоговую сумму по заказу.' });
      return;
    }
    setCompleteOpen(false);
    await run(() => complete(job.id, v), 'Заказ завершён');
  };

  return (
    <div className="rounded-3xl border border-primary/40 bg-tile p-5 md:p-6">
      <div
        onClick={() => collapsible && setOpen((v) => !v)}
        className={`flex flex-wrap items-start justify-between gap-3 ${
          collapsible ? 'cursor-pointer' : ''
        }`}
      >
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.16em] text-chip">
            {job.status === 'done' ? 'Заказ выполнен' : 'Заказ в работе'}
          </p>
          <h4 className="mt-1 break-words font-head text-xl font-medium">{job.title}</h4>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 break-words text-sm text-chip">
            <Avatar
              src={job.isOwner ? job.executorAvatar : job.ownerAvatar}
              name={(job.isOwner ? job.executorName : job.ownerName) || '—'}
              size={26}
              online={partnerOnline}
            />
            {job.isOwner ? `Исполнитель: ${job.executorName}` : `Заказчик: ${job.ownerName}`}
            <OnlineBadge online={partnerOnline} />
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="whitespace-nowrap font-head text-xl font-medium text-primary">
            {money(job.finalPrice || job.price)}
          </span>
          {collapsible && (
            <Icon
              name="ChevronDown"
              size={20}
              className={`shrink-0 text-chip transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </div>

      {collapsible && !expanded && (
        <button
          onClick={() => setOpen(true)}
          className="mt-3 flex w-full flex-wrap items-center gap-2 text-left text-sm text-chip"
        >
          {job.status !== 'done' && (
            <span
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                expired || !left
                  ? 'border-destructive/50 bg-destructive/10 text-foreground'
                  : 'border-line bg-surface text-muted-foreground'
              }`}
            >
              <Icon name={expired || !left ? 'AlarmClock' : 'Timer'} size={13} />
              {expired || !left ? 'Время вышло' : left}
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5 text-xs text-muted-foreground">
            <Icon name={iShared ? 'CheckCheck' : 'Share2'} size={13} />
            {iShared ? 'Контакты открыты' : 'Контакты скрыты'}
          </span>
          <span className="ml-auto text-xs text-primary">Подробнее</span>
        </button>
      )}

      {expanded && job.status !== 'done' &&
        (expired || !left ? (
          <p className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/60 bg-destructive/15 px-4 py-3 text-sm text-foreground">
            <Icon name="AlarmClock" size={16} />
            Время вышло — завершите или отмените заказ
          </p>
        ) : (
          <p className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-surface px-4 py-3 text-sm">
            <Icon name="Timer" size={16} className="text-primary" />
            {left} на выполнение
          </p>
        ))}

      {expanded && (
        <>
      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <button
          onClick={() => setSpecOpen((v) => !v)}
          className="flex min-h-[48px] w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-tile"
        >
          <Icon name="FileText" size={16} className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1 text-sm font-medium">Задание целиком</span>
          <Icon
            name="ChevronDown"
            size={17}
            className={`shrink-0 text-chip transition-transform ${specOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {specOpen && (
          <div className="border-t border-line px-4 py-4">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-tile px-2.5 py-1 text-xs text-muted-foreground">
                <Icon name="MapPin" size={12} />
                {job.city}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-tile px-2.5 py-1 text-xs text-muted-foreground">
                <Icon name="CalendarDays" size={12} />
                {job.when}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-tile px-2.5 py-1 text-xs text-muted-foreground">
                <Icon name="Tag" size={12} />
                {job.category}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                {money(job.price)}
                {job.finalPrice && job.finalPrice !== job.price
                  ? ` → ${money(job.finalPrice)}`
                  : ''}
              </span>
            </div>

            <div className="mt-3 flex items-start gap-3">
              {job.photo && (
                <PhotoViewer
                  jobId={job.id}
                  title={job.title}
                  thumb={job.photo}
                  hasFull={job.hasFullPhoto}
                  className="h-16 w-16 shrink-0 rounded-2xl border border-line"
                  compact
                />
              )}
              <p className="min-w-0 flex-1 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">
                {job.description || 'Описание не указано.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Contacts
          label={job.isOwner ? 'Контакты исполнителя' : 'Контакты заказчика'}
          data={job.isOwner ? job.executorContact : job.ownerContact}
        />
        <div className="rounded-2xl border border-line bg-tile p-4">
          <p className="text-xs uppercase tracking-[0.16em] text-chip">Ваши контакты</p>
          {iShared ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="CheckCheck" size={16} className="text-primary" />
              {partner} видит ваши контакты
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm text-chip">
                Откройте контакты, когда будете готовы связаться напрямую.
              </p>
              <button
                onClick={() => run(() => shareContact(job.id), 'Контакты отправлены')}
                disabled={busy}
                className="mt-3 min-h-[44px] w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                Поделиться своими контактами
              </button>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        <button
          onClick={() => setChatOpen((v) => !v)}
          className="flex min-h-[48px] w-full items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-tile"
        >
          <Icon name="MessageSquare" size={16} className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1 text-sm font-medium">Чат с {partner}</span>
          <Icon
            name="ChevronDown"
            size={17}
            className={`shrink-0 text-chip transition-transform ${chatOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {chatOpen && <JobChat jobId={job.id} partner={partner} />}
      </div>

      {job.status !== 'done' && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {job.isOwner && (
            <button
              onClick={() => {
                setFinalPrice(String(job.price));
                setCompleteOpen(true);
              }}
              disabled={busy || !!completeGate}
              title={completeGate ? 'Дайте время договориться' : undefined}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Icon name="CircleCheck" size={16} />
              {completeGate ? `Завершить через ${completeGate} мин` : 'Завершить заказ'}
            </button>
          )}
          <button
            onClick={() => setCancelOpen(true)}
            disabled={busy}
            className="min-h-[44px] w-full rounded-full border border-line px-6 py-3 text-sm transition-colors hover:border-primary/50 disabled:opacity-60 sm:w-auto"
          >
            Отменить заказ
          </button>
        </div>
      )}

      {job.status === 'done' && (
        <div className="mt-5 border-t border-line pt-4">
          {job.myReviewDone ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Icon name="CheckCheck" size={16} className="text-primary" />
              Отзыв отправлен
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Оцените {job.isOwner ? 'исполнителя' : 'заказчика'}
              </p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    aria-label={`${s} звёзд`}
                    className={`flex h-11 w-11 items-center justify-center text-2xl leading-none transition-transform hover:scale-110 ${
                      s <= rating ? 'text-primary' : 'text-chip'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Как всё прошло"
                className="mt-3 min-h-[80px] w-full resize-none rounded-2xl border border-line bg-surface px-4 py-3 text-base outline-none placeholder:text-chip focus:border-primary/60"
              />
              <button
                onClick={() => run(() => review(job.id, rating, text.trim()), 'Отзыв отправлен')}
                disabled={busy}
                className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60 sm:w-auto"
              >
                <Icon name="Send" size={16} />
                Отправить отзыв
              </button>
            </>
          )}
        </div>
      )}
        </>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="border-line bg-surface text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head text-xl font-medium">
              Отменить заказ «{job.title}»?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Заказ уйдёт в отменённые. Вернуть его будет нельзя — придётся выставить заново.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-full border-line bg-tile">
              Не отменять
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => run(() => cancel(job.id), 'Заказ отменён')}
              className="rounded-full bg-primary text-primary-foreground"
            >
              Да, отменить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <AlertDialogContent className="border-line bg-surface text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head text-xl font-medium">
              {job.isOwner ? 'Укажите, сколько вы заплатили' : 'Укажите, сколько вы заработали'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Итоговую сумму подтверждает заказчик.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={finalPrice}
            onChange={(e) => setFinalPrice(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            className="w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none focus:border-primary/60"
          />
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-full border-line bg-tile">Назад</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                doComplete();
              }}
              className="rounded-full bg-primary text-primary-foreground"
            >
              Завершить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ActiveJobCard;