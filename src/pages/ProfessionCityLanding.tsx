import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AppStateProvider, useAppState } from '@/hooks/use-app-state';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import LoginDialog from '@/components/LoginDialog';
import Breadcrumbs from '@/components/Breadcrumbs';
import Avatar from '@/components/Avatar';
import Icon from '@/components/ui/icon';
import useSeo from '@/hooks/use-seo';
import useLdJson from '@/hooks/use-ld-json';
import { getCityPage } from '@/data/cityPages';
import {
  getProfessionCityPage,
  getProfessionCityPagesBySlug,
  getProfessionsByCity,
  ProfessionCityPage,
} from '@/data/professionCityPages';
import { people } from '@/lib/api';
import type { User } from '@/lib/api';
import NotFound from '@/pages/PageNotFound';
import Loader from '@/components/Loader';
import ProfessionContent from '@/components/landing/ProfessionContent';
import RecentJobs from '@/components/landing/RecentJobs';


/** Дата последнего обновления страниц каталога */
const BUILD_DATE = '2026-09-05';

const cityMatch = (userCity: string, nameNominative: string) =>
  userCity.split(',')[0].trim().toLowerCase() === nameNominative.trim().toLowerCase();

const ProfessionCityLandingInner = ({ page }: { page: ProfessionCityPage }) => {
  const city = getCityPage(page.citySlug)!;
  const { openLogin } = useAppState();
  const [executors, setExecutors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    people({ professions: [page.professionSlug] })
      .then((r) => {
        if (!alive) return;
        const inCity = (r.executors || []).filter((u) => cityMatch(u.city, city.nameNominative));
        setExecutors(inCity.slice(0, 6));
      })
      .catch(() => undefined)
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [page.professionSlug, city.nameNominative]);

  const otherCities = getProfessionCityPagesBySlug(page.professionSlug).filter(
    (p) => p.citySlug !== page.citySlug,
  );
  // Профессии того же направления в этом городе — усиливают связность раздела
  const relatedProfessions = getProfessionsByCity(page.citySlug)
    .filter((p) => p.group === page.group && p.professionSlug !== page.professionSlug)
    .slice(0, 8);
  const priceRows = page.tasks || [];
  const priceNumbers = priceRows
    .map((r) => Number(r.price.replace(/\D/g, '')))
    .filter((n) => n > 0);
  const minPrice = priceNumbers.length ? Math.min(...priceNumbers) : undefined;
  const maxPrice = priceNumbers.length ? Math.max(...priceNumbers) : undefined;

  const canonical = `https://dodelay.ru/podrabotka/${page.citySlug}/${page.professionSlug}`;

  const firstTask = page.tasks[0]?.task || 'типовую работу';
  const firstPrice = page.tasks[0]?.price || 'от 500 ₽';
  const districtsList = city.districts.slice(0, 3).join(', ');

  // Вопросы собираются из данных профессии и города: у каждой из 300 страниц
  // свой набор формулировок, а не один шаблон на весь сайт.
  const faq = [
    {
      q: `Как быстро найти ${page.professionGenitive} в ${city.name}?`,
      a: `Разместите заявку бесплатно с описанием задачи — её увидят все, кто указал специальность «${page.professionLabel}» в ${city.name}. Первые отклики обычно приходят в день публикации. Либо откройте ленту заказов, если сами ищете такую подработку.`,
    },
    {
      q: `Сколько стоит вызвать ${page.professionGenitive} в ${city.name}?`,
      a: `Ориентир по типовым работам: «${firstTask}» — ${firstPrice}, полный список цен есть в таблице выше. Точную сумму заказчик и мастер согласуют между собой, комиссию с оплаты сервис не берёт.`,
    },
    {
      q: `Можно ли вызвать ${page.professionGenitive} срочно, в день обращения?`,
      a: `Да. Укажите в объявлении, что работа нужна сегодня — такие заявки исполнители разбирают быстрее всего. Срочный выезд обычно стоит немного дороже: мастер подстраивает под вас свой график.`,
    },
    {
      q: `Мастер приедет со своим инструментом?`,
      a: `У большинства частных исполнителей инструмент свой — это стоит уточнить в переписке до начала работ. Расходные материалы, как правило, покупает заказчик либо мастер с последующим возмещением.`,
    },
    {
      q: `В каких районах ${city.nameGenitive} работают исполнители?`,
      a: `По всему городу, включая ${districtsList}. Мастера чаще берут заказы рядом с домом, поэтому укажите район в объявлении — так исполнитель сразу поймёт, сколько ехать, и не станет закладывать дорогу в стоимость.`,
    },
    {
      q: `Можно ли заказать ${page.professionGenitive} без регистрации на сайте?`,
      a: 'Разместить задачу можно после входа через MAX — это заменяет обычную регистрацию и пароль, занимает меньше минуты. Публикация объявлений бесплатна, скрытых платежей нет.',
    },
    {
      q: `Что делать, если работа выполнена плохо?`,
      a: `Оплата идёт напрямую мастеру, поэтому принимайте работу до расчёта и проверяйте результат на месте. После завершения задания оставьте честный отзыв — рейтинг виден всем заказчикам и напрямую влияет на то, сколько заказов получит исполнитель.`,
    },
  ];

  useSeo({
    title: page.title,
    description: page.description,
    canonical,
  });

  useLdJson(`ld-pc-service-${page.citySlug}-${page.professionSlug}`, {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name: `${page.professionLabel} в ${city.name}`,
    description: page.description,
    areaServed: {
      '@type': 'City',
      name: city.nameNominative,
    },
    serviceType: page.professionLabel,
    category: page.group,
    provider: { '@id': 'https://dodelay.ru/#organization' },
    isPartOf: { '@id': 'https://dodelay.ru/#website' },
    url: canonical,
    // Прайс в разметке: Google может показать «от N ₽» прямо в сниппете
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'RUB',
      lowPrice: minPrice,
      highPrice: maxPrice,
      offerCount: priceRows.length,
      availability: 'https://schema.org/InStock',
      areaServed: { '@type': 'City', name: city.nameNominative },
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: `Услуги: ${page.professionLabel} в ${city.name}`,
      itemListElement: priceRows.map((r) => ({
        '@type': 'Offer',
        priceCurrency: 'RUB',
        price: Number(r.price.replace(/\D/g, '')) || undefined,
        priceSpecification: {
          '@type': 'PriceSpecification',
          priceCurrency: 'RUB',
          minPrice: Number(r.price.replace(/\D/g, '')) || undefined,
          valueAddedTaxIncluded: true,
        },
        itemOffered: { '@type': 'Service', name: r.task },
      })),
    },
  });

  useLdJson(`ld-pc-breadcrumbs-${page.citySlug}-${page.professionSlug}`, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${canonical}#breadcrumbs`,
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: 'https://dodelay.ru/' },
      { '@type': 'ListItem', position: 2, name: 'Подработка', item: 'https://dodelay.ru/#cities' },
      {
        '@type': 'ListItem',
        position: 3,
        name: city.nameNominative,
        item: `https://dodelay.ru/podrabotka/${city.slug}`,
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: page.professionLabel,
        item: canonical,
      },
    ],
  });

  // Дата обновления: поисковики показывают её в сниппете и учитывают свежесть
  useLdJson(`ld-pc-webpage-${page.citySlug}-${page.professionSlug}`, {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: page.title,
    description: page.description,
    inLanguage: 'ru-RU',
    isPartOf: { '@id': 'https://dodelay.ru/#website' },
    about: { '@id': `${canonical}#service` },
    primaryImageOfPage: 'https://dodelay.ru/img/og-cover.jpg',
    dateModified: BUILD_DATE,
    breadcrumb: { '@id': `${canonical}#breadcrumbs` },
  });

  useLdJson(`ld-pc-faq-${page.citySlug}-${page.professionSlug}`, {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonical}#faq`,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  });

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background font-body text-foreground">
      <Header />

      <main className="mx-auto max-w-[1400px] px-6 pb-24 pt-28 md:px-10 md:pt-32 lg:px-16 lg:pt-[150px]">
        <Breadcrumbs
          trail={[
            { label: 'Подработка', href: '/#cities' },
            { label: city.nameNominative, href: `/podrabotka/${city.slug}` },
          ]}
          current={page.professionLabel}
        />

        <h1 className="mt-6 max-w-[820px] font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          {page.h1}
        </h1>
        <p className="mt-5 max-w-[680px] text-base leading-relaxed text-muted-foreground">
          {page.intro}
        </p>

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

        <section className="mt-16">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Исполнители</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            {page.professionLabel} в {city.name}: кто уже на сервисе
          </h2>

          {loading ? (
            <Loader />
          ) : executors.length === 0 ? (
            <div className="mt-6 rounded-3xl border border-line bg-tile p-6 text-center sm:p-10">
              <p className="font-head text-lg">
                Пока никто не указал эту специальность в {city.name}
              </p>
              <p className="mt-2 text-sm text-chip">
                Станьте первым — заполните профиль исполнителя, и заказчики увидят вас в поиске.
              </p>
              <button
                onClick={() => openLogin('executor')}
                className="mt-4 min-h-[44px] rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/60 hover:text-primary"
              >
                Стать исполнителем
              </button>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {executors.map((u) => (
                <div
                  key={u.id}
                  className="rounded-3xl border border-line bg-surface p-4 transition-colors hover:border-primary/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={u.avatar} name={u.name} size={46} online={u.online} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{u.name}</p>
                      <p className="mt-0.5 text-xs text-chip">{u.city}</p>
                      <p className="mt-1 text-xs text-chip">
                        ★ {u.rating.toFixed(1)} · {u.reviewsCount} отзывов
                      </p>
                    </div>
                  </div>
                  {u.skill && (
                    <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{u.skill}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          <Link
            to="/dashboard"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Смотреть всех в разделе Люди
            <Icon name="ArrowRight" size={14} />
          </Link>
        </section>

        {priceRows.length > 0 && (
          <section className="mt-16">
            <p className="text-sm uppercase tracking-[0.2em] text-chip">Цены</p>
            <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
              Сколько стоят услуги {page.professionGenitive} в {city.name}
            </h2>
            <p className="mt-3 max-w-[620px] text-sm text-muted-foreground">
              Сумму всегда назначает заказчик — это лишь ориентир по типовым задачам, итоговую цену
              стороны согласуют напрямую.
            </p>
            <p className="mt-3 flex max-w-[620px] items-start gap-2.5 rounded-2xl border border-primary/40 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
              <Icon name="TrendingDown" size={16} className="mt-0.5 shrink-0 text-primary" />
              Цены ниже, чем на биржах услуг: мы не берём комиссию, поэтому исполнитель получает
              всю сумму, а вы платите меньше.
            </p>
            <div className="mt-6 overflow-hidden rounded-3xl border border-line">
              <table className="w-full text-left text-sm">
                <tbody>
                  {priceRows.map((r, i) => (
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
        )}

        <section className="mt-16">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Рядом</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Ещё варианты
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={`/podrabotka/${city.slug}`}
              className="flex items-center gap-2 rounded-full border border-line bg-tile px-5 py-3 text-sm font-medium transition-colors hover:border-primary/60"
            >
              Другие специальности в {city.name}
              <Icon name="ArrowRight" size={14} />
            </Link>
            {otherCities.map((p) => {
              const c = getCityPage(p.citySlug)!;
              return (
                <Link
                  key={p.citySlug}
                  to={`/podrabotka/${p.citySlug}/${p.professionSlug}`}
                  className="flex items-center gap-2 rounded-full border border-line bg-tile px-5 py-3 text-sm font-medium transition-colors hover:border-primary/60"
                >
                  {page.professionLabel} в {c.name}
                  <Icon name="ArrowRight" size={14} />
                </Link>
              );
            })}
          </div>

          {relatedProfessions.length > 0 && (
            <>
              <h3 className="mt-10 font-head text-lg font-medium">
                Похожие услуги в {city.name}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {relatedProfessions.map((p) => (
                  <Link
                    key={p.professionSlug}
                    to={`/podrabotka/${city.slug}/${p.professionSlug}`}
                    className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
                  >
                    <Icon name={p.icon} size={14} fallback="Wrench" />
                    {p.professionLabel}
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>

        <RecentJobs
          cityNominative={city.nameNominative}
          cityPrepositional={city.name}
          citySlug={city.slug}
          heading={`Свежие заказы в ${city.name}`}
        />

        <ProfessionContent page={page} city={city} />

        <section className="mt-16 max-w-[760px]">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Вопросы</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Частые вопросы: {page.professionLabel} в {city.name}
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

const ProfessionCityLanding = () => {
  const { citySlug, professionSlug } = useParams<{ citySlug: string; professionSlug: string }>();
  const page = getProfessionCityPage(professionSlug, citySlug);
  const city = getCityPage(citySlug);

  if (!page || !city) return <NotFound />;

  return (
    <AppStateProvider>
      <ProfessionCityLandingInner page={page} />
    </AppStateProvider>
  );
};

export default ProfessionCityLanding;