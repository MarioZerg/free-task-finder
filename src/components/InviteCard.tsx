import { useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { useAppState } from '@/hooks/use-app-state';
import type { JobInvite } from '@/lib/api';
import { money } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

const InviteCard = ({ invite }: { invite: JobInvite }) => {
  const { acceptInvite, declineInvite } = useAppState();
  const [busy, setBusy] = useState(false);

  const accept = async () => {
    setBusy(true);
    try {
      await acceptInvite(invite.id);
      toast({
        title: 'Приглашение принято',
        description: 'Заказчик увидит ваш отклик и сможет назначить вас.',
      });
    } catch (e) {
      const code = (e as Error).message;
      toast({
        title: code === 'executor_busy' ? 'Вы уже заняты заказом' : 'Не получилось принять',
        description:
          code === 'executor_busy'
            ? 'Завершите текущий заказ — потом сможете брать новые.'
            : 'Возможно, заказ уже закрыт.',
      });
    } finally {
      setBusy(false);
    }
  };

  const decline = async () => {
    setBusy(true);
    try {
      await declineInvite(invite.id);
    } catch {
      toast({ title: 'Не получилось', description: 'Попробуйте ещё раз.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl border border-primary/40 bg-primary/5 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary">
        <Icon name="Mail" size={14} />
        Приглашение на заказ
      </p>
      <div className="mt-3 flex items-start justify-between gap-3">
        <h4 className="min-w-0 break-words font-head text-lg font-medium">{invite.title}</h4>
        <span className="shrink-0 font-head text-xl font-semibold text-primary">
          {money(invite.price)}
        </span>
      </div>
      <p className="mt-1 text-xs text-chip">
        {invite.city} · {invite.when}
      </p>

      <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
        <Avatar src={invite.customerAvatar} name={invite.customerName} size={26} />
        <span className="truncate">
          {invite.customerName} · ★ {invite.customerRating.toFixed(1)}
        </span>
      </div>

      {invite.note && (
        <p className="mt-2.5 break-words rounded-2xl border border-line bg-surface p-3 text-sm text-muted-foreground">
          {invite.note}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={accept}
          disabled={busy}
          className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60 sm:w-auto"
        >
          <Icon name="Check" size={16} />
          Принять
        </button>
        <button
          onClick={decline}
          disabled={busy}
          className="min-h-[44px] w-full rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60 sm:w-auto"
        >
          Отклонить
        </button>
      </div>
    </div>
  );
};

export default InviteCard;
