import { useAppState } from '@/hooks/use-app-state';
import HeroPhone from '@/components/HeroPhone';

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
              Разовые заказы от частных лиц. Ярославль, Рыбинск,
              Тутаев, Переславль, Углич и Ростов. Бесплатно, без комиссий и подписок. Вход через MAX.
            </p>
          </div>

          <div className="flex w-full justify-center">
            <HeroPhone />
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