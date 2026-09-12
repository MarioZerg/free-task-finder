import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import useSeo from '@/hooks/use-seo';

const reasons = [
  'На карте не хватило денег или сработал дневной лимит',
  'Банк отклонил платёж — бывает при оплате с новой карты',
  'Истекло время на оплату или вкладку закрыли раньше времени',
];

/** Страница возврата из банка, когда оплата не прошла.
 *
 *  Деньги при этом не списываются. Главное здесь — не оставить человека
 *  в тупике: кнопка ведёт обратно в кабинет и сразу открывает окно
 *  подписки, чтобы можно было попробовать снова в один шаг. */
const PaymentFailInner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-5 py-12 font-body text-foreground">
    <div className="w-full max-w-[520px] rounded-3xl border border-line bg-surface p-7 text-center md:p-10">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <Icon name="CircleX" size={32} className="text-destructive" />
      </span>

      <h1 className="mt-6 font-head text-2xl font-medium tracking-tight md:text-3xl">
        Оплата не прошла
      </h1>
      <p className="mt-3 text-base text-muted-foreground">
        Подписка не оформлена, деньги не списаны. Можно попробовать ещё раз —
        это займёт минуту.
      </p>

      <div className="mt-7 rounded-2xl border border-line bg-tile p-5 text-left">
        <p className="text-sm font-medium">Почему так бывает</p>
        <div className="mt-3 space-y-2.5">
          {reasons.map((t) => (
            <p key={t} className="flex gap-2.5 text-sm text-muted-foreground">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-chip" />
              {t}
            </p>
          ))}
        </div>
      </div>

      <Link
        to="/dashboard?pro=1"
        className="mt-8 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
      >
        <Icon name="RefreshCw" size={18} />
        Попробовать оплатить снова
      </Link>

      <Link
        to="/dashboard"
        className="mt-3 flex min-h-[48px] w-full items-center justify-center rounded-full border border-line px-7 text-base font-medium text-muted-foreground transition-colors hover:border-primary/50"
      >
        Вернуться в профиль
      </Link>

      <p className="mt-5 text-sm text-chip">
        Сервис работает и без подписки — она только снимает лимиты.
      </p>
      <Link
        to="/contacts"
        className="mt-2 inline-block text-sm text-chip underline underline-offset-2 hover:text-foreground"
      >
        Деньги списались, но подписки нет — напишите нам
      </Link>
    </div>
  </div>
);

const PaymentFail = () => {
  useSeo({
    title: 'Оплата не прошла — Доделай.ру',
    description: 'Платёж за подписку Доделай PRO не был завершён.',
    canonical: 'https://dodelay.ru/payment/fail',
    robots: 'noindex, nofollow',
  });

  return (
    <PaymentFailInner />
  );
};

export default PaymentFail;