import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAppState } from '@/hooks/use-app-state';
import Icon from '@/components/ui/icon';
import { payCheck } from '@/lib/api';
import useSeo from '@/hooks/use-seo';
import { reachGoal } from '@/hooks/use-metrika';
import { dateMsk } from '@/lib/time';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

const dateRu = (v?: string | null) =>
  v
    ? dateMsk(v)
    : '';

type State = 'checking' | 'paid' | 'pending';

/** Страница возврата из банка после успешной оплаты.
 *
 *  Банк присылает человека сюда сразу после оплаты, но деньги к этому
 *  моменту могут ещё не подтвердиться. Поэтому несколько раз спрашиваем
 *  статус платежа и только потом показываем итог — иначе человек увидел бы
 *  «оплачено», а подписка бы не включилась. */
const PaymentSuccessInner = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, setUserData, refresh } = useAppState();
  const [state, setState] = useState<State>('checking');
  const started = useRef(false);

  const pid = Number(params.get('pid'));

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    if (!pid) {
      setState('pending');
      return;
    }

    let alive = true;
    const poll = async () => {
      for (let i = 0; i < 6; i += 1) {
        if (i > 0) await wait(3000);
        if (!alive) return;
        const r = await payCheck(pid).catch(() => null);
        if (!alive) return;
        if (r?.status === 'paid') {
          if (r.user) setUserData(r.user);
          reachGoal('pay_success');
          await refresh();
          if (alive) setState('paid');
          return;
        }
      }
      if (alive) setState('pending');
    };
    poll();
    return () => {
      alive = false;
    };
  }, [pid, setUserData, refresh]);

  // Когда всё подтвердилось — сами возвращаем человека в кабинет,
  // чтобы он не остался на странице-заглушке.
  useEffect(() => {
    if (state !== 'paid') return;
    const t = window.setTimeout(() => navigate('/dashboard', { replace: true }), 6000);
    return () => window.clearTimeout(t);
  }, [state, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12 font-body text-foreground">
      <div className="w-full max-w-[520px] rounded-3xl border border-line bg-surface p-7 text-center md:p-10">
        {state === 'checking' && (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Icon name="Loader" size={30} className="animate-spin text-primary" />
            </span>
            <h1 className="mt-6 font-head text-2xl font-medium tracking-tight md:text-3xl">
              Проверяем оплату
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Банк подтверждает платёж — это занимает несколько секунд.
              Не закрывайте страницу.
            </p>
          </>
        )}

        {state === 'paid' && (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/15">
              <Icon name="CircleCheck" size={32} className="text-primary" />
            </span>
            <h1 className="mt-6 font-head text-2xl font-medium tracking-tight md:text-3xl">
              Подписка активна
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Спасибо за оплату. Все возможности Доделай PRO уже включены.
            </p>

            {user?.subscriptionUntil && (
              <p className="mt-5 inline-flex items-center gap-2 rounded-full border border-amber-500/40 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-600">
                <Icon name="Crown" size={16} />
                PRO действует до {dateRu(user.subscriptionUntil)}
              </p>
            )}

            <div className="mt-7 space-y-2.5 text-left">
              {[
                'До 3 заказов в работе одновременно',
                'Задачи без лимита и поднятие каждый час',
                'Сообщения другим участникам напрямую',
              ].map((t) => (
                <p key={t} className="flex gap-2.5 text-sm text-muted-foreground">
                  <Icon name="Check" size={17} className="mt-0.5 shrink-0 text-primary" />
                  {t}
                </p>
              ))}
            </div>

            <Link
              to="/dashboard"
              className="mt-8 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Вернуться в профиль
              <Icon name="ArrowRight" size={18} />
            </Link>
            <p className="mt-3 text-xs text-chip">Перенесём автоматически через несколько секунд</p>
          </>
        )}

        {state === 'pending' && (
          <>
            <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-tile">
              <Icon name="Clock" size={30} className="text-primary" />
            </span>
            <h1 className="mt-6 font-head text-2xl font-medium tracking-tight md:text-3xl">
              Платёж обрабатывается
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
              Банк ещё не подтвердил оплату. Обычно это занимает пару минут — как только
              деньги дойдут, подписка включится сама, ничего доплачивать не нужно.
            </p>

            <Link
              to="/dashboard"
              className="mt-8 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              Вернуться в профиль
              <Icon name="ArrowRight" size={18} />
            </Link>
            <Link
              to="/contacts"
              className="mt-3 inline-block text-sm text-chip underline underline-offset-2 hover:text-foreground"
            >
              Деньги списались, а подписки нет — напишите нам
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

const PaymentSuccess = () => {
  useSeo({
    title: 'Оплата прошла — Доделай.ру',
    description: 'Подписка Доделай PRO активирована.',
    canonical: 'https://dodelay.ru/payment/success',
    robots: 'noindex, nofollow',
  });

  return (
    <PaymentSuccessInner />
  );
};

export default PaymentSuccess;
