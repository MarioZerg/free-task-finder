import { useParams, Link } from 'react-router-dom';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginDialog from '@/components/LoginDialog';
import Breadcrumbs from '@/components/Breadcrumbs';
import Icon from '@/components/ui/icon';
import useSeo from '@/hooks/use-seo';
import useLdJson from '@/hooks/use-ld-json';
import { CATEGORY_META } from '@/data/categories';
import { countOpenJobsInCity, getCityPage, getCityPagesBySlug, pluralJobs } from '@/data/cityPages';
import { professionsByGroup, PROFESSIONS } from '@/data/professionsCatalog';
import { getDistrictPagesByCity } from '@/data/districtPages';
import NotFound from '@/pages/PageNotFound';
import CityContent from '@/components/landing/CityContent';
import RecentJobs from '@/components/landing/RecentJobs';

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

const CityLandingInner = ({ slug }: { slug: string }) => {
  const city = getCityPage(slug)!;
  const { openLogin, feed } = useAppState();
  const nearby = getCityPagesBySlug(city.nearbyCities);
  const openCount = countOpenJobsInCity(feed, city.nameNominative);
  const districtPages = getDistrictPagesByCity(city.slug);

  // Вопросы строятся из данных города — районы, соседи, население,
  // поэтому у шести городов получаются разные наборы формулировок.
  const faq = [
    {
      q: `Как найти подработку в ${city.name}?`,
      a: `Войдите через MAX, выберите роль исполнителя и откройте ленту заказов — там видны все активные задачи города${city.districts.length ? ' с разбивкой по районам' : ''}. Откликайтесь на подходящие: заказчик увидит вашу анкету с рейтингом и отзывами.`,
    },
    {
      q: `Сколько стоит шабашка в ${city.name}?`,
      a: 'Сумму указывает заказчик — в таблице выше приведён ориентир по типовым задачам. Комиссию с оплаты сервис не берёт, расчёт идёт напрямую между заказчиком и исполнителем.',
    },
    {
      q: `Есть ли подработка в ${city.name} без опыта?`,
      a: 'Да. Погрузка, уборка территории, помощь по хозяйству и курьерские задачи не требуют квалификации — достаточно прийти вовремя и аккуратно сделать работу. С первыми отзывами открываются более дорогие профильные заказы.',
    },
    {
      q: 'Можно ли работать по выходным или вечерам?',
      a: 'Да, график полностью свободный. Вы сами решаете, какие задачи брать и в какие дни выходить — многие совмещают разовые заказы с основной работой.',
    },
    {
      q: `Как часто появляются новые заказы в ${city.name}?`,
      a: `Лента обновляется в течение дня, спрос зависит от сезона: летом больше загородных работ, зимой — уборки снега и задач внутри помещений. Переезды, уборка и сборка мебели идут круглый год.`,
    },
    {
      q: 'Нужно ли платить за доступ к заказам?',
      a: 'Нет. Сервис бесплатный и для заказчиков, и для исполнителей: ни абонентской платы, ни комиссии с заказа. Если кто-то просит взнос за регистрацию или доступ к заявкам — это мошенник.',
    },
    {
      q: 'Можно разместить задачу без регистрации на сайте?',
      a: 'Вход только через мессенджер MAX — это заменяет и регистрацию, и пароль, занимает меньше минуты. Публикация объявлений бесплатна.',
    },
    {
      q: `Работает ли сервис в пригороде ${city.nameGenitive}?`,
      a: `Да, объявления публикуют и из пригорода, и из соседних населённых пунктов${nearby.length ? `: многие исполнители берут заказы также в ${nearby.map((n) => n.name).join(', ')}` : ''}. Укажите точный адрес в задаче — так исполнитель сразу оценит дорогу.`,
    },
  ];

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
    ...(openCount > 0 ? { offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', eligibleQuantity: openCount } } : {}),
  });

  // Каталог специальностей города — Google строит из него расширенный сниппет
  useLdJson(`ld-city-catalog-${city.slug}`, {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `https://dodelay.ru/podrabotka/${city.slug}#services`,
    name: `Специальности в ${city.nameNominative}`,
    numberOfItems: PROFESSIONS.length,
    itemListElement: PROFESSIONS.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: `${p.label} в ${city.name}`,
      url: `https://dodelay.ru/podrabotka/${city.slug}/${p.slug}`,
    })),
  });

  useLdJson(`ld-city-breadcrumbs-${city.slug}`, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `https://dodelay.ru/podrabotka/${city.slug}#breadcrumbs`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://dodelay.ru/' },
      { '@type': 'ListItem', position: 2, name: 'Подработка', item: 'https://dodelay.ru/#cities' },
      {
        '@type': 'ListItem',
        position: 3,
        name: city.nameNominative,
        item: `https://dodelay.ru/podrabotka/${city.slug}`,
      },
    ],
  });

  useLdJson(`ld-city-faq-${city.slug}`, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `https://dodelay.ru/podrabotka/${city.slug}#faq`,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });

  // Свежие заказы города в разметке: даёт поисковику сигнал, что страница
  // регулярно обновляется, и позволяет показать задачи прямо в выдаче.
  const recent = feed
    .filter(
      (j) =>
        j.city.split(',')[0].trim().toLowerCase() ===
        city.nameNominative.trim().toLowerCase(),
    )
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 6);

  useLdJson(`ld-city-jobs-${city.slug}`, {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `https://dodelay.ru/podrabotka/${city.slug}#jobs`,
    name: `Последние заказы в ${city.name}`,
    numberOfItems: recent.length,
    itemListElement: recent.map((j, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'Offer',
        name: j.title,
        description: j.description || j.title,
        areaServed: { '@type': 'City', name: city.nameNominative },
        ...(j.price > 0
          ? { price: j.price, priceCurrency: 'RUB' }
          : {}),
        availability: 'https://schema.org/InStock',
        validFrom: new Date(j.createdAt).toISOString().slice(0, 10),
      },
    })),
  });

  // Дата обновления: поисковики учитывают свежесть и показывают её в сниппете
  useLdJson(`ld-city-webpage-${city.slug}`, {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `https://dodelay.ru/podrabotka/${city.slug}#webpage`,
    url: `https://dodelay.ru/podrabotka/${city.slug}`,
    name: city.title,
    description: city.description,
    inLanguage: 'ru-RU',
    isPartOf: { '@id': 'https://dodelay.ru/#website' },
    about: { '@id': `https://dodelay.ru/podrabotka/${city.slug}#service` },
    primaryImageOfPage: `https://dodelay.ru${city.image}`,
    breadcrumb: { '@id': `https://dodelay.ru/podrabotka/${city.slug}#breadcrumbs` },
    dateModified: '2026-09-05',
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

        {openCount > 0 ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-tile px-4 py-2 text-sm text-foreground">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Сейчас в ленте: {openCount} {pluralJobs(openCount)}
          </p>
        ) : (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-sm text-chip">
            Заказов пока нет — станьте первым, кто разместит задачу
            <button
              onClick={() => openLogin('customer')}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Разместить задачу
            </button>
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
              {city.districts.map((d) => {
                const districtPage = districtPages.find((dp) => dp.label === d);
                return districtPage ? (
                  <Link
                    key={d}
                    to={`/podrabotka/${city.slug}/rayon/${districtPage.slug}`}
                    className="rounded-full border border-line bg-tile px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
                  >
                    {d}
                  </Link>
                ) : (
                  <span
                    key={d}
                    className="rounded-full border border-line bg-tile px-4 py-2.5 text-sm text-muted-foreground"
                  >
                    {d}
                  </span>
                );
              })}
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
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Специалисты</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Все специальности в {city.name}
          </h2>
          <p className="mt-3 max-w-[620px] text-sm text-muted-foreground">
            По каждой профессии — отдельная страница с анкетами исполнителей и ориентиром по
            ценам в {city.name}.
          </p>
          <div className="mt-8 flex flex-col gap-8">
            {professionsByGroup().map((g) => (
              <div key={g.group}>
                <h3 className="text-sm font-medium text-muted-foreground">{g.group}</h3>
                <div className="mt-3 flex flex-wrap gap-2.5">
                  {g.items.map((p) => (
                    <Link
                      key={p.slug}
                      to={`/podrabotka/${city.slug}/${p.slug}`}
                      className="group flex items-center gap-2 rounded-full border border-line bg-tile px-4 py-2.5 text-sm transition-colors hover:border-primary/60"
                    >
                      <Icon name={p.icon} size={15} fallback="Wrench" className="text-primary" />
                      {p.label}
                      <Icon
                        name="ArrowRight"
                        size={12}
                        className="text-chip transition-transform group-hover:translate-x-0.5"
                      />
                    </Link>
                  ))}
                </div>
              </div>
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
                  Подработка в {n.name}
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

        <RecentJobs
          cityNominative={city.nameNominative}
          cityPrepositional={city.name}
          citySlug={city.slug}
        />

        <CityContent city={city} />

        <section className="mt-16 max-w-[760px]">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Вопросы</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Частые вопросы о подработке в {city.name}
          </h2>
          <div className="mt-6 space-y-4">
            {faq.map((f) => (
              <div key={f.q} className="rounded-3xl border border-line bg-surface p-6">
                <h3 className="font-head text-base font-medium">{f.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              </div>
            ))}
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