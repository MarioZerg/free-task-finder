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
  VIDEO_FORMATS,
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
  /** Все варианты заголовков группы — Директ берёт до 7 штук */
  titles?: string[];
  /** Все варианты вторых заголовков (до 30 знаков) */
  titles2?: string[];
  /** Все варианты текстов — Директ берёт до 3 штук */
  texts?: string[];
  url: string;
  region: string;
  /** Ссылки на картинки для РСЯ — по одной на каждую пропорцию */
  images: string[];
  /** Ссылки на видеоролики — по одной на каждую пропорцию */
  videos?: string[];
  /** Быстрые ссылки: заголовок, описание и адрес */
  sitelinks?: { title: string; desc: string; url: string }[];
  /** Уточнения — короткие преимущества под объявлением */
  callouts?: string[];
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

/** Семь заголовков на объявление — максимум, который разрешает Директ.
 *  Каждый бьёт в свой мотив: цена, скорость, доверие, отсутствие
 *  посредника. Директ сам покажет тот, что заходит конкретному человеку,
 *  а в отчёте по группировке «Заголовок» видно, какой мотив сработал.
 *
 *  Падежи берём из каталога, а не склоняем сами. В каталоге вперемешку
 *  люди («Сантехник») и услуги («Вывоз мусора»), поэтому шаблон
 *  «Вызвать {label}» давал «Вызвать сантехник» и «Вызвать вывоз мусора».
 *  Для таких фраз нужна форма genitive («сантехника», «вывоза мусора»),
 *  она же совпадает с винительным. Остальные шаблоны оставляем в
 *  именительном — там label подходит без изменений. */
const titlesFor = (label: string, genitive: string, cityPrep: string): string[] => {
  const short = (v: string, fallback: string) =>
    v.length <= LIMITS.title ? v : fit(fallback, LIMITS.title);
  return [
    short(`${label} в ${cityPrep}`, label),
    short(`${label} в ${cityPrep} — без посредников`, `${label} без посредников`),
    short(`Вызвать ${genitive} в ${cityPrep}`, `Вызвать ${genitive}`),
    short(`${label} в ${cityPrep}: отклики за час`, `${label}: отклики за час`),
    short(`Найти ${genitive} в ${cityPrep}`, `Найти ${genitive}`),
    short(`${label} недорого в ${cityPrep}`, `${label} недорого`),
    short(`${label} в ${cityPrep} — цены и отзывы`, `${label}: цены и отзывы`),
  ];
};

/** Второй заголовок — короткая приписка до 30 знаков. */
const title2For = (): string[] => [
  'Бесплатно, без комиссий',
  'Мастера рядом с домом',
  'Отклики в день заявки',
  'Оплата напрямую мастеру',
  'Цену обсуждаете сами',
  'Проверенные исполнители',
  'Заявка за минуту',
];

/** Для каждого текста держим короткий запасной вариант.
 *  У длинных городов вроде «Переславля-Залесского» полная фраза не влезает
 *  в 81 знак, и обрезка съедала концовку: «Бесплатно, комиссию» вместо
 *  «комиссию не берём». Лучше показать короткую, но законченную мысль. */
const pick = (...variants: string[]): string =>
  variants.find((v) => v.length <= LIMITS.text) || fit(variants[variants.length - 1], LIMITS.text);

/** Три текста — максимум Директа. Ставим разные акценты: выгода,
 *  простота обращения, скорость отклика. */
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
    `Частные мастера. Отклики в день заявки, цену обсуждаете сами.`,
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

/** Ссылки на видеоролики профессии во всех пропорциях.
 *  По данным Директа, объявления с видео дают в среднем 7% дополнительного
 *  охвата: на части площадок вместо картинки крутится ролик. Если видео
 *  не вписывается в блок, Директ сам покажет картинку — поэтому оставляем
 *  и то, и другое. */
export const videoUrls = (professionSlug: string | null, base = SITE): string[] => {
  const theme =
    (professionSlug && PROFESSION_CREATIVE[professionSlug]) || DEFAULT_CREATIVE;
  return VIDEO_FORMATS.map((f) => `${base}/ads/${theme}-${f}.mp4`);
};

/** Быстрые ссылки. Директ разрешает до восьми, но с жёстким условием:
 *  суммарная длина ВСЕХ заголовков — не больше 66 знаков, каждый до 30.
 *  Поэтому берём короткие слова и набираем столько, сколько влезает.
 *  Расширенное объявление занимает больше места в выдаче и даёт человеку
 *  выбор, куда пойти. */
const SITELINK_LIMITS = { title: 30, desc: 60, total: 66 };

export const sitelinksFor = (
  citySlug: string,
  withUtm: boolean,
  base = SITE,
  audience: 'customer' | 'worker' = 'customer',
): { title: string; desc: string; url: string }[] => {
  /* Якорь ставим ПОСЛЕ метки: в «/#how?utm_source=…» браузер считает
     якорем всю строку и метка до Метрики не доходит. */
  const link = (path: string, tag: string, hash = '') =>
    `${base}${path}` +
    (withUtm ? `?utm_source=yandex&utm_medium=cpc&utm_campaign=${citySlug}_${tag}` : '') +
    hash;

  const city = `/podrabotka/${citySlug}`;
  const all =
    audience === 'worker'
      ? [
          { title: 'Заказы рядом', desc: 'Свежие заявки в вашем городе', url: link(city, 'orders') },
          { title: 'Как начать', desc: 'Регистрация за минуту, без резюме', url: link('/', 'how', '#how') },
          { title: 'Оплата', desc: 'Деньги напрямую от заказчика, без комиссий', url: link('/', 'pay', '#practice') },
          { title: 'Вопросы', desc: 'Ответы на частые вопросы исполнителей', url: link('/contacts', 'contacts') },
        ]
      : [
          { title: 'Как это работает', desc: 'Заявка за минуту, отклики в тот же день', url: link('/', 'how', '#how') },
          { title: 'Мастера', desc: 'Профили, отзывы и рейтинг исполнителей', url: link('/', 'exec', '#executors') },
          { title: 'Цены', desc: 'Стоимость обсуждаете напрямую с мастером', url: link(city, 'city') },
          { title: 'Отзывы', desc: 'Оценки после выполненных заказов', url: link('/', 'rev', '#practice') },
          { title: 'Контакты', desc: 'Связаться с нами и задать вопрос', url: link('/contacts', 'contacts') },
        ];

  const out: typeof all = [];
  let total = 0;
  for (const l of all) {
    if (l.title.length > SITELINK_LIMITS.title) continue;
    if (total + l.title.length > SITELINK_LIMITS.total) continue;
    total += l.title.length;
    out.push({ ...l, desc: fit(l.desc, SITELINK_LIMITS.desc) });
  }
  return out;
};

/** Уточнения — короткие преимущества, до 25 знаков каждое. Идут строкой
 *  под объявлением и добавляют доверия, не занимая заголовок. */
export const CALLOUTS: Record<'customer' | 'worker', string[]> = {
  customer: ['Без комиссий', 'Отклики в день заявки', 'Оплата напрямую', 'Мастера рядом'],
  worker: ['Оплата в день работы', 'Без резюме', 'Свободный график', 'Заказы рядом'],
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
      const links = sitelinksFor(city.slug, opts.utm, opts.siteUrl || SITE);
      const titles = titlesFor(p.label, p.genitive, city.name);
      const titles2 = title2For();
      const texts = textFor(p.genitive, city.name);

      phrases.forEach((phrase, i) => {
        rows.push({
          campaign,
          group,
          phrase,
          title: titles[0],
          title2: titles2[i % titles2.length],
          text: texts[i % texts.length],
          titles,
          titles2,
          texts,
          url,
          region: CITY_REGION[city.slug] || 'Ярославская область',
          images: creativeUrls(p.slug, opts.siteUrl || SITE),
          videos: videoUrls(p.slug, opts.siteUrl || SITE),
          sitelinks: links,
          callouts: CALLOUTS.customer,
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
  'Заголовок 1', 'Заголовок 2', 'Заголовок 3', 'Заголовок 4', 'Заголовок 5',
  'Заголовок 6', 'Заголовок 7', 'Текст 1', 'Текст 2', 'Текст 3',
  'Изображение 1', 'Изображение 2', 'Изображение 3', 'Изображение 4',
  'Видео 1', 'Видео 2', 'Видео 3',
  'Заголовки быстрых ссылок', 'Описания быстрых ссылок', 'Адреса быстрых ссылок',
  'Уточнения',
  'Ссылка', 'Отображаемая ссылка', 'Регион', 'Организация Яндекс Бизнеса',
  'Ставка', 'Ставка в сетях', 'Минус-фразы на группу',
];

/** Номера столбцов, которые заполняем. Держим их рядом с HEADERS:
 *  при сдвиге сетки ошибка вылезет здесь, а не в чужом кабинете. */
const COL = {
  extra: 0, adType: 1, groupName: 3, groupNo: 4,
  phrase: 6,
  title: 8, title2: 9, title3: 10, title4: 11, title5: 12, title6: 13, title7: 14,
  text: 15, text2: 16, text3: 17,
  img1: 18, img2: 19, img3: 20, img4: 21,
  vid1: 22, vid2: 23, vid3: 24,
  slTitles: 25, slDescs: 26, slUrls: 27, callouts: 28,
  url: 29, region: 31, bid: 33, bidNet: 34, negatives: 35,
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

/** Раскладываем варианты по колонкам «Заголовок 1..7» и «Текст 1..3».
 *  Директ разрешает именно столько; чем больше непохожих вариантов, тем
 *  точнее он подберёт связку под конкретного человека, а в отчёте по
 *  группировкам «Заголовок» и «Текст» видно, какая из них сработала.
 *  Пустые колонки не мешают — лишние варианты Директ просто не покажет. */
const adVariants = (main: AdRow, alt?: AdRow) => {
  const titles = (main.titles?.length ? main.titles : [main.title]).slice(0, 7);
  const titles2 = main.titles2?.length ? main.titles2 : [main.title2];
  const texts = (main.texts?.length
    ? main.texts
    : [main.text, alt?.text].filter((t): t is string => Boolean(t))
  ).slice(0, 3);

  /* Второй заголовок не имеет отдельных колонок: в комбинаторике он
     занимает свободные места среди «Заголовок 1..7». Добираем ими хвост,
     чтобы отдать Директу все семь. */
  const filled = [...titles];
  for (const t of titles2) {
    if (filled.length >= 7) break;
    if (!filled.includes(t)) filled.push(t);
  }

  return {
    title: filled[0] || '',
    title2: filled[1] || '',
    title3: filled[2] || '',
    title4: filled[3] || '',
    title5: filled[4] || '',
    title6: filled[5] || '',
    title7: filled[6] || '',
    text: texts[0] || '',
    text2: texts[1] || '',
    text3: texts[2] || '',
  };
};

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

    /* Поля ГРУППЫ (название, номер, регион, ставка, минус-фразы) повторяем
       в каждой строке, а поля ОБЪЯВЛЕНИЯ (заголовки, тексты, картинки,
       ссылка) заполняем только в первой.

       Обе крайности ломали импорт. Когда объявление дублировалось в каждой
       строке, Коммандер считал каждую фразу отдельным объявлением: 49 штук
       при разрешённых 3. Когда же строки остались с одной лишь фразой, он
       не смог привязать их к группе и завёл пустые «Новые кампании» без
       названия и региона. Верно — повторять группу, но не объявление. */
    list.forEach((r, i) => {
      const groupFields = {
        extra: '-',
        groupName: r.group,
        groupNo: no,
        phrase: r.phrase,
        region: r.region,
        bid,
        bidNet,
        negatives,
      };

      if (i > 0) {
        row(groupFields);
        return;
      }

      row({
        ...groupFields,
        adType: 'Комбинаторное',
        // Комбинаторное объявление само перебирает варианты — отдаём
        // все заголовки и тексты сразу, одним объявлением на группу.
        ...adVariants(main, alt),
        img1: main.images[0] || '',
        img2: main.images[1] || '',
        img3: main.images[2] || '',
        img4: main.images[3] || '',
        vid1: main.videos?.[0] || '',
        vid2: main.videos?.[1] || '',
        vid3: main.videos?.[2] || '',
        /* Несколько значений в одной ячейке Директ ждёт через «||» */
        slTitles: (main.sitelinks || []).map((l) => l.title).join('||'),
        slDescs: (main.sitelinks || []).map((l) => l.desc).join('||'),
        slUrls: (main.sitelinks || []).map((l) => l.url).join('||'),
        callouts: (main.callouts || []).join('||'),
        url: main.url,
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

/** Семь заголовков для исполнителей: подработка, деньги в день,
 *  отсутствие резюме, работа рядом. Разные поводы — разные люди. */
const workerTitle = (cityPrep: string): string[] => {
  const short = (v: string, fallback: string) =>
    v.length <= LIMITS.title ? v : fit(fallback, LIMITS.title);
  return [
    short(`Подработка в ${cityPrep}`, 'Подработка рядом'),
    short(`Работа на день в ${cityPrep}`, 'Работа на один день'),
    short(`Шабашка в ${cityPrep}`, 'Шабашка рядом с домом'),
    short(`Подработка в ${cityPrep} с оплатой в день`, 'Оплата в день работы'),
    short(`Разовые заказы в ${cityPrep}`, 'Разовые заказы рядом'),
    short(`Работа без резюме в ${cityPrep}`, 'Работа без резюме'),
    short(`Халтура в ${cityPrep} — заказы рядом`, 'Заказы рядом с домом'),
  ];
};

const workerTitle2 = (): string[] => [
  'Оплата в день работы',
  'Без резюме и опыта',
  'Заказы рядом с домом',
  'Бесплатно, без комиссий',
  'Свободный график',
  'Заказы каждый день',
  'Регистрация за минуту',
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
    const links = sitelinksFor(city.slug, opts.utm, opts.siteUrl || SITE, 'worker');
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
        titles,
        titles2,
        texts,
        url: cityUrl,
        region,
        // Общая группа не про специальность — берём картинку с человеком
        images: creativeUrls(null, opts.siteUrl || SITE),
        videos: videoUrls(null, opts.siteUrl || SITE),
        sitelinks: links,
        callouts: CALLOUTS.worker,
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
            /* Для профессии первый заголовок свой («Сантехник: работа
               в Ярославле»), остальные — общие про подработку. */
            titles: [
              fit(`${p.label}: работа в ${city.name}`, LIMITS.title),
              fit(`Работа ${p.genitive} в ${city.name}`, LIMITS.title),
              fit(`${p.label} — подработка в ${city.name}`, LIMITS.title),
              ...titles,
            ].slice(0, 7),
            titles2,
            texts,
            url,
            region,
            images: creativeUrls(p.slug, opts.siteUrl || SITE),
            videos: videoUrls(p.slug, opts.siteUrl || SITE),
            sitelinks: links,
            callouts: CALLOUTS.worker,
          });
        }
      });
    }
  }
  return rows;
};