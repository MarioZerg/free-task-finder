import { memo, useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import PhotoViewer from '@/components/PhotoViewer';
import { useAppState } from '@/hooks/use-app-state';
import type { JobItem } from '@/lib/api';
import { reachGoal } from '@/hooks/use-metrika';
import { money } from '@/data/mock';
import { categoryMeta } from '@/data/categories';
import { toast } from '@/hooks/use-toast';

const since = (iso: string) => {
  const sec = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h >= 24) {
    const d = Math.floor(h / 24);
    return { value: `${d} дн ${h % 24} ч`, fresh: false, isNew: false };
  }
  if (h > 0) return { value: `${h} ч ${m} мин`, fresh: h < 2, isNew: false };
  return { value: `${m} мин`, fresh: true, isNew: m < 15 };
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
  const [expanded, setExpanded] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((v) => v + 1), 30000);
    return () => window.clearInterval(id);
  }, []);

  const posted = since(job.bumpedAt || job.createdAt);
  const cat = categoryMeta(job.category);

  const responses = job.responses || [];
  const knownResponders = useRef<Set<number> | null>(null);
  const [freshResponders, setFreshResponders] = useState<number[]>([]);

  useEffect(() => {
    const ids = responses.map((r) => r.executorId);
    if (knownResponders.current === null) {
      knownResponders.current = new Set(ids);
      return;
    }
    const known = knownResponders.current;
    const added = ids.filter((id) => !known.has(id));
    ids.forEach((id) => known.add(id));
    if (!added.length) return;
    setFreshResponders((prev) => [...prev, ...added]);
    const t = window.setTimeout(
      () => setFreshResponders((prev) => prev.filter((id) => !added.includes(id))),
      3000,
    );
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses.map((r) => r.executorId).join(',')]);

  const shown = responses.slice(0, 4);
  const rest = responses.length - shown.length;
  const respWord = (n: number) => {
    const d = n % 10;
    const h = n % 100;
    if (d === 1 && h !== 11) return 'отклик';
    if (d >= 2 && d <= 4 && (h < 12 || h > 14)) return 'отклика';
    return 'откликов';
  };

  const send = async () => {
    setBusy(true);
    try {
      await respond(job.id, note.trim());
      reachGoal('job_response', { category: job.category, city: job.city });
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

  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const long = (job.description || '').length > 90;

  return (
    <article
      onClick={() => long && setExpanded((v) => !v)}
      className={`overflow-hidden rounded-3xl border border-line bg-surface transition-colors ${
        long ? 'cursor-pointer hover:border-primary/40' : ''
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${cat.tone}`}
          >
            <Icon name={cat.icon} size={19} />
          </span>

          <div className="min-w-0 flex-1">
            {job.isDemo && (
              <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-tile px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                <Icon name="Info" size={11} />
                Пример — так выглядят заказы
              </span>
            )}
            <div className="flex items-start justify-between gap-2 sm:gap-3">
              <h3 className="min-w-0 break-words font-head text-base font-medium leading-snug sm:text-lg">
                {job.title}
              </h3>
              <span className="shrink-0 whitespace-nowrap font-head text-lg font-semibold leading-none tracking-tight text-primary sm:text-2xl">
                {money(job.price)}
              </span>
            </div>

            <p className="mt-1 truncate text-xs text-chip">
              {job.city} · {job.when}
            </p>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-3">
          {job.photo && (
            <div onClick={stop} className="shrink-0">
              <PhotoViewer
                jobId={job.id}
                title={job.title}
                thumb={job.photo}
                hasFull={job.hasFullPhoto}
                className="h-14 w-14 rounded-2xl border border-line sm:h-16 sm:w-16"
                compact
              />
            </div>
          )}
          <p
            className={`min-w-0 flex-1 break-words text-sm leading-relaxed text-muted-foreground transition-all ${
              expanded ? '' : 'line-clamp-2'
            }`}
          >
            {job.description}
          </p>
        </div>

        {long && (
          <p className="mt-1.5 text-xs text-chip">{expanded ? 'Свернуть' : 'Показать полностью'}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${cat.tone}`}
          >
            <Icon name={cat.icon} size={13} />
            {cat.short}
          </span>
          {posted.isNew ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              <Icon name="Sparkles" size={13} />
              Новое
            </span>
          ) : (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs ${
                posted.fresh ? 'text-primary' : 'text-chip'
              }`}
            >
              <Icon name="Timer" size={13} />
              {posted.value} в ленте
            </span>
          )}
          {responses.length > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs text-chip">
              <span className="flex items-center">
                {shown.map((r, i) => (
                  <span
                    key={r.executorId}
                    style={
                      freshResponders.includes(r.executorId)
                        ? { animationDelay: `${i * 80}ms` }
                        : undefined
                    }
                    className={`${i > 0 ? '-ml-1.5' : ''} rounded-full border-2 border-surface ${
                      freshResponders.includes(r.executorId) ? 'animate-pop-in' : ''
                    }`}
                  >
                    <Avatar src={r.avatar} name={r.name} size={20} />
                  </span>
                ))}
                {rest > 0 && (
                  <span className="-ml-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-surface bg-primary/15 text-[9px] font-semibold text-primary">
                    +{rest}
                  </span>
                )}
              </span>
              {responses.length} {respWord(responses.length)}
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2.5 border-t border-line pt-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="flex min-w-0 items-center gap-2 text-xs text-chip">
            <Avatar
              src={job.ownerAvatar}
              name={job.ownerName}
              size={24}
              online={job.ownerOnline}
            />
            <span className="truncate">
              {job.ownerName} · ★ {job.ownerRating.toFixed(1)}
            </span>
          </span>

          {job.isDemo ? (
            <span className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-tile px-4 py-2 text-xs text-muted-foreground sm:min-h-0 sm:w-auto sm:py-2">
              <Icon name="Eye" size={14} />
              Пример заказа
            </span>
          ) : responded ? (
            <span className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-tile px-4 py-2 text-sm text-muted-foreground sm:min-h-0 sm:w-auto sm:py-2">
              <Icon name="CheckCheck" size={15} className="text-primary" />
              Отклик отправлен
            </span>
          ) : readOnly ? null : canRespond ? (
            <button
              onClick={(e) => {
                stop(e);
                setOpen(true);
              }}
              className="min-h-[44px] w-full rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] sm:min-h-0 sm:w-auto sm:py-2.5"
            >
              Готов взяться
            </button>
          ) : (
            <span className="flex min-h-[44px] w-full items-center justify-center rounded-full border border-line px-4 py-2 text-center text-xs text-chip sm:min-h-0 sm:w-auto">
              Сначала завершите текущий заказ
            </span>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          onClick={stop}
          className="border-line bg-surface text-foreground sm:max-w-[460px]"
        >
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