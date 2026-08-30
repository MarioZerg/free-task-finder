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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { billingConfig } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

export const PRO_PRICE = 990;

const MONTHS = [1, 3, 6];

const monthWord = (n: number) => (n === 1 ? 'месяц' : n < 5 ? 'месяца' : 'месяцев');

const CUSTOMER_PERKS = [
  'Публикация без лимита — новое задание каждый час вместо одного активного',
  'Поднятие объявления каждый час вместо 5 часов',
  'Приглашение исполнителей на свой заказ прямо из вкладки Люди',
  'Значок PRO в профиле и приоритет в списках',
];

const EXECUTOR_PERKS = [
  'До 3 заказов в работе одновременно вместо одного',
  'Сообщения заказчикам напрямую из вкладки Люди — без ожидания отклика',
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
  const { user, subscribe, startPayment, unsubscribe } = useAppState();
  const [busy, setBusy] = useState(false);
  const [payEnabled, setPayEnabled] = useState(true);
  const [price, setPrice] = useState(PRO_PRICE);
  const [months, setMonths] = useState(1);
  const [cancelOpen, setCancelOpen] = useState(false);
  const isPro = !!user?.isPro;
  const isAdmin = !!user?.isAdmin;
  const autoRenew = user?.autoRenew !== false;
  const total = price * months;
  const perks = user?.role === 'executor' ? EXECUTOR_PERKS : CUSTOMER_PERKS;

  useEffect(() => {
    if (!open) return;
    billingConfig()
      .then((r) => {
        setPayEnabled(!!r.paymentsEnabled);
        setPrice(r.price || PRO_PRICE);
      })
      .catch(() => setPrice(PRO_PRICE));
  }, [open]);

  const buy = async () => {
    setBusy(true);
    try {
      const r = await startPayment(months);
      if (r.paymentsEnabled && r.paymentUrl) {
        window.location.href = r.paymentUrl;
        return;
      }
      toast({
        title: 'Оплата пока не подключена',
        description: 'Напишите в поддержку — поможем оформить подписку.',
      });
    } catch (e) {
      const code = (e as Error).message;
      toast(
        code === 'payment_required'
          ? { title: 'Подписка оформляется только после оплаты' }
          : { title: 'Не удалось оформить', description: 'Попробуйте ещё раз чуть позже.' },
      );
    } finally {
      setBusy(false);
    }
  };

  const testActivate = async () => {
    setBusy(true);
    try {
      await subscribe(months);
      toast({ title: 'Тестовая активация', description: 'Доделай PRO включён без оплаты.' });
    } catch {
      toast({ title: 'Не удалось активировать', description: 'Попробуйте ещё раз.' });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (immediate: boolean) => {
    setBusy(true);
    try {
      await unsubscribe(immediate);
      toast({
        title: immediate ? 'Подписка отключена' : 'Продление отменено',
        description: immediate
          ? 'Возможности PRO больше недоступны.'
          : 'PRO будет работать до конца оплаченного периода.',
      });
    } catch {
      toast({ title: 'Не получилось', description: 'Попробуйте ещё раз.' });
    } finally {
      setBusy(false);
      setCancelOpen(false);
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

        <div className="rounded-3xl border border-amber-500/40 bg-amber-500/5 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
              <Icon name="Crown" size={22} />
            </span>
            <div className="min-w-0">
              <p className="font-head text-lg font-medium">Доделай PRO</p>
              <p className="text-sm text-chip">
                <span className="font-head text-xl text-foreground">{price} ₽</span> / месяц
              </p>
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            {perks.map((p) => (
              <li key={p} className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Icon name="Check" size={16} className="mt-0.5 shrink-0 text-primary" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {isPro && (
          <div className="space-y-3">
            <p className="flex items-center justify-center gap-2 rounded-2xl border border-line bg-tile px-4 py-3.5 text-center text-sm text-muted-foreground">
              <Icon name="BadgeCheck" size={16} className="text-primary" />
              Подписка активна до {dateRu(user?.subscriptionUntil)}
            </p>

            {!autoRenew && (
              <p className="flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-4 py-3 text-sm text-muted-foreground">
                <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-primary" />
                Продление отменено. PRO работает до конца оплаченного периода.
              </p>
            )}
          </div>
        )}

        <div className="space-y-3">
          <div className="scrollbar-none -mx-1 flex gap-2 overflow-x-auto px-1">
            {MONTHS.map((m) => (
              <button
                key={m}
                onClick={() => setMonths(m)}
                className={`min-h-[44px] flex-1 shrink-0 whitespace-nowrap rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
                  months === m
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-line bg-tile text-muted-foreground hover:border-primary/50'
                }`}
              >
                {m} {monthWord(m)}
              </button>
            ))}
          </div>

          <p className="text-center text-sm text-chip">
            {price} ₽ × {months} мес ={' '}
            <span className="font-head text-lg text-foreground">{total} ₽</span>
          </p>

          {payEnabled ? (
            <button
              onClick={buy}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              <Icon name={isPro ? 'RefreshCw' : 'Crown'} size={18} />
              {busy
                ? 'Переходим к оплате…'
                : isPro
                  ? `Продлить за ${total} ₽`
                  : `Оформить за ${total} ₽`}
            </button>
          ) : (
            <p className="flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-4 py-3.5 text-sm text-muted-foreground">
              <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-primary" />
              Оплата пока не подключена. Напишите в поддержку.
            </p>
          )}

          {isAdmin && (
            <button
              onClick={testActivate}
              disabled={busy}
              className="min-h-[44px] w-full rounded-full border border-line bg-tile py-3 text-sm text-muted-foreground transition-colors hover:border-primary/60 disabled:opacity-60"
            >
              Тестовая активация без оплаты (админ)
            </button>
          )}

          <p className="flex items-center justify-center gap-1.5 text-center text-xs text-chip">
            <Icon name="ShieldCheck" size={13} />
            Оплата картой или через СБП — эквайринг Точка Банка
          </p>
          <p className="text-center text-xs text-chip">
            Автоматических списаний нет. Подписка действует оплаченный период и по окончании
            отключается сама — за день до этого придёт напоминание.
          </p>

          {isPro && (
            <button
              onClick={() => setCancelOpen(true)}
              disabled={busy}
              className="min-h-[44px] w-full rounded-full border border-line py-3.5 text-sm transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60"
            >
              Отказаться от подписки
            </button>
          )}
        </div>
      </DialogContent>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="border-line bg-surface text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-head text-xl font-medium">
              Отказаться от подписки?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Можно отменить только продление — тогда PRO доработает до{' '}
              {dateRu(user?.subscriptionUntil)}. Или отключить сразу — возможности PRO пропадут
              немедленно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col gap-2 sm:flex-row">
            <AlertDialogCancel className="rounded-full border-line">Оставить</AlertDialogCancel>
            <button
              onClick={() => cancel(true)}
              disabled={busy}
              className="min-h-[44px] w-full rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60 sm:w-auto"
            >
              Отключить сразу
            </button>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                cancel(false);
              }}
              className="rounded-full bg-primary text-primary-foreground"
            >
              Отменить продление
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
};

export default SubscriptionDialog;