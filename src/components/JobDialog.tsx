import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { findCustomer, findExecutor, initials, Job, money } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

interface Props {
  job: Job | null;
  onOpenChange: (v: boolean) => void;
}

const JobDialog = ({ job, onOpenChange }: Props) => {
  const { session, respond, confirm, cancelConfirm, openLogin } = useAppState();
  const [note, setNote] = useState('');

  if (!job) return null;

  const owner = findCustomer(job.ownerId);
  const isOwner = session?.role === 'customer' && job.ownerId === 'me';
  const myId = session?.executorId ?? 'e1';
  const alreadyResponded = job.responses.some((r) => r.executorId === myId);

  const sendResponse = () => {
    if (!session) {
      onOpenChange(false);
      openLogin('executor');
      return;
    }
    respond(job.id, myId, note.trim() || 'Готов взяться, напишите детали.');
    setNote('');
    toast({ title: 'Отклик отправлен', description: 'Заказчик увидит вас в списке откликов.' });
  };

  return (
    <Dialog open={!!job} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[620px]">
        {job.photo && (
          <img src={job.photo} alt={job.title} className="h-48 w-full rounded-2xl object-cover" />
        )}
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            {job.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/85">
            {job.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-chip">
          <span className="flex items-center gap-2">
            <Icon name="Wallet" size={16} />
            <span className="font-medium text-foreground">{money(job.price)}</span>
          </span>
          <span className="flex items-center gap-2">
            <Icon name="MapPin" size={16} />
            {job.city}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="Clock" size={16} />
            {job.when}
          </span>
          <span className="flex items-center gap-2">
            <Icon name="User" size={16} />
            {owner?.name ?? 'Заказчик'}
          </span>
        </div>

        <div className="mt-2 border-t border-line pt-5">
          <h4 className="font-head text-lg font-medium">
            Отклики · {job.responses.length}
          </h4>

          {job.responses.length === 0 && (
            <p className="mt-3 text-sm text-chip">Пока никто не откликнулся.</p>
          )}

          <div className="mt-4 space-y-3">
            {job.responses.map((r) => {
              const ex = findExecutor(r.executorId);
              const isConfirmed = job.confirmed === r.executorId;
              return (
                <div
                  key={r.executorId}
                  className={`rounded-2xl border p-4 transition-colors ${
                    isConfirmed ? 'border-primary bg-primary/10' : 'border-line bg-tile'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/20 text-sm font-semibold text-primary">
                      {initials(ex?.name ?? '??')}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium">{ex?.name}</span>
                        <span className="text-xs text-chip">
                          ★ {ex?.rating} · {ex?.done} работ
                        </span>
                        {isConfirmed && (
                          <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-medium text-primary-foreground">
                            Подтверждён
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground/85">{r.note}</p>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="mt-3 flex gap-2">
                      {isConfirmed ? (
                        <button
                          onClick={() => cancelConfirm(job.id)}
                          className="rounded-full border border-line px-4 py-2 text-sm hover:border-primary/50"
                        >
                          Отменить выбор
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            confirm(job.id, r.executorId);
                            toast({
                              title: 'Исполнитель подтверждён',
                              description: `${ex?.name} получит уведомление в MAX.`,
                            });
                          }}
                          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
                        >
                          Подтвердить исполнителя
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!isOwner && (
            <div className="mt-6">
              {alreadyResponded && session ? (
                <p className="flex items-center gap-2 rounded-2xl border border-line bg-tile px-4 py-3.5 text-sm text-muted-foreground/85">
                  <Icon name="CheckCheck" size={16} className="text-primary" />
                  Вы уже откликнулись. Заказчик выберет исполнителя.
                </p>
              ) : (
                <>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Пара слов заказчику: когда сможете, что есть из инструмента"
                    className="min-h-[84px] w-full resize-none rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none placeholder:text-chip focus:border-primary/60"
                  />
                  <button
                    onClick={sendResponse}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
                  >
                    <Icon name="Send" size={18} />
                    Откликнуться на заказ
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDialog;
