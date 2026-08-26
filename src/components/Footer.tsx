import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';

const Footer = () => {
  const { openLogin } = useAppState();

  return (
    <footer className="overflow-hidden bg-surface pt-24 md:pt-32">
      <div className="mx-auto max-w-[1400px] px-6 md:px-16">
        <div className="grid gap-10 border-b border-line pb-16 md:grid-cols-2 md:items-end">
          <h2 className="font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
            Задача есть — руки найдутся.
          </h2>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <button
              onClick={() => openLogin('customer')}
              className="flex items-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Я заказчик
              <Icon name="ArrowRight" size={18} />
            </button>
            <button
              onClick={() => openLogin('executor')}
              className="rounded-full border border-foreground/30 px-7 py-4 text-base font-medium transition-colors hover:border-primary"
            >
              Я исполнитель
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 py-10 text-sm text-chip">
          <p>Бесплатный сервис поиска подработки. Вход через MAX.</p>
          <nav className="flex flex-wrap gap-6">
            <a href="#feed" className="story-link">Лента</a>
            <a href="#how" className="story-link">Как это работает</a>
            <a href="#people" className="story-link">Люди</a>
            <a href="#top" className="story-link">Наверх</a>
          </nav>
        </div>

        <div className="pointer-events-none flex select-none items-end justify-between">
          <b className="wordmark-fill block translate-y-[0.16em] font-head font-bold text-foreground/90">
            ШАБАШКА
          </b>
          <i className="mb-[1.55em] font-head text-[1.15em] not-italic leading-none text-foreground/90">
            ®
          </i>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
