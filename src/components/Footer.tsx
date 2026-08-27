import { Link } from 'react-router-dom';
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

        <div className="border-b border-line py-10">
          <h3 className="font-head text-base font-medium">
            Доделай.ру — шабашка в городах Ярославской области
          </h3>
          <p className="mt-3 max-w-[860px] text-sm text-chip">
            Подработка и разовые заказы: Ярославль (Кировский, Заволжский, Дзержинский, Фрунзенский,
            Ленинский, Красноперекопский районы), Рыбинск, Тутаев, Переславль-Залесский, Углич,
            Ростов Великий, Гаврилов-Ям, Данилов, Пошехонье, Мышкин, Некрасовское.
          </p>
        </div>

        <div className="border-b border-line py-10">
          <p className="flex max-w-[860px] items-start gap-3 text-sm text-muted-foreground/85">
            <Icon name="ShieldAlert" size={18} className="mt-0.5 shrink-0 text-primary" />
            Сервис бесплатный и является только доской объявлений. Он не участвует в расчётах и не
            проверяет исполнителей: всю ответственность за условия, оплату, качество и безопасность
            работ несут заказчики и исполнители самостоятельно.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 py-10 text-sm text-chip">
          <p>Бесплатный сервис поиска подработки в Ярославской области. Вход через MAX.</p>
          <nav className="flex flex-wrap gap-6">
            <a href="#roles" className="story-link">Роли</a>
            <a href="#how" className="story-link">Как это работает</a>
            <a href="#completed" className="story-link">Завершённые заказы</a>
            <Link to="/privacy" className="story-link">Конфиденциальность</Link>
            <Link to="/terms" className="story-link">Условия (оферта)</Link>
            <a href="#top" className="story-link">Наверх</a>
          </nav>
        </div>

        <div className="pointer-events-none mt-6 flex select-none items-end justify-between pb-10 md:pb-14">
          <b className="wordmark-fill block pt-[0.12em] font-head font-bold leading-[1.02] text-foreground/90">
            ДОДЕЛАЙ
          </b>
          <i className="mb-[0.15em] font-head text-[1.15em] not-italic leading-none text-foreground/90">
            .РУ
          </i>
        </div>
      </div>
    </footer>
  );
};

export default Footer;