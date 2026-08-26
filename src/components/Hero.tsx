import { useAppState } from '@/hooks/use-app-state';
import { initialJobs, money } from '@/data/mock';

const preview = initialJobs.slice(0, 5);

const Hero = () => {
  const { openLogin } = useAppState();

  return (
    <section id="top" className="relative overflow-hidden bg-background pb-4">
      <div className="relative mx-auto flex max-w-[1600px] flex-col px-6 pt-32 md:px-16 md:pt-[170px]">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div className="animate-fade-plain [animation-delay:.12s]">
            <h1 className="hero-head font-head font-normal leading-[1.18] tracking-[-0.02em]">
              Шабашка в Ярославле.
              <br />
              Доделай.ру — руки на сегодня.
            </h1>

            <button
              onClick={() => openLogin('customer')}
              className="mt-10 flex w-full max-w-[308px] items-center justify-between border-b border-foreground/55 pb-5 text-base transition-colors hover:border-foreground md:mt-14"
            >
              <span>Открыть ленту заказов</span>
              <span className="text-lg leading-none">→</span>
            </button>

            <p className="mt-8 max-w-[420px] text-base text-muted-foreground/90">
              Разовые заказы от 500 до 1500 ₽ в Ярославле, Рыбинске, Тутаеве, Переславле, Угличе и
              Ростове. Бесплатно, без комиссий и подписок. Вход через MAX.
            </p>
          </div>

          <div className="flex justify-center lg:justify-start">
            <div className="relative h-[604px] w-[322px] max-w-full animate-rise rounded-[34px] bg-[linear-gradient(150deg,hsl(var(--tile))_0%,hsl(var(--surface))_46%,hsl(var(--screen))_100%)] p-3 shadow-[0_60px_90px_-40px_rgba(0,0,0,.5),0_2px_0_rgba(255,255,255,.12)_inset]">
              <div className="flex h-full flex-col gap-3 overflow-hidden rounded-3xl bg-screen px-4 py-5">
                <div className="mb-1 flex items-center justify-between">
                  <div className="text-[0.72em] font-medium">Лента заказов</div>
                  <div className="text-[0.6em] text-chip">Ярославль · 5 км</div>
                </div>

                {preview.map((job, i) => (
                  <div
                    key={job.id}
                    className="overflow-hidden rounded-2xl border border-line bg-tile"
                  >
                    {i === 0 && <div className="photo-stub h-[74px]" />}
                    <div className="px-3.5 py-3">
                      <div className="flex items-baseline justify-between gap-2.5">
                        <div className="text-[0.7em] font-medium">{job.title}</div>
                        <div className="whitespace-nowrap text-[0.7em] font-medium text-[hsl(var(--muted-foreground))]">
                          {money(job.price)}
                        </div>
                      </div>
                      <div className="mt-1.5 text-[0.58em] text-chip">
                        {job.when} · {job.responses.length} откл.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute inset-x-3 bottom-3 h-24 rounded-b-3xl bg-[linear-gradient(to_bottom,transparent,hsl(var(--screen))_78%)]" />
            </div>
          </div>
        </div>

        <div className="pointer-events-none relative mt-10 flex select-none items-end justify-between overflow-hidden animate-fade-plain [animation-delay:.2s]">
          <b className="wordmark-fill block font-head font-bold">ДОДЕЛАЙ</b>
          <i className="mb-[1.55em] font-head text-[1.15em] not-italic leading-none">.РУ</i>
        </div>
      </div>
    </section>
  );
};

export default Hero;