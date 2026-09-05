import { PROFESSIONS } from '@/data/professionsCatalog';
import type { ProfessionEntry } from '@/data/professionsCatalog';
import { CITY_PAGES } from '@/data/cityPages';

export interface ProfessionMeta {
  slug: string;
  label: string;
  genitive: string;
  icon: string;
}

/** Профессии, вынесенные на главную и в блоки перелинковки */
export const FEATURED_PROFESSIONS: ProfessionMeta[] = [
  'handyman',
  'electrician',
  'plumber',
  'mover',
  'furniture',
  'cleaner',
  'tiler',
  'welder',
]
  .map((slug) => PROFESSIONS.find((p) => p.slug === slug))
  .filter((p): p is ProfessionEntry => !!p)
  .map((p) => ({ slug: p.slug, label: p.label, genitive: p.genitive, icon: p.icon }));

export interface ProfessionCityPage {
  professionSlug: string;
  citySlug: string;
  professionLabel: string;
  professionGenitive: string;
  icon: string;
  group: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
  tasks: { task: string; price: string }[];
  /** Синонимы услуги — выводим в тексте, чтобы страницу находили
   *  и по второму названию («клининг» вместо «уборка»). */
  synonyms?: string[];
}

/** Заголовок и описание чередуем по городу, чтобы страницы не были
 *  шаблонными копиями друг друга — иначе поисковики склеивают их между собой. */
const titleFor = (p: ProfessionEntry, cityPrep: string, i: number): string => {
  // Основной синоним — второе название услуги, по которому её тоже ищут
  // («клининг» для уборки). Ставим в заголовок: без него страница не
  // показывается по целому пласту запросов.
  const syn = p.synonyms?.[0];
  const variants = [
    ...(syn
      ? [
          `${p.label} в ${cityPrep} — ${syn} и услуги мастеров | Доделай.ру`,
          `${syn.charAt(0).toUpperCase() + syn.slice(1)} в ${cityPrep}: цены и исполнители — Доделай.ру`,
        ]
      : []),
    `${p.label} в ${cityPrep} — вызвать мастера недорого | Доделай.ру`,
    `${p.label} в ${cityPrep}: цены и мастера рядом — Доделай.ру`,
    `Найти ${p.genitive} в ${cityPrep} — частные мастера | Доделай.ру`,
    `${p.label} в ${cityPrep} — услуги мастера на дом | Доделай.ру`,
    `${p.label} в ${cityPrep}: заказать частного мастера — Доделай.ру`,
    `Услуги ${p.genitive} в ${cityPrep} — цены 2026 | Доделай.ру`,
  ];
  return variants[i % variants.length];
};

const descriptionFor = (p: ProfessionEntry, cityPrep: string, i: number): string => {
  // Для описания берём цену обычной работы, а не расценку за квадратный метр:
  // «уборка от 45 ₽» вводит в заблуждение — это стоимость одного м².
  // Отсеиваем только расценки ЗА единицу («Поклейка обоев, м²»), но не
  // задачи, где площадь — часть названия («Квартира 50 м² генеральная»).
  const isUnitRate = (task: string) => /,\s*(м²|пог\.?\s?м|шт\.|час)\s*$/i.test(task);
  const priceTask = p.tasks.find((t) => !isUnitRate(t.task)) || p.tasks[p.tasks.length - 1];
  const first = priceTask?.price.replace('от ', '') || '500 ₽';
  const syn = p.synonyms?.[0];
  const variants = [
    ...(syn
      ? [
          `${p.label} и ${syn} в ${cityPrep}: частные мастера, цены от ${first}. Разместите заявку бесплатно — исполнители откликнутся сами, комиссию сервис не берёт.`,
        ]
      : []),
    `${p.label} в ${cityPrep}: разместите заявку бесплатно — мастера откликнутся сами. Цены от ${first}, оплата напрямую без комиссии сервиса.`,
    `${p.label} в ${cityPrep}: частные мастера с рейтингом и отзывами. Опишите задачу за минуту, услуги от ${first}. Комиссию не берём.`,
    `Вызвать ${p.genitive} в ${cityPrep} — быстро и без посредников. Работы от ${first}, вы сами выбираете исполнителя и договариваетесь о цене.`,
    `Ищете ${p.genitive} в ${cityPrep}? Смотрите анкеты мастеров рядом с домом. Стоимость работ от ${first}, оплата напрямую исполнителю.`,
    `${p.label} в ${cityPrep} — разовые заказы и срочный выезд. Разместите задачу бесплатно, цены начинаются от ${first}.`,
    `Услуги ${p.genitive} в ${cityPrep}: цены от ${first}, проверенные исполнители, отклики в день размещения. Сервис бесплатный.`,
  ];
  return variants[i % variants.length];
};

const h1For = (p: ProfessionEntry, cityPrep: string, i: number): string => {
  const variants = [
    `${p.label} в ${cityPrep}`,
    `${p.label} в ${cityPrep} — цены и мастера`,
    `Найти ${p.genitive} в ${cityPrep}`,
  ];
  return variants[i % variants.length];
};

/** Страницы «профессия × город» собираются из каталога:
 *  48 профессий × 6 городов. Каждая получает свой вариант заголовка,
 *  описания и h1 — за счёт сдвига по индексу города и профессии. */
export const PROFESSION_CITY_PAGES: ProfessionCityPage[] = CITY_PAGES.flatMap(
  (city, cityIndex) =>
    PROFESSIONS.map((p, profIndex) => {
      const shift = cityIndex + profIndex;
      return {
        professionSlug: p.slug,
        citySlug: city.slug,
        professionLabel: p.label,
        professionGenitive: p.genitive,
        icon: p.icon,
        group: p.group,
        title: titleFor(p, city.name, shift),
        description: descriptionFor(p, city.name, shift),
        h1: h1For(p, city.name, shift),
        intro: p.intro.replace('{city}', city.name),
        tasks: p.tasks,
        synonyms: p.synonyms,
      };
    }),
);

export const getProfessionCityPage = (
  professionSlug?: string,
  citySlug?: string,
): ProfessionCityPage | undefined =>
  PROFESSION_CITY_PAGES.find(
    (p) => p.professionSlug === professionSlug && p.citySlug === citySlug,
  );

export const getProfessionCityPagesBySlug = (professionSlug: string): ProfessionCityPage[] =>
  PROFESSION_CITY_PAGES.filter((p) => p.professionSlug === professionSlug);

/** Профессии одного города — для блока перелинковки на странице города */
export const getProfessionsByCity = (citySlug: string): ProfessionCityPage[] =>
  PROFESSION_CITY_PAGES.filter((p) => p.citySlug === citySlug);
