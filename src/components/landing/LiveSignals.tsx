import Icon from '@/components/ui/icon';

/** Живые сигналы страницы услуги: сколько людей готовы взять заказ и
 *  сколько из них сейчас на сайте.
 *
 *  Главное правило блока — молчать, когда сказать нечего. Пустые нули или
 *  «1 мастер» отпугивают сильнее, чем отсутствие блока: человек видит,
 *  что сервисом никто не пользуется, и уходит. Поэтому показываем его
 *  только начиная с MIN_TO_SHOW исполнителей.
 *
 *  Числа приходят из запроса, который страница делает и без нас, — свой
 *  запрос тут был бы вторым обращением к серверу за теми же данными.
 */
const MIN_TO_SHOW = 3;

interface Props {
  total: number;
  online: number;
  professionLabel: string;
  cityNominative: string;
  cityPrepositional: string;
}

const plural = (n: number, one: string, few: string, many: string) => {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
};

const LiveSignals = ({
  total,
  online,
  professionLabel,
  cityNominative,
  cityPrepositional,
}: Props) => {
  if (total < MIN_TO_SHOW) return null;

  const items = [
    {
      icon: 'Users',
      value: String(total),
      label: `${plural(total, 'мастер готов', 'мастера готовы', 'мастеров готовы')} взять заказ`,
    },
    ...(online > 0 ? [{ icon: 'Zap', value: String(online), label: 'сейчас на сайте' }] : []),
    { icon: 'Wallet', value: '0 ₽', label: 'комиссия сервиса' },
  ];

  return (
    <section className="mt-16">
      <p className="text-sm uppercase tracking-[0.2em] text-chip">Сейчас</p>
      <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
        {cityNominative}: кто возьмётся за задачу
      </h2>
      <p className="mt-3 max-w-[620px] text-sm text-muted-foreground">
        Это исполнители, которые указали специальность «{professionLabel}» и готовы
        выехать в {cityPrepositional}. Данные живые, а не витринные.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {items.map((it) => (
          <div key={it.label} className="rounded-3xl border border-line bg-surface p-5">
            <Icon name={it.icon} size={20} className="text-primary" />
            <p className="mt-3 font-head text-3xl font-medium tracking-tight">{it.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{it.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default LiveSignals;
