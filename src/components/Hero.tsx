import { useAppState } from '@/hooks/use-app-state';
import { money } from '@/data/mock';

const preview = [
  { id: 1, title: 'Перевезти диван', price: 1400, when: 'Сегодня до 19:00' },
  { id: 2, title: 'Собрать шкаф', price: 1200, when: 'Завтра, утро' },
  { id: 3, title: 'Убрать участок', price: 900, when: 'Суббота' },
  { id: 4, title: 'Помочь с погрузкой', price: 700, when: 'Понедельник' },
];

const Hero = () => {
  const { openLogin } = useAppState();

  return (
    <section id="top" className="relative overflow-hidden bg-background pb-4">
      <div className="relative mx-auto flex w-full max-w-[1400px] flex-col px-6 pt-28 md:px-10 md:pt-32 lg:px-16 lg:pt-[150px]">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div className="animate-fade-plain [animation-delay:.12s]">
            <h1 className="hero-head font-head font-normal leading-[1.18] tracking-[-0.02em]">
              Шабашка в Ярославле.
              <br />
              Доделай.ру — руки на сегодня.
            </h1>

            <button
              onClick={() => openLogin('customer')}
              className="mt-10 flex w-full max-w-[308px] items-center justify-between border-b border-foreground/40 pb-5 text-base transition-colors hover:border-primary md:mt-12"
            >
              <span>Открыть ленту заказов</span>
              <span className="text-lg leading-none">→</span>
            </button>

            <p className="mt-8 max-w-[420px] text-base text-muted-foreground">
              Разовые заказы от частных лиц — до 1500 ₽ за разовую задачу. Ярославль, Рыбинск,
              Тутаев, Переславль, Углич и Ростов. Бесплатно, без комиссий и подписок. Вход через MAX.
            </p>
          </div>

          <div className="flex w-full justify-center">
            <div className="relative h-[560px] w-[300px] max-w-full animate-rise rounded-[34px] bg-[linear-gradient(155deg,hsl(var(--screen))_0%,hsl(100_10%_22%)_100%)] p-3 shadow-[0_40px_70px_-38px_rgba(30,40,25,.45)] sm:h-[604px] sm:w-[322px]">
              <div className="flex h-full flex-col gap-3 overflow-hidden rounded-3xl bg-screen px-4 py-5 text-[hsl(var(--primary-foreground))]">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-[0.72em] font-medium">Лента заказов</div>
                  <div className="text-[0.6em] opacity-60">Ярославль</div>
                </div>

                {preview.map((job, i) => (
                  <div
                    key={job.id}
                    className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07]"
                  >
                    {i === 0 && <div className="h-[74px] bg-white/[0.06]" />}
                    <div className="px-3.5 py-3">
                      <div className="flex items-baseline justify-between gap-2.5">
                        <div className="text-[0.7em] font-medium">{job.title}</div>
                        <div className="whitespace-nowrap text-[0.7em] font-medium opacity-80">
                          {money(job.price)}
                        </div>
                      </div>
                      <div className="mt-1.5 text-[0.58em] opacity-55">{job.when}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-3 bottom-3 h-24 rounded-b-3xl bg-[linear-gradient(to_bottom,transparent,hsl(var(--screen))_78%)]" />
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative mt-12 flex select-none items-end justify-between overflow-hidden animate-fade-plain [animation-delay:.2s] md:mt-16">
          <b className="wordmark-fill block font-head font-bold text-primary/85">ДОДЕЛАЙ</b>
          <i className="mb-[1.55em] font-head text-[1.15em] not-italic leading-none text-primary/85">
            .РУ
          </i>
        </div>
      </div>
    </section>
  );
};

export default Hero;