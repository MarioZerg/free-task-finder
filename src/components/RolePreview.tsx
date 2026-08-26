import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { Role } from '@/data/mock';

const cards: {
  role: Role;
  title: string;
  sub: string;
  icon: string;
  points: string[];
  cta: string;
}[] = [
  {
    role: 'customer',
    title: 'Я заказчик',
    sub: 'Нужны руки на сегодня',
    icon: 'ClipboardList',
    points: [
      'Объявление за минуту — с фото или без',
      'Оно сразу в общей ленте исполнителей области',
      'Выбираете человека из откликов и подтверждаете',
    ],
    cta: 'Разместить объявление',
  },
  {
    role: 'executor',
    title: 'Я исполнитель',
    sub: 'Ищу подработку в Ярославле',
    icon: 'Hammer',
    points: [
      'Общая лента заказов вашего города области',
      'Отклик в один клик, без резюме и анкет',
      'Заказчик подтверждает — вы едете работать',
    ],
    cta: 'Смотреть заказы',
  },
];

const RolePreview = () => {
  const { openLogin } = useAppState();

  return (
    <section id="roles" className="bg-surface py-24 md:py-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-16">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">Вход</p>
        <h2 className="mt-4 max-w-[720px] font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          Две роли, один вход через MAX
        </h2>

        <div className="mt-12 grid gap-5 md:mt-16 lg:grid-cols-2">
          {cards.map((c) => (
            <article
              key={c.role}
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
                  <li key={p} className="flex gap-3 text-base text-muted-foreground/90">
                    <Icon name="Check" size={18} className="mt-1 shrink-0 text-primary" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => openLogin(c.role)}
                className="mt-9 flex items-center justify-between rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                <span>{c.cta}</span>
                <Icon name="ArrowRight" size={18} />
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolePreview;