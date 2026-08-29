import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginDialog from '@/components/LoginDialog';
import Breadcrumbs from '@/components/Breadcrumbs';
import Icon from '@/components/ui/icon';
import useSeo from '@/hooks/use-seo';
import { CATEGORY_META } from '@/data/categories';
import { getCityPage, getCityPagesBySlug } from '@/data/cityPages';
import NotFound from '@/pages/NotFound';

const TASK_HINTS: Record<string, string> = {
  move: 'Переезды, погрузка и разгрузка — самый частый запрос',
  repair: 'Сборка мебели, мелкий ремонт, повесить полку или карниз',
  clean: 'Уборка после ремонта, генеральная уборка квартиры',
  garden: 'Работы на участке: покос травы, грядки, уборка территории',
  other: 'Разовые бытовые задачи, которые не подходят под другие категории',
};

const PRICE_ROWS = [
  { task: 'Помощь при переезде (2–4 часа)', price: 'от 1 000 до 2 500 ₽' },
  { task: 'Сборка мебели', price: 'от 800 до 2 000 ₽' },
  { task: 'Уборка после ремонта', price: 'от 1 500 до 3 500 ₽' },
  { task: 'Работы на участке', price: 'от 900 до 2 500 ₽' },
  { task: 'Мелкий ремонт и разное', price: 'от 500 до 1 500 ₽' },
];

const useLdJson = (id: string, data: Record<string, unknown>) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = id;
    script.text = JSON.stringify(data);
    document.head.appendChild(script);
    return () => {
      document.getElementById(id)?.remove();
    };
  }, [id, JSON.stringify(data)]);
};

const CityLandingInner = ({ slug }: { slug: string }) => {
  const city = getCityPage(slug)!;
  const { openLogin } = useAppState();
  const nearby = getCityPagesBySlug(city.nearbyCities);

  useSeo({
    title: city.title,
    description: city.description,
    canonical: `https://dodelay.ru/podrabotka/${city.slug}`,
  });

  useLdJson(`ld-city-${city.slug}`, {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `https://dodelay.ru/podrabotka/${city.slug}#service`,
    name: `Шабашка и подработка в ${city.nameNominative}`,
    description: city.description,
    areaServed: {
      '@type': 'City',
      name: city.nameNominative,
    },
    provider: { '@id': 'https://dodelay.ru/#organization' },
    isPartOf: { '@id': 'https://dodelay.ru/#website' },
    url: `https://dodelay.ru/podrabotka/${city.slug}`,
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-body text-foreground">
      <Header />

      <main className="mx-auto max-w-[1400px] px-6 pb-24 pt-28 md:px-10 md:pt-32 lg:px-16 lg:pt-[150px]">
        <Breadcrumbs
          trail={[{ label: 'Подработка', href: '/#cities' }]}
          current={city.nameNominative}
        />

        <h1 className="mt-6 max-w-[820px] font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          {city.h1}
        </h1>
        <p className="mt-5 max-w-[680px] text-base leading-relaxed text-muted-foreground">
          {city.intro}
        </p>
        {city.population && (
          <p className="mt-3 flex items-center gap-2 text-sm text-chip">
            <Icon name="Users" size={16} />
            Население {city.population}
          </p>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/dashboard"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-primary px-7 py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            Открыть ленту заказов
            <Icon name="ArrowRight" size={18} />
          </Link>
          <button
            onClick={() => openLogin('customer')}
            className="min-h-[44px] rounded-full border border-line bg-surface px-7 py-4 text-base font-medium transition-colors hover:border-primary"
          >
            Разместить задачу
          </button>
        </div>

        {city.districts.length > 0 && (
          <section className="mt-14">
            <p className="text-sm uppercase tracking-[0.2em] text-chip">Районы</p>
            <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
              Районы города
            </h2>
            <div className="mt-6 flex flex-wrap gap-2.5">
              {city.districts.map((d) => (
                <span
                  key={d}
                  className="rounded-full border border-line bg-tile px-4 py-2.5 text-sm text-muted-foreground"
                >
                  {d}
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="mt-16">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Задачи</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Какие задачи чаще всего заказывают в {city.name}
          </h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {CATEGORY_META.map((c) => (
              <article key={c.id} className="rounded-3xl border border-line bg-tile p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon name={c.icon} size={20} />
                </span>
                <h3 className="mt-4 font-head text-base font-medium">{c.label}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {TASK_HINTS[c.id]}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-16">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Цены</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Ориентировочные цены в {city.name}
          </h2>
          <p className="mt-3 max-w-[620px] text-sm text-muted-foreground">
            Сумму всегда назначает заказчик — это лишь ориентир по типовым задачам, итоговую цену
            стороны согласуют напрямую.
          </p>
          <div className="mt-6 overflow-hidden rounded-3xl border border-line">
            <table className="w-full text-left text-sm">
              <tbody>
                {PRICE_ROWS.map((r, i) => (
                  <tr key={r.task} className={i % 2 ? 'bg-tile' : 'bg-surface'}>
                    <td className="px-5 py-4 text-muted-foreground">{r.task}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-head font-medium">
                      {r.price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {nearby.length > 0 && (
          <section className="mt-16">
            <p className="text-sm uppercase tracking-[0.2em] text-chip">Рядом</p>
            <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
              Соседние города
            </h2>
            <div className="mt-6 flex flex-wrap gap-3">
              {nearby.map((n) => (
                <Link
                  key={n.slug}
                  to={`/podrabotka/${n.slug}`}
                  className="flex items-center gap-2 rounded-full border border-line bg-tile px-5 py-3 text-sm font-medium transition-colors hover:border-primary/60"
                >
                  Подработка в {n.nameNominative}
                  <Icon name="ArrowRight" size={14} />
                </Link>
              ))}
              <a
                href="/#cities"
                className="flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-medium text-chip transition-colors hover:border-primary/60"
              >
                Все города
              </a>
            </div>
          </section>
        )}

        <section className="mt-16 max-w-[760px]">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Вопросы</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Коротко о подработке в {city.name}
          </h2>
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl border border-line bg-surface p-6">
              <h3 className="font-head text-base font-medium">
                Как найти подработку в {city.name}?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Войдите через MAX, выберите роль исполнителя и откройте ленту заказов — там видны
                все активные задачи города{city.districts.length ? ' с разбивкой по районам' : ''}.
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-surface p-6">
              <h3 className="font-head text-base font-medium">
                Сколько стоит шабашка в {city.name}?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Сумму указывает заказчик — в таблице выше приведён ориентир по типовым задачам.
                Комиссию с оплаты сервис не берёт.
              </p>
            </div>
            <div className="rounded-3xl border border-line bg-surface p-6">
              <h3 className="font-head text-base font-medium">
                Можно разместить задачу без регистрации на сайте?
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Вход только через мессенджер MAX — это заменяет и регистрацию, и пароль. Публикация
                объявлений бесплатна.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <LoginDialog />
    </div>
  );
};

const CityLanding = () => {
  const { slug } = useParams<{ slug: string }>();
  const city = getCityPage(slug);

  if (!city) return <NotFound />;

  return (
    <AppStateProvider>
      <CityLandingInner slug={city.slug} />
    </AppStateProvider>
  );
};

export default CityLanding;