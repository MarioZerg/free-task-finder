import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { PHOTO_GARDEN } from '@/data/mock';

const facts = [
  { icon: 'CircleDollarSign', title: 'Ноль комиссий', text: 'Оплата напрямую от заказчика. Сервис не берёт ни рубля.' },
  { icon: 'Smartphone', title: 'С телефона и компьютера', text: 'Одинаково удобно в дороге и за столом.' },
  { icon: 'ShieldCheck', title: 'Открытые списки', text: 'Видно рейтинг, число работ и стаж каждого участника.' },
];

const ExecutorsCta = () => {
  const { openLogin } = useAppState();

  return (
    <section id="executors" className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="overflow-hidden rounded-3xl border border-line">
            <img
              src={PHOTO_GARDEN}
              alt="Исполнитель за работой на участке"
              className="h-[320px] w-full object-cover md:h-[460px]"
              loading="lazy"
            />
          </div>

          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-chip">Исполнителям</p>
            <h2 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
              Подработка в Ярославской области — без посредников
            </h2>
            <p className="mt-4 max-w-[520px] text-base text-muted-foreground">
              Разовые заказы от частных лиц и небольших фирм: Ярославль, Рыбинск, Тутаев,
              Переславль-Залесский, Углич, Ростов. Сумму назначает заказчик, оплата — напрямую от
              заказчика.
            </p>

            <ul className="mt-10 space-y-6">
              {facts.map((f) => (
                <li key={f.title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                    <Icon name={f.icon} size={20} />
                  </span>
                  <div>
                    <h3 className="font-head text-lg font-medium">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              onClick={() => openLogin('executor')}
              className="mt-10 flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Войти как исполнитель
              <Icon name="ArrowRight" size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ExecutorsCta;