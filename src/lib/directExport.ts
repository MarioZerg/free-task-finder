import { PROFESSIONS } from '@/data/professionsCatalog';
import { CITY_PAGES } from '@/data/cityPages';
import {
  PROFESSION_KEYWORDS,
  COMMERCIAL_MODIFIERS,
  ALL_NEGATIVES,
  WORKER_KEYWORDS,
  WORKER_PROFESSION_KEYWORDS,
  WORKER_NEGATIVES,
  PROFESSION_CREATIVE,
  DEFAULT_CREATIVE,
  CREATIVE_FORMATS,
} from '@/data/adKeywords';

/** Сборка кампаний для Яндекс Директа в формате Директ Коммандера.
 *
 *  Правило кампании: одна профессия в одном городе — одна группа со своей
 *  посадочной страницей. Если свалить всё в общую группу, объявление про
 *  кондиционеры покажется по запросу «сборка мебели», и CTR обвалится.
 */

/** Лимиты Директа. Всё, что длиннее, объявление не пройдёт модерацию. */
export const LIMITS = {
  title: 56,
  title2: 30,
  text: 81,
  phrase: 4096,
};

export interface ExportOptions {
  professions: string[];
  cities: string[];
  /** Дневной бюджет кампании, рублей */
  budget: number;
  siteUrl: string;
  utm: boolean;
}

export interface AdRow {
  campaign: string;
  group: string;
  phrase: string;
  title: string;
  title2: string;
  text: string;
  url: string;
  region: string;
  /** Ссылки на картинки для РСЯ — по одной на каждую пропорцию */
  images: string[];
}

/** Регион показа для каждого города — Директ понимает их по названию.
 *
 *  Все шесть городов заведены в справочнике Директа отдельными регионами,
 *  включая небольшие. Раньше здесь для Тутаева, Углича и Ростова стояла
 *  область: показы уходили на всю Ярославскую, а не на конкретный город.
 *
 *  Ростов пишем без «Великий» — в справочнике он «Ростов», а «Ростов
 *  Великий» Директ не находит и молча отбрасывает регион.
 */
export const CITY_REGION: Record<string, string> = {
  yaroslavl: 'Ярославль',
  rybinsk: 'Рыбинск',
  pereslavl: 'Переславль-Залесский',
  tutaev: 'Тутаев',
  uglich: 'Углич',
  rostov: 'Ростов',
};

const SITE = 'https://dodelay.ru';

/** Обрезаем по границе слова: Директ режет молча, а обрубок в середине
 *  слова выглядит как ошибка и снижает доверие к объявлению. */
const fit = (s: string, limit: number): string => {
  if (s.length <= limit) return s;
  const cut = s.slice(0, limit);
  const space = cut.lastIndexOf(' ');
  return (space > limit * 0.6 ? cut.slice(0, space) : cut).replace(/[\s,.—-]+$/, '');
};

/** Заголовок объявления: услуга + город. Именно так человек и ищет.
 *  Город — в предложном падеже («в Ярославле»), иначе заголовок читается
 *  как ошибка и режет доверие с первой секунды. */
const titleFor = (label: string, cityPrep: string): string =>
  fit(`${label} в ${cityPrep}`, LIMITS.title);

const title2For = (): string[] => [
  'Бесплатно, без комиссий',
  'Мастера рядом с домом',
  'Отклики в день заявки',
  'Оплата напрямую мастеру',
];

/** Для каждого текста держим короткий запасной вариант.
 *  У длинных городов вроде «Переславля-Залесского» полная фраза не влезает
 *  в 81 знак, и обрезка съедала концовку: «Бесплатно, комиссию» вместо
 *  «комиссию не берём». Лучше показать короткую, но законченную мысль. */
const pick = (...variants: string[]): string =>
  variants.find((v) => v.length <= LIMITS.text) || fit(variants[variants.length - 1], LIMITS.text);

const textFor = (genitive: string, cityPrep: string): string[] => [
  pick(
    `Найдите ${genitive} в ${cityPrep} без посредников. Бесплатно, комиссию не берём.`,
    `Найдите ${genitive} без посредников. Бесплатно, комиссию не берём.`,
    `Найдите ${genitive} без посредников. Комиссию не берём.`,
    `Мастера без посредников. Бесплатно, комиссию не берём.`,
  ),
  pick(
    `Разместите задачу — мастера откликнутся сами. Оплата напрямую исполнителю.`,
    `Разместите задачу — мастера откликнутся сами.`,
  ),
  pick(
    `Частные мастера в ${cityPrep}. Отклики в день заявки, цену обсуждаете напрямую.`,
    `Частные мастера в ${cityPrep}. Отклики в день заявки.`,
  ),
];

/** Ссылка на профильную страницу. Совпадение запроса, объявления и
 *  страницы — половина успеха: человек видит ровно то, что искал. */
export const landingUrl = (
  professionSlug: string,
  citySlug: string,
  withUtm: boolean,
  base = SITE,
): string => {
  const url = `${base}/podrabotka/${citySlug}/${professionSlug}`;
  if (!withUtm) return url;
  return `${url}?utm_source=yandex&utm_medium=cpc&utm_campaign=${citySlug}_${professionSlug}`;
};

/** Ссылки на креативы профессии во всех пропорциях.
 *  Директ забирает картинки по ссылке, поэтому файлы должны быть открыты
 *  на сайте — они лежат в /public/ads и отдаются вместе с ним. */
export const creativeUrls = (professionSlug: string | null, base = SITE): string[] => {
  const theme =
    (professionSlug && PROFESSION_CREATIVE[professionSlug]) || DEFAULT_CREATIVE;
  return CREATIVE_FORMATS.map((f) => `${base}/ads/${theme}-${f}.jpg`);
};

/** Ключевые фразы группы: базовая фраза плюс коммерческие добавки и город. */
export const buildPhrases = (professionSlug: string, cityNominative: string): string[] => {
  const base = PROFESSION_KEYWORDS[professionSlug] || [];
  const out: string[] = [];
  for (const phrase of base) {
    for (const mod of COMMERCIAL_MODIFIERS) {
      const full = [phrase, mod, cityNominative].filter(Boolean).join(' ');
      if (full.length <= LIMITS.phrase) out.push(full);
    }
  }
  return [...new Set(out)];
};

export const buildRows = (opts: ExportOptions): AdRow[] => {
  const rows: AdRow[] = [];

  for (const citySlug of opts.cities) {
    const city = CITY_PAGES.find((c) => c.slug === citySlug);
    if (!city) continue;

    for (const profSlug of opts.professions) {
      const p = PROFESSIONS.find((x) => x.slug === profSlug);
      if (!p) continue;

      const campaign = `Доделай — ${city.nameNominative}`;
      const group = `${p.label} — ${city.nameNominative}`;
      const url = landingUrl(p.slug, city.slug, opts.utm, opts.siteUrl || SITE);
      const phrases = buildPhrases(p.slug, city.nameNominative);
      const titles2 = title2For();
      const texts = textFor(p.genitive, city.name);

      phrases.forEach((phrase, i) => {
        rows.push({
          campaign,
          group,
          phrase,
          title: titleFor(p.label, city.name),
          title2: titles2[i % titles2.length],
          text: texts[i % texts.length],
          url,
          region: CITY_REGION[city.slug] || 'Ярославская область',
          images: creativeUrls(p.slug, opts.siteUrl || SITE),
        });
      });
    }
  }
  return rows;
};

/** Столбцы файла импорта — под комбинаторные объявления.
 *
 *  Директ отказался от текстово-графических объявлений: с июля они не
 *  создаются, а импортированные превращаются в комбинаторные. Значений
 *  «Текстово-графическое» и «Текстово-графическая кампания» больше нет
 *  в словаре Коммандера — встретив их, он не понимал тип строки и ругался
 *  «в некоторых строках не проставлен столбец Тип объявления», а следом
 *  игнорировал регион.
 *
 *  Поэтому пишем то, во что Директ всё равно всё переводит: тип
 *  «Комбинаторное», заголовки и тексты — в полях комбинаторики. Столбца
 *  «Тип кампании» здесь нет вовсе: тип задаётся при создании кампании.
 */
const HEADERS = [
  'Доп. объявление группы', 'Тип объявления', 'ID группы', 'Название группы',
  'Номер группы', 'ID фразы', 'Фраза (с минус-словами)', 'ID объявления',
  'Заголовок 1', 'Заголовок 2', 'Заголовок 3', 'Текст 1', 'Текст 2',
  'Изображение 1', 'Изображение 2', 'Изображение 3', 'Изображение 4',
  'Ссылка', 'Отображаемая ссылка', 'Регион', 'Организация Яндекс Бизнеса',
  'Ставка', 'Ставка в сетях', 'Минус-фразы на группу',
];

/** Номера столбцов, которые заполняем. Держим их рядом с HEADERS:
 *  при сдвиге сетки ошибка вылезет здесь, а не в чужом кабинете. */
const COL = {
  extra: 0, adType: 1, groupName: 3, groupNo: 4,
  phrase: 6, title: 8, title2: 9, title3: 10, text: 11, text2: 12,
  img1: 13, img2: 14, img3: 15, img4: 16,
  url: 17, region: 19, bid: 21, bidNet: 22, negatives: 23,
} as const;

/** Разделитель — табуляция: этого требует формат Коммандера.
 *  Поэтому же внутри значений табуляций быть не должно. */
const cell = (v: string | number) => String(v).replace(/[\t\r\n]+/g, ' ').trim();

/** Ставка по умолчанию. Без неё Коммандер подставляет свою и группы
 *  уходят на модерацию с нулём — показов не будет. Ставим скромную:
 *  поднять в кабинете проще, чем внезапно потратить бюджет. */
export const DEFAULT_BID = 30;

/** Директ ждёт дробную часть через запятую: «12.5» он читает как 125. */
const bidValue = (v: number) => String(Math.max(1, Math.round(v * 100) / 100)).replace('.', ',');

export interface CsvOptions {
  /** Ставка на поиске, рублей */
  bid?: number;
  /** Ставка в сетях. Не задана — берём ставку поиска */
  bidNet?: number;
  /** Кампания на исполнителей — у неё свой набор минус-слов */
  audience?: 'customer' | 'worker';
}

export const toCsv = (rows: AdRow[], opts: CsvOptions = {}): string => {
  const bid = bidValue(opts.bid ?? DEFAULT_BID);
  const bidNet = bidValue(opts.bidNet ?? opts.bid ?? DEFAULT_BID);
  // У кампаний зеркальный мусор: заказчику мешают соискатели, исполнителю —
  // те, кто ищет мастера. Списки минус-слов поэтому разные.
  const negativeList =
    opts.audience === 'worker' ? WORKER_NEGATIVES : ALL_NEGATIVES;
  const lines = [HEADERS.join('\t')];
  const negatives = negativeList.join(', ');

  /** Строки с ключевыми фразами помечаются «-», дополнительные объявления
   *  группы — «+». Знак «+» не значит «не первый»: у таких строк поля
   *  группы и фразы должны быть пустыми, иначе Коммандер их отбрасывает. */
  const byGroup = new Map<string, AdRow[]>();
  for (const r of rows) {
    const key = `${r.campaign}||${r.group}`;
    if (!byGroup.has(key)) byGroup.set(key, []);
    byGroup.get(key)!.push(r);
  }

  const row = (values: Partial<Record<keyof typeof COL, string | number>>) => {
    const line = new Array(HEADERS.length).fill('');
    for (const [k, v] of Object.entries(values)) {
      line[COL[k as keyof typeof COL]] = cell(v as string | number);
    }
    lines.push(line.join('\t'));
  };
  let no = 0;

  for (const list of byGroup.values()) {
    no += 1;
    const main = list[0];
    // Второй вариант текста для той же группы — материал для комбинаций
    const alt = list.slice(1).find((v) => v.text !== main.text);

    // Все фразы группы — с одним и тем же главным объявлением
    list.forEach((r, i) => {
      row({
        extra: '-',
        adType: 'Комбинаторное',
        groupName: r.group,
        groupNo: no,
        phrase: r.phrase,
        // Комбинаторное объявление само собирает связку из нескольких
        // заголовков и текстов — отдаём все варианты сразу, Директ
        // покажет ту комбинацию, что откликается лучше.
        title: main.title,
        title2: main.title2,
        title3: alt?.title2 || '',
        text: main.text,
        text2: alt && alt.text !== main.text ? alt.text : '',
        // Четыре пропорции одной картинки: Директ подберёт ту, что
        // подходит площадке. С одним форматом объявление попадёт
        // на заметно меньшее число мест показа.
        img1: main.images[0] || '',
        img2: main.images[1] || '',
        img3: main.images[2] || '',
        img4: main.images[3] || '',
        url: main.url,
        // Регион и ставка заполняются только у главного объявления —
        // так требует формат, в остальных строках они игнорируются.
        region: i === 0 ? r.region : '',
        bid: i === 0 ? bid : '',
        bidNet: i === 0 ? bidNet : '',
        negatives: i === 0 ? negatives : '',
      });
    });

  }
  return lines.join('\r\n');
};

/** Файл скачивается с меткой BOM — без неё Excel открывает кириллицу
 *  кракозябрами, и человек решает, что выгрузка сломана. */
export const downloadCsv = (rows: AdRow[], name: string, opts: CsvOptions = {}) => {
  const blob = new Blob(['\uFEFF' + toCsv(rows, opts)], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
};

/** Минус-слова одной строкой — их вставляют на уровне кампании, а не
 *  в каждое объявление. В файле их держать нельзя: 111 слов × тысячи
 *  строк раздували выгрузку до десятка мегабайт. */
export const negativesLine = (audience: 'customer' | 'worker' = 'customer'): string =>
  (audience === 'worker' ? WORKER_NEGATIVES : ALL_NEGATIVES).join(', ');

export default buildRows;
/* ===================== КАМПАНИЯ НА ИСПОЛНИТЕЛЕЙ ===================== */

/** Объявления для тех, кто ищет подработку.
 *
 *  Отдельная кампания, а не ещё одна группа в существующей: у заказчика и
 *  исполнителя противоположное намерение, разные посадочные и свои
 *  минус-слова. В одной кампании они мешают обучению и роняют отклик —
 *  с этого и начались проблемы с динамикой.
 *
 *  Ведём на страницу города («Шабашка и подработка в Ярославле»), а по
 *  специальностям — на страницу профессии: там человек сразу видит ленту
 *  заказов по своему профилю.
 */
/** Берём первый вариант, который влезает в лимит объявления */
const pickText2 = (full: string, short: string) =>
  full.length <= LIMITS.text ? full : fit(short, LIMITS.text);

const workerTitle = (cityPrep: string): string[] => [
  `Подработка в ${cityPrep}`,
  `Работа на день в ${cityPrep}`,
  `Шабашка в ${cityPrep}`,
];

const workerTitle2 = (): string[] => [
  'Оплата в день работы',
  'Без резюме и опыта',
  'Заказы рядом с домом',
  'Бесплатно, без комиссий',
];

const workerText = (cityPrep: string): string[] => [
  pickText2(
    `Разовые заказы в ${cityPrep}: выбирайте сами, оплата напрямую от заказчика.`,
    `Разовые заказы: выбирайте сами, оплата напрямую от заказчика.`,
  ),
  pickText2(
    `Без резюме и собеседований. Вход за минуту, комиссию с оплаты не берём.`,
    `Без резюме. Вход за минуту, комиссию не берём.`,
  ),
  pickText2(
    `Заказы рядом с домом в ${cityPrep}. Берите столько работы, сколько нужно.`,
    `Заказы рядом с домом. Берите столько работы, сколько нужно.`,
  ),
];

export const buildWorkerRows = (opts: ExportOptions): AdRow[] => {
  const rows: AdRow[] = [];

  for (const citySlug of opts.cities) {
    const city = CITY_PAGES.find((c) => c.slug === citySlug);
    if (!city) continue;

    const campaign = `Доделай, исполнители — ${city.nameNominative}`;
    const region = CITY_REGION[city.slug] || 'Ярославская область';
    const titles = workerTitle(city.name).map((t) => fit(t, LIMITS.title));
    const titles2 = workerTitle2();
    const texts = workerText(city.name);

    // Общая группа: человек ищет подработку вообще, без специальности
    const cityUrl = opts.utm
      ? `${opts.siteUrl || SITE}/podrabotka/${city.slug}?utm_source=yandex&utm_medium=cpc&utm_campaign=worker_${city.slug}`
      : `${opts.siteUrl || SITE}/podrabotka/${city.slug}`;

    WORKER_KEYWORDS.forEach((base, i) => {
      rows.push({
        campaign,
        group: `Подработка — ${city.nameNominative}`,
        phrase: `${base} ${city.nameNominative}`,
        title: titles[i % titles.length],
        title2: titles2[i % titles2.length],
        text: texts[i % texts.length],
        url: cityUrl,
        region,
        // Общая группа не про специальность — берём картинку с человеком
        images: creativeUrls(null, opts.siteUrl || SITE),
      });
    });

    // Группы по специальностям: «работа сантехником» — на страницу сантехника
    for (const profSlug of opts.professions) {
      const p = PROFESSIONS.find((x) => x.slug === profSlug);
      const base = WORKER_PROFESSION_KEYWORDS[profSlug];
      if (!p || !base?.length) continue;

      const url = landingUrl(p.slug, city.slug, opts.utm, opts.siteUrl || SITE);
      base.forEach((phrase, i) => {
        for (const mod of ['', 'без опыта', 'с ежедневной оплатой']) {
          rows.push({
            campaign,
            group: `${p.label} — работа, ${city.nameNominative}`,
            phrase: [phrase, mod, city.nameNominative].filter(Boolean).join(' '),
            title: fit(`${p.label}: работа в ${city.name}`, LIMITS.title),
            title2: titles2[i % titles2.length],
            text: texts[i % texts.length],
            url,
            region,
            images: creativeUrls(p.slug, opts.siteUrl || SITE),
          });
        }
      });
    }
  }
  return rows;
};
