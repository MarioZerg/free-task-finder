import Icon from '@/components/ui/icon';
import MaxLogo from '@/components/ui/max-logo';
import { useAppState } from '@/hooks/use-app-state';

/** Раньше здесь выбирали роль — заказчика или исполнителя — и заводили под
 *  каждую отдельный аккаунт. Теперь профиль один, а карточки показывают два
 *  сценария, которые доступны с него одновременно. */
const cards: {
  id: string;
  title: string;
  sub: string;
  icon: string;
  points: string[];
}[] = [
  {
    id: 'order',
    title: 'Нужны руки',
    sub: 'Разместите задачу',
    icon: 'ClipboardList',
    points: [
      'Объявление за минуту — с фото или без',
      'Оно сразу в общей ленте исполнителей области',
      'Выбираете человека из откликов и подтверждаете',
    ],
  },
  {
    id: 'work',
    title: 'Ищете подработку',
    sub: 'Берите заказы рядом',
    icon: 'Hammer',
    points: [
      'Общая лента заказов вашего города области',
      'Отклик в один клик, без резюме и анкет',
      'Автор подтверждает — вы едете работать',
    ],
  },
];

const RolePreview = () => {
  const { openLogin } = useAppState();

  return (
    <section id="roles" className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">Вход</p>
        <h2 className="mt-4 max-w-[720px] font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          Один профиль на всё, вход через MAX
        </h2>
        <p className="mt-5 max-w-[640px] text-base text-muted-foreground md:text-lg">
          Отдельных аккаунтов для заказчика и исполнителя больше нет. Сегодня вы ищете мастера,
          завтра — сами беретесь за заказ. Всё с одного профиля.
        </p>

        <div className="mt-12 grid gap-5 md:mt-16 lg:grid-cols-2">
          {cards.map((c) => (
            <article
              key={c.id}
              className="group flex flex-col rounded-3xl border border-line bg-tile p-7 transition-colors hover:border-primary/45 md:p-10"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon name={c.icon} size={22} />
                </span>
                <div>
                  <h3 className="font-head text-2xl font-medium tracking-tight">{c.title}</h3>
                  <p className="text-sm text-chip">{c.sub}</p>
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {c.points.map((p) => (
                  <li key={p} className="flex gap-3 text-base text-muted-foreground">
                    <Icon name="Check" size={18} className="mt-1 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <button
          onClick={() => openLogin()}
          className="btn-shine mt-9 flex w-full items-center justify-between gap-4 rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] sm:w-auto"
        >
          <span className="flex items-center gap-2.5">
            <MaxLogo size={20} />
            Войти через MAX
          </span>
          <Icon name="ArrowRight" size={18} />
        </button>
      </div>
    </section>
  );
};

export default RolePreview;
