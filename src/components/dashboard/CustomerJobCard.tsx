import { useState } from 'react';
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
import ActiveJobCard from '@/components/ActiveJobCard';
import Avatar, { OnlineBadge } from '@/components/Avatar';
import PhotoViewer from '@/components/PhotoViewer';
import { toast } from '@/hooks/use-toast';
import { hoursLeft, statusLabel } from '@/components/dashboard/DashTabs';
import { categoryMeta } from '@/data/categories';

const CustomerJobCard = ({
  job,
  onProfile,
  onEdit,
}: {
  job: JobItem;
  onProfile: (id: number) => void;
  onEdit: (job: JobItem) => void;
}) => {
  const { assign, removeJob, bumpJob, limits } = useAppState();
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const responses = job.responses || [];
  const pro = !!limits.pro;
  const bumpHours = pro ? 1 : 5;

  const bumpAvailableIn = (() => {
    const base = job.bumpedAt || job.createdAt;
    const ms = new Date(base).getTime() + bumpHours * 3600000 - Date.now();
    if (ms <= 0) return null;
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
  })();

  const bump = async () => {
    setBusy(true);
    try {
      await bumpJob(job.id);
      toast({
        title: 'Объявление поднято',
        description: 'Задание снова наверху ленты заказов.',
      });
    } catch {
      toast({
        title: 'Пока рано',
        description: `Поднимать объявление можно раз в ${pro ? 'час' : '5 часов'}.`,
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    setBusy(true);
    try {
      await removeJob(job.id);
      toast({
        title: 'Задание удалено',
        description: 'Теперь можно разместить новое — оно появится в ленте после проверки.',
      });
    } catch {
      toast({
        title: 'Не удалось удалить',
        description: 'Задание уже в работе — сначала завершите или отмените его.',
      });
    } finally {
      setBusy(false);
      setConfirmDelete(false);
    }
  };

  if (job.status === 'assigned' || job.status === 'expiring' || job.status === 'done') {
    return <ActiveJobCard job={job} />;
  }

  const left = hoursLeft(job.expiresAt);
  const pending = job.moderation === 'pending';
  const cat = categoryMeta(job.category);

  return (
    <article className="overflow-hidden rounded-3xl border border-line bg-surface">
      <div className="p-5 md:p-6">
      <div className="flex items-start gap-3">
        {job.photo && (
          <PhotoViewer
            jobId={job.id}
            title={job.title}
            thumb={job.photo}
            hasFull={job.hasFullPhoto}
            className="h-16 w-16 shrink-0 rounded-2xl border border-line sm:h-20 sm:w-20"
            compact
          />
        )}
        <div className="flex min-w-0 flex-1 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="break-words font-head text-lg font-medium md:text-xl">{job.title}</h4>
          <p className="mt-1.5 break-words text-sm text-muted-foreground">{job.description}</p>
        </div>
        <div className="shrink-0 text-right">
          <span className="block whitespace-nowrap font-head text-2xl font-semibold leading-none tracking-tight text-primary md:text-3xl">
            {money(job.price)}
          </span>
          <p className="mt-1 text-xs text-chip">{statusLabel[job.status]}</p>
        </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-chip">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 ${cat.tone}`}
        >
          <Icon name={cat.icon} size={13} />
          {cat.short}
        </span>
        <span className="min-w-0 break-words">
          {job.city} · {job.when}
          {left ? ` · активно ещё ${left}` : ''}
        </span>
      </div>

      {pending && (
        <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-4 py-3 text-sm text-muted-foreground">
          <Icon name="ShieldQuestion" size={18} className="mt-0.5 shrink-0 text-primary" />
          Задание на проверке у модератора. Как только его одобрят, оно появится в ленте заказов.
        </p>
      )}

      {job.moderation === 'rejected' && (
        <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
          <Icon name="ShieldX" size={18} className="mt-0.5 shrink-0 text-destructive" />
          Модератор отклонил задание. Удалите его и разместите новое с более точным описанием.
        </p>
      )}

      {(job.status === 'open' || job.status === 'cancelled') && (
        <div className="mt-4 flex flex-col gap-2 border-t border-line pt-4 sm:flex-row sm:flex-wrap">
          {job.status === 'open' && job.moderation === 'approved' && (
            <button
              disabled={busy || !!bumpAvailableIn}
              onClick={bump}
              className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              <Icon name="ArrowUp" size={16} />
              {bumpAvailableIn ? `Поднять через ${bumpAvailableIn}` : 'Поднять в ленте'}
            </button>
          )}
          <button
            disabled={busy}
            onClick={() => onEdit(job)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/60 hover:text-primary disabled:opacity-60 sm:w-auto"
          >
            <Icon name="Pencil" size={16} />
            Редактировать
          </button>
          <button
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60 sm:w-auto"
          >
            <Icon name="Trash2" size={16} />
            Удалить задание
          </button>
          <span className="flex items-center text-xs text-chip">
            {pro ? 'Поднимать объявление можно раз в час' : 'Поднимать объявление можно раз в 5 часов'}
          </span>
        </div>
      )}

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="border-line bg-surface text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head text-xl font-medium">
              Удалить задание?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              «{job.title}» и все отклики на него будут удалены без возможности восстановить. Сразу
              после этого вы сможете разместить новое задание.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-full border-line">Оставить</AlertDialogCancel>
            <AlertDialogAction
              onClick={remove}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {job.status === 'open' && (
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
                    <Avatar src={r.avatar} name={r.name} size={40} online={r.online} />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium">
                        {r.name}
                        <OnlineBadge online={r.online} />
                      </p>
                      <p className="text-xs text-chip">
                        ★ {r.rating.toFixed(1)} · {r.doneCount} работ · {r.reviewsCount} отзывов
                      </p>
                      {r.skill && <p className="mt-0.5 text-xs text-chip">{r.skill}</p>}
                      {r.about && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.about}</p>
                      )}
                      <p className="mt-1.5 text-sm text-muted-foreground">{r.note}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <button
                      onClick={() => onProfile(r.executorId)}
                      className="min-h-[44px] w-full rounded-full border border-line bg-surface px-4 py-2.5 text-sm transition-colors hover:border-primary/60 sm:w-auto sm:flex-none"
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
                      className="min-h-[44px] w-full rounded-full bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60 sm:w-auto sm:flex-none"
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
      </div>
    </article>
  );
};

export default CustomerJobCard;