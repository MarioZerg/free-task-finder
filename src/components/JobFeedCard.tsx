import { memo, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { useAppState } from '@/hooks/use-app-state';
import { JobItem } from '@/lib/api';
import { money } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

const since = (iso: string) => {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return { value: `${d} дн ${h % 24} ч`, fresh: false };
  }
  if (h > 0) return { value: `${h} ч ${m} мин`, fresh: h < 2 };
  return { value: `${m} мин`, fresh: true };
};

interface Props {
  job: JobItem;
  responded: boolean;
  canRespond: boolean;
  readOnly?: boolean;
}

const JobFeedCard = ({ job, responded, canRespond, readOnly }: Props) => {
  const { respond } = useAppState();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const posted = since(job.bumpedAt || job.createdAt);

  const send = async () => {
    setBusy(true);
    try {
      await respond(job.id, note.trim());
      setOpen(false);
      setNote('');
      toast({ title: 'Отклик отправлен', description: 'Заказчик увидит вас в списке откликов.' });
    } catch (e) {
      const code = (e as Error).message;
      toast({
        title: code === 'executor_busy' ? 'Вы уже заняты заказом' : 'Не получилось откликнуться',
        description:
          code === 'executor_busy'
            ? 'Завершите текущий заказ — потом сможете брать новые.'
            : 'Возможно, заказ уже закрыт.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface">
      {job.photo && (
        <img src={job.photo} alt={job.title} className="h-40 w-full object-cover sm:h-44" />
      )}
      <div className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="font-head text-lg font-medium leading-snug sm:text-xl">{job.title}</h3>
          <span className="shrink-0 whitespace-nowrap font-head text-2xl font-semibold leading-none tracking-tight text-primary sm:text-3xl">
            {money(job.price)}
          </span>
        </div>

        <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{job.description}</p>

        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-line bg-tile px-4 py-3">
          <Icon
            name="Timer"
            size={20}
            className={posted.fresh ? 'text-primary' : 'text-chip'}
          />
          <div>
            <p
              className={`font-head text-xl font-semibold leading-none sm:text-2xl ${
                posted.fresh ? 'text-primary' : 'text-foreground'
              }`}
            >
              {posted.value}
            </p>
            <p className="mt-1 text-xs text-chip">в ленте</p>
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
          <span className="flex items-center gap-1.5">
            <Icon name="Tag" size={14} />
            {job.category}
          </span>

        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <span className="flex items-center gap-2 text-sm text-chip">
            <Avatar
              src={job.ownerAvatar}
              name={job.ownerName}
              size={28}
              online={job.ownerOnline}
            />
            {job.ownerName} · ★ {job.ownerRating.toFixed(1)}
          </span>

          {responded ? (
            <span className="flex items-center gap-2 rounded-full border border-line bg-tile px-5 py-2.5 text-sm text-muted-foreground">
              <Icon name="CheckCheck" size={16} className="text-primary" />
              Отклик отправлен
            </span>
          ) : readOnly ? (
            <span
              title="Просмотр глазами роли"
              className="rounded-full border border-line px-5 py-2.5 text-sm text-chip"
            >
              Готов взяться
            </span>
          ) : canRespond ? (
            <button
              onClick={() => setOpen(true)}
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Готов взяться
            </button>
          ) : (
            <span className="rounded-full border border-line px-5 py-2.5 text-xs text-chip">
              Сначала завершите текущий заказ
            </span>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="border-line bg-surface text-foreground sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle className="font-head text-2xl font-medium tracking-tight">
              Отклик на «{job.title}»
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Пара слов заказчику: когда свободны, что есть из инструмента.
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

export default memo(JobFeedCard);