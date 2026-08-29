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
  ProfessionCityPage,
} from '@/data/professionCityPages';
import { people, User } from '@/lib/api';
import NotFound from '@/pages/NotFound';

const PRICE_ROWS: Record<string, { task: string; price: string }[]> = {
  handyman: [
    { task: 'Мелкая работа (полка, карниз, розетка)', price: 'от 400 до 900 ₽' },
    { task: 'Час работы мужа на час', price: 'от 700 до 1 200 ₽' },
    { task: 'Список из нескольких дел за визит', price: 'от 1 500 до 3 000 ₽' },
  ],
  electrician: [
    { task: 'Замена розетки или выключателя', price: 'от 400 до 800 ₽' },
    { task: 'Замена автомата в щитке', price: 'от 500 до 1 200 ₽' },
    { task: 'Установка люстры', price: 'от 600 до 1 500 ₽' },
    { task: 'Полная разводка проводки в квартире', price: 'от 15 000 ₽' },
  ],
  plumber: [
    { task: 'Замена смесителя', price: 'от 700 до 1 500 ₽' },
    { task: 'Установка унитаза', price: 'от 1 500 до 3 000 ₽' },
    { task: 'Устранение засора стояка', price: 'от 1 000 до 2 500 ₽' },
    { task: 'Замена батареи отопления', price: 'от 1 500 до 3 500 ₽' },
  ],
  mover: [
    { task: 'Переезд квартиры-студии', price: 'от 1 500 до 3 000 ₽' },
    { task: 'Переезд 1–2 комнат', price: 'от 2 500 до 5 000 ₽' },
    { task: 'Перенос пианино или сейфа', price: 'от 3 000 до 6 000 ₽' },
  ],
  furniture: [
    { task: 'Сборка шкафа', price: 'от 1 000 до 2 500 ₽' },
    { task: 'Сборка кухонного гарнитура', price: 'от 3 000 до 7 000 ₽' },
    { task: 'Сборка кровати', price: 'от 800 до 2 000 ₽' },
  ],
};

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
  const priceRows = PRICE_ROWS[page.professionSlug] || [];

  const canonical = `https://dodelay.ru/podrabotka/${page.citySlug}/${page.professionSlug}`;

  const faq = [
    {
      q: `Как быстро найти ${page.professionGenitive} в ${city.name}?`,
      a: `Разместите заявку бесплатно с описанием задачи — её увидят все, кто указал специальность «${page.professionLabel}» в ${city.name}. Либо откройте ленту заказов, если сами ищете такую подработку.`,
    },
    {
      q: `Сколько стоит вызвать ${page.professionGenitive} в ${city.name}?`,
      a: 'Точную сумму называет заказчик — ориентир по типовым работам есть в таблице выше. Комиссию с оплаты сервис не берёт.',
    },
    {
      q: `Можно ли заказать ${page.professionGenitive} без регистрации на сайте?`,
      a: 'Разместить задачу можно после входа через MAX — это заменяет обычную регистрацию и пароль. Публикация объявлений бесплатна.',
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
    provider: { '@id': 'https://dodelay.ru/#organization' },
    isPartOf: { '@id': 'https://dodelay.ru/#website' },
    url: canonical,
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
            <p className="mt-6 text-sm text-chip">Загружаем…</p>
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
              Сколько стоит {page.professionGenitive} в {city.name}
            </h2>
            <p className="mt-3 max-w-[620px] text-sm text-muted-foreground">
              Сумму всегда назначает заказчик — это лишь ориентир по типовым задачам, итоговую цену
              стороны согласуют напрямую.
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
                  {page.professionLabel} в {c.nameNominative}
                  <Icon name="ArrowRight" size={14} />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-16 max-w-[760px]">
          <p className="text-sm uppercase tracking-[0.2em] text-chip">Вопросы</p>
          <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
            Коротко о том, как найти {page.professionGenitive} в {city.name}
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
