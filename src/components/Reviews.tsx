import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { money } from '@/data/mock';

const cases = [
  {
    icon: 'Truck',
    title: 'Помощь при переезде',
    text: 'Двое на пару часов: спустить вещи, загрузить газель, поднять на этаж. Самый частый заказ в Ярославле и Рыбинске.',
    time: '2–4 часа',
  },
  {
    icon: 'Wrench',
    title: 'Сборка мебели',
    text: 'Шкаф из магазина, кухня, детская кровать. Заказчик прикладывает фото коробок, исполнитель сразу видит объём.',
    time: '1–3 часа',
  },
  {
    icon: 'Sparkles',
    title: 'Уборка после ремонта',
    text: 'Вынести мусор, отмыть окна и полы от строительной пыли. Обычно берут вдвоём, чтобы закрыть за день.',
    time: '3–6 часов',
  },
  {
    icon: 'Trees',
    title: 'Работы на участке',
    text: 'Скосить траву, вскопать грядки, разгрузить дрова, помочь на даче в сезон. Часто зовут одного и того же человека повторно.',
    time: '2–8 часов',
  },
];

const Reviews = () => {
  const { stats } = useAppState();

  const numbers = [
    { label: 'открытых заказов сейчас', value: String(stats.openJobs), show: stats.openJobs > 0 },
    { label: 'работ уже выполнено', value: String(stats.doneJobs), show: stats.doneJobs > 0 },
    { label: 'исполнителей в области', value: String(stats.executors), show: stats.executors > 0 },
    {
      label: 'средняя сумма заказа',
      value: money(stats.avgCheck),
      show: stats.avgCheck > 0,
    },
  ].filter((n) => n.show);

  return (
    <section id="practice" className="bg-background py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">На практике</p>
        <h2 className="mt-4 max-w-[720px] font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          Как это устроено на практике
        </h2>
        <p className="mt-4 max-w-[620px] text-base text-muted-foreground">
          Ниже — типовые задачи, ради которых люди чаще всего ищут руки на день, и живые цифры
          сервиса: они считаются по базе прямо сейчас, без округлений в свою пользу.
        </p>

        {numbers.length > 0 && (
        <dl className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {numbers.map((n) => (
            <div key={n.label} className="rounded-3xl border border-line bg-tile p-7">
              <dt className="text-sm text-chip">{n.label}</dt>
              <dd className="mt-2 font-head text-3xl font-medium tracking-tight text-primary">
                {n.value}
              </dd>
            </div>
          ))}
        </dl>
        )}

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {cases.map((c) => (
            <article key={c.title} className="rounded-3xl border border-line bg-tile p-7">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon name={c.icon} size={20} />
                </span>
                <h3 className="font-head text-lg font-medium">{c.title}</h3>
              </div>
              <p className="mt-4 text-base leading-relaxed text-muted-foreground">{c.text}</p>
              <p className="mt-4 flex items-center gap-2 text-sm text-chip">
                <Icon name="Clock" size={16} />
                Обычно занимает {c.time}
              </p>
            </article>
          ))}
        </div>

        <p className="mt-8 max-w-[720px] text-sm text-chip">
          Отзывы участники оставляют друг другу после завершения работы — они видны в профиле
          исполнителя и заказчика внутри сервиса. Мы не показываем их на главной, чтобы не выдавать
          отобранные вручную цитаты за общую картину.
        </p>
      </div>
    </section>
  );
};

export default Reviews;