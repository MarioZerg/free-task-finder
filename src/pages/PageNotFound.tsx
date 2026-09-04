import { Link } from 'react-router-dom';
import useSeo from '@/hooks/use-seo';
import Icon from '@/components/ui/icon';
import { CITY_PAGES } from '@/data/cityPages';

/** Страница 404. Закрыта от индексации: несуществующие адреса
 *  не должны попадать в выдачу и разбавлять качество сайта. */
const PageNotFound = () => {
  useSeo({
    title: 'Страница не найдена — Доделай.ру',
    description: 'Такой страницы нет. Вернитесь на главную или выберите свой город.',
    canonical: 'https://dodelay.ru/',
    robots: 'noindex, follow',
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6 py-16">
      <div className="w-full max-w-[520px] text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
          <Icon name="Compass" size={30} />
        </span>

        <h1 className="mt-6 font-head text-3xl font-normal tracking-tight md:text-4xl">
          Такой страницы нет
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Возможно, ссылка устарела или в адресе опечатка. Загляните в ленту заказов или
          выберите свой город.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="flex min-h-[48px] items-center gap-2 rounded-full bg-primary px-7 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            На главную
            <Icon name="ArrowRight" size={17} />
          </Link>
          <Link
            to="/dashboard"
            className="flex min-h-[48px] items-center rounded-full border border-line bg-surface px-7 text-base font-medium transition-colors hover:border-primary"
          >
            Лента заказов
          </Link>
        </div>

        <p className="mt-10 text-sm text-chip">Подработка по городам области</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {CITY_PAGES.map((c) => (
            <Link
              key={c.slug}
              to={`/podrabotka/${c.slug}`}
              className="rounded-full border border-line bg-tile px-4 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            >
              {c.nameNominative}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PageNotFound;
