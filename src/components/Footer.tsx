import { Link, useLocation } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import InstallPwa from '@/components/InstallPwa';
import { CITY_PAGES } from '@/data/cityPages';

const Footer = () => {
  const { openLogin } = useAppState();
  const { pathname } = useLocation();
  const onHome = pathname === '/';
  const prefix = onHome ? '' : '/';

  return (
    <footer className="overflow-hidden bg-tile pt-20 md:pt-28">
      <div className="safe-x safe-bottom mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <div className="grid gap-10 border-b border-line pb-16 md:grid-cols-2 md:items-end">
          <h2 className="font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
            Задача есть — руки найдутся.
          </h2>
          <div className="flex flex-wrap gap-3 md:justify-end">
            <button
              onClick={() => openLogin('customer')}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03] sm:w-auto"
            >
              Я заказчик
              <Icon name="ArrowRight" size={18} />
            </button>
            <button
              onClick={() => openLogin('executor')}
              className="w-full rounded-full border border-line bg-surface px-7 py-4 text-base font-medium transition-colors hover:border-primary sm:w-auto"
            >
              Я исполнитель
            </button>
          </div>
        </div>

        <div className="border-b border-line py-10">
          <h3 className="font-head text-base font-medium">
            Доделай.ру — шабашка в городах Ярославской области
          </h3>
          <p className="mt-3 max-w-[860px] break-words text-sm text-chip">
            Подработка и разовые заказы: Ярославль (Кировский, Заволжский, Дзержинский, Фрунзенский,
            Ленинский, Красноперекопский районы), Рыбинск, Тутаев, Переславль-Залесский, Углич,
            Ростов Великий, Гаврилов-Ям, Данилов, Пошехонье, Мышкин, Некрасовское.
          </p>
        </div>

        <div className="border-b border-line py-10">
          <h3 className="font-head text-base font-medium">Города</h3>
          <nav className="mt-4 flex flex-wrap gap-x-6 gap-y-3 text-sm text-chip">
            {CITY_PAGES.map((c) => (
              <Link key={c.slug} to={`/podrabotka/${c.slug}`} className="story-link">
                Подработка в {c.nameNominative}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-b border-line py-10">
          <p className="flex max-w-[860px] items-start gap-3 text-sm text-muted-foreground">
            <Icon name="ShieldAlert" size={18} className="mt-0.5 shrink-0 text-primary" />
            Сервис бесплатный и является только доской объявлений. Он не участвует в расчётах и не
            проверяет исполнителей: всю ответственность за условия, оплату, качество и безопасность
            работ несут заказчики и исполнители самостоятельно.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-6 py-10 text-sm text-chip">
          <p>Бесплатный сервис поиска подработки в Ярославской области. Вход через MAX.</p>
          <nav className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <a href={`${prefix}#roles`} className="story-link">Роли</a>
            <a href={`${prefix}#how`} className="story-link">Как это работает</a>
            <Link to="/privacy" className="story-link">Конфиденциальность</Link>
            <Link to="/terms" className="story-link">Условия (оферта)</Link>
            <Link to="/contacts" className="story-link">Контакты</Link>
            <InstallPwa variant="link" />
            <a href={onHome ? '#top' : '/'} className="story-link">Наверх</a>
          </nav>
        </div>

        <div className="border-t border-line/60 pt-6">
          <p className="text-xs leading-relaxed text-chip/70">
            Проект ведёт команда Доделай.ру, Ярославль · ИНН 760218194200 · ОГРНИП 322774600341432
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-chip/70">
            Информация на сайте обновлена <time dateTime="2026-08-29">29 августа 2026</time>
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-chip/70">
            Оплата подписки Доделай PRO принимается через интернет-эквайринг Точка Банк:
            банковской картой или по СБП. Платёж проходит на защищённой странице банка.
          </p>
          <a
            href="https://webmaster.yandex.ru/siteinfo/?site=https://dodelay.ru"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-block opacity-70 transition-opacity hover:opacity-100"
            aria-label="Индекс качества сайта в Яндекс Вебмастере"
          >
            <img
              width="88"
              height="31"
              alt="Индекс качества сайта"
              loading="lazy"
              className="rounded-lg"
              src="https://yandex.ru/cycounter?https://dodelay.ru&theme=light&lang=ru"
            />
          </a>
        </div>

        <div className="pointer-events-none mt-6 flex select-none items-end justify-between pb-10 md:pb-14">
          <b className="wordmark-fill block pt-[0.12em] font-head font-bold leading-[1.02] text-primary/25">
            ДОДЕЛАЙ
          </b>
          <i className="mb-[0.15em] font-head text-[1.15em] not-italic leading-none text-primary/25">
            .РУ
          </i>
        </div>
      </div>
    </footer>
  );
};

export default Footer;