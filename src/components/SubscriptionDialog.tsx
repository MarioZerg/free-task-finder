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
import { toast } from '@/hooks/use-toast';

export const PRO_PRICE = 299;

const PERKS = [
  'Публикация без лимита — новое задание каждый час вместо одного активного',
  'Поднятие объявления каждый час вместо 5 часов',
  'Приглашение исполнителей на свой заказ прямо из вкладки Люди',
  'Значок PRO в профиле и приоритет в списках',
];

const dateRu = (v?: string | null) =>
  v ? new Date(v).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  hint?: string;
}

const SubscriptionDialog = ({ open, onOpenChange, hint }: Props) => {
  const { user, subscribe } = useAppState();
  const [busy, setBusy] = useState(false);
  const isPro = !!user?.isPro;

  const buy = async () => {
    setBusy(true);
    try {
      await subscribe(1);
      toast({
        title: 'Подписка активна',
        description: 'Доделай PRO подключён на месяц.',
      });
    } catch {
      toast({ title: 'Не удалось оформить', description: 'Попробуйте ещё раз чуть позже.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            Доделай PRO
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {hint || 'Подписка для тех, кто размещает заказы часто.'}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <Icon name="Crown" size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-head text-lg font-medium">Доделай PRO</p>
              <p className="text-sm text-chip">
                <span className="font-head text-xl text-foreground">{PRO_PRICE} ₽</span> / месяц
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Icon name="Check" size={16} className="mt-0.5 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {isPro ? (
          <div className="space-y-3">
            <p className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-tile px-4 py-3.5 text-center text-sm text-muted-foreground">
              <Icon name="BadgeCheck" size={16} className="text-primary" />
              Подписка активна до {dateRu(user?.subscriptionUntil)}
            </p>
            <button
              onClick={buy}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              <Icon name="RefreshCw" size={18} />
              {busy ? 'Продлеваем…' : 'Продлить на месяц'}
            </button>
          </div>
        ) : (
          <div>
            <button
              onClick={buy}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              <Icon name="Crown" size={18} />
              {busy ? 'Оформляем…' : `Оформить за ${PRO_PRICE} ₽`}
            </button>
            <p className="mt-2 text-center text-xs text-chip">
              Оплата подключается — сейчас подписка активируется сразу для тестирования сервиса
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;
