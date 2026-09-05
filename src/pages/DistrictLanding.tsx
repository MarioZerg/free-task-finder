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
import { getCityPage, pluralJobs } from '@/data/cityPages';
import {
  countOpenJobsInDistrict,
  getDistrictPage,
  getDistrictPagesByCity,
  DistrictPage,
} from '@/data/districtPages';
import NotFound from '@/pages/PageNotFound';
import { PROFESSIONS } from '@/data/professionsCatalog';
import DistrictContent from '@/components/landing/DistrictContent';
import RecentJobs from '@/components/landing/RecentJobs';
import { pick, FREE_ANSWERS, LOGIN_ANSWERS, TRUST_ANSWERS } from '@/data/faqVariants';

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

const DistrictLandingInner = ({ district }: { district: DistrictPage }) => {
  const city = getCityPage(district.citySlug)!;
  const { openLogin, feed } = useAppState();
  const openCount = countOpenJobsInDistrict(feed, district.label);
  const otherDistricts = getDistrictPagesByCity(district.citySlug).filter(
    (d) => d.slug !== district.slug,
  );

  const canonical = `https://dodelay.ru/podrabotka/${city.slug}/rayon/${district.slug}`;

  // Вопросы опираются на фактуру самого района — микрорайоны, застройку,
  // востребованные специальности, — поэтому у шести страниц разные ответы.
  const topLabels = district.topProfessions
    .map((s) => PROFESSIONS.find((p) => p.slug === s)?.label)
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');

  // Свой сдвиг у каждого района: соседние районы одного города не должны
  // получить одинаковые формулировки общих ответов.
  const seed =
    district.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0) + 2;

  const faq = [
    {
      q: `Как найти подработку в ${district.name}?`,
      a: `Войдите через MAX, выберите роль исполнителя и откройте ленту заказов — там видны все активные задачи по городу, в том числе в ${district.name}. Откликайтесь на подходящие: заказчик увидит вашу анкету с рейтингом и отзывами.`,
    },
    {
      q: `Сколько стоит шабашка в ${district.name}?`,
      a: 'Сумму указывает заказчик — в таблице выше приведён ориентир по типовым задачам района. Комиссию с оплаты сервис не берёт, расчёт идёт напрямую между заказчиком и исполнителем.',
    },
    {
      q: `Каких мастеров чаще всего ищут в ${district.name}?`,
      a: `Чаще остальных здесь заказывают: ${topLabels}. Набор задач напрямую связан с характером застройки. ${district.housing}`,
    },
    {
      q: `Какие микрорайоны входят в ${district.nameNominative}?`,
      a: `${district.areas.join(', ')}. В объявлении лучше писать привычное местное название, а не только официальное имя района — так исполнителю сразу понятно, куда ехать.`,
    },
    {
      q: `Приедет ли мастер из другого района ${city.nameGenitive}?`,
      a: `Обычно да, но многое зависит от дороги. ${district.logistics.split('.')[0]}. Поэтому исполнители рядом откликаются охотнее — укажите точный адрес, чтобы мастер сразу оценил маршрут.`,
    },
    {
      q: 'Нужно ли платить за доступ к заказам?',
      a: pick(FREE_ANSWERS, seed),
    },
    {
      q: 'Можно разместить задачу без регистрации на сайте?',
      a: pick(LOGIN_ANSWERS, seed),
    },
    {
      q: 'Как понять, что исполнителю можно доверять?',
      a: pick(TRUST_ANSWERS, seed),
    },
  ];

  useSeo({
    title: district.title,
    description: district.description,
    canonical,
  });

  useLdJson(`ld-district-${district.slug}`, {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${canonical}#service`,
    name: `Шабашка и подработка в ${district.nameNominative}`,
    description: district.description,
    areaServed: {
      '@type': 'Place',
      name: district.nameNominative,
      containedInPlace: { '@type': 'City', name: 'Ярославль' },
    },
    provider: { '@id': 'https://dodelay.ru/#organization' },
    isPartOf: { '@id': 'https://dodelay.ru/#website' },
    url: canonical,
    ...(openCount > 0
      ? { offers: { '@type': 'Offer', availability: 'https://schema.org/InStock', eligibleQuantity: openCount } }
      : {}),
  });

  useLdJson(`ld-district-breadcrumbs-${district.slug}`, {
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
        name: district.nameNominative,
        item: canonical,
      },
    ],
  });

  // Дата обновления: поисковики учитывают свежесть и показывают её в сниппете
  useLdJson(`ld-district-webpage-${district.slug}`, {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${canonical}#webpage`,
    url: canonical,
    name: district.title,
    description: district.description,
    inLanguage: 'ru-RU',
    isPartOf: { '@id': 'https://dodelay.ru/#website' },
    about: { '@id': `${canonical}#service` },
    breadcrumb: { '@id': `${canonical}#breadcrumbs` },
    dateModified: '2026-09-05',
  });

  useLdJson(`ld-district-faq-${district.slug}`, {
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
          current={district.nameNominative}
        />

        <h1 className="mt-6 max-w-[820px] font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          {district.h1}
        </h1>
        <p className="mt-5 max-w-[680px] text-base leading-relaxed text-muted-foreground">
          {district.intro}
        </p>

        {openCount > 0 ? (
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-line bg-tile px-4 py-2 text-sm text-foreground">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
            </span>
            Сейчас в {district.name}: {openCount} {pluralJobs(openCount)}
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

        <section className="mt-16">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Задачи</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Какие задачи чаще всего заказывают в {district.name}
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
            Ориентировочные цены в {district.name}
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

        <RecentJobs
          cityNominative={city.nameNominative}
          cityPrepositional={city.name}
          citySlug={city.slug}
          heading={`Свежие заказы в ${city.name}`}
          seed={seed}
          compact
        />

        <DistrictContent district={district} city={city} />

        <section className="mt-16">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Рядом</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Другие районы {city.nameGenitive}
          </h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {otherDistricts.map((d) => (
              <Link
                key={d.slug}
                to={`/podrabotka/${city.slug}/rayon/${d.slug}`}
                className="flex items-center gap-2 rounded-full border border-line bg-tile px-5 py-3 text-sm font-medium transition-colors hover:border-primary/60"
              >
                {d.nameNominative}
                <Icon name="ArrowRight" size={14} />
              </Link>
            ))}
            <Link
              to={`/podrabotka/${city.slug}`}
              className="flex items-center gap-2 rounded-full border border-line px-5 py-3 text-sm font-medium text-chip transition-colors hover:border-primary/60"
            >
              Все районы Ярославля
            </Link>
          </div>
        </section>

        <section className="mt-16 max-w-[760px]">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Вопросы</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Коротко о подработке в {district.name}
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

const DistrictLanding = () => {
  const { citySlug, districtSlug } = useParams<{ citySlug: string; districtSlug: string }>();
  const district = getDistrictPage(citySlug, districtSlug);

  if (!district) return <NotFound />;

  return (
    <AppStateProvider>
      <DistrictLandingInner district={district} />
    </AppStateProvider>
  );
};

export default DistrictLanding;