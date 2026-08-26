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
          <p className="flex items-center gap-2">
            <Icon name="MessageCircle" size={16} className="text-primary" />
            {data.contact}
          </p>
        )}
        {data.phone && (
          <p className="flex items-center gap-2">
            <Icon name="Phone" size={16} className="text-primary" />
            {data.phone}
          </p>
        )}
        {!data.contact && !data.phone && <p className="text-chip">Контакты не указаны</p>}
      </div>
    ) : (
      <p className="mt-2 text-sm text-chip">Исполнитель ещё не поделился контактами</p>
    )}
  </div>
);

const ActiveJobCard = ({ job }: { job: JobItem }) => {
  const { shareContact, complete, cancel, review } = useAppState();
  const [, setTick] = useState(0);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [finalPrice, setFinalPrice] = useState(String(job.price));
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  const expired = job.status === 'expiring';
  const left = leftText(job.deadlineAt);

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
    if (!v || v < 500 || v > 1500) {
      toast({ title: 'Сумма вне диапазона', description: 'Финальная сумма — от 500 до 1500 ₽.' });
      return;
    }
    setCompleteOpen(false);
    await run(() => complete(job.id, v), 'Заказ завершён');
  };

  return (
    <div className="rounded-3xl border border-primary/40 bg-tile p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-chip">
            {job.status === 'done' ? 'Заказ выполнен' : 'Заказ в работе'}
          </p>
          <h4 className="mt-1 font-head text-xl font-medium">{job.title}</h4>
          <p className="mt-1 text-sm text-chip">
            {job.isOwner ? `Исполнитель: ${job.executorName}` : `Заказчик: ${job.ownerName}`}
          </p>
        </div>
        <span className="whitespace-nowrap font-head text-xl font-medium text-primary">
          {money(job.finalPrice || job.price)}
        </span>
      </div>

      {job.status !== 'done' &&
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

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Contacts label="Контакты заказчика" data={job.ownerContact} />
        {job.isOwner ? (
          <Contacts label="Контакты исполнителя" data={job.executorContact} />
        ) : (
          <div className="rounded-2xl border border-line bg-tile p-4">
            <p className="text-xs uppercase tracking-[0.16em] text-chip">Ваши контакты</p>
            {job.executorContactShared ? (
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground/85">
                <Icon name="CheckCheck" size={16} className="text-primary" />
                Заказчик видит ваши контакты
              </p>
            ) : (
              <button
                onClick={() => run(() => shareContact(job.id), 'Контакты отправлены заказчику')}
                disabled={busy}
                className="mt-3 w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                Поделиться своими контактами
              </button>
            )}
          </div>
        )}
      </div>

      {job.status !== 'done' && (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.isOwner && (
            <button
              onClick={() => {
                setFinalPrice(String(job.price));
                setCompleteOpen(true);
              }}
              disabled={busy}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              <Icon name="CircleCheck" size={16} />
              Завершить заказ
            </button>
          )}
          <button
            onClick={() => setCancelOpen(true)}
            disabled={busy}
            className="rounded-full border border-line px-6 py-3 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
          >
            Отменить заказ
          </button>
        </div>
      )}

      {job.status === 'done' && (
        <div className="mt-5 border-t border-line pt-4">
          {job.myReviewDone ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground/85">
              <Icon name="CheckCheck" size={16} className="text-primary" />
              Отзыв отправлен
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground/85">
                Оцените {job.isOwner ? 'исполнителя' : 'заказчика'}
              </p>
              <div className="mt-2 flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setRating(s)}
                    aria-label={`${s} звёзд`}
                    className={`text-2xl leading-none transition-transform hover:scale-110 ${
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
                className="mt-3 flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                <Icon name="Send" size={16} />
                Отправить отзыв
              </button>
            </>
          )}
        </div>
      )}

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="border-line bg-surface text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head text-xl font-medium">
              Отменить заказ «{job.title}»?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/80">
              Заказ уйдёт в отменённые. Вернуть его будет нельзя — придётся выставить заново.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
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
              Завершение заказа
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground/80">
              Укажите финальную сумму, о которой вы договорились — от 500 до 1500 ₽.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <input
            value={finalPrice}
            onChange={(e) => setFinalPrice(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            className="w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none focus:border-primary/60"
          />
          <AlertDialogFooter>
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
