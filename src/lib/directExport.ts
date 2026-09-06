import { PROFESSIONS } from '@/data/professionsCatalog';
import { CITY_PAGES } from '@/data/cityPages';
import { PROFESSION_KEYWORDS, COMMERCIAL_MODIFIERS, ALL_NEGATIVES } from '@/data/adKeywords';

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
}

/** Регион показа для каждого города — Директ понимает их по названию.
 *
 *  Крупные города заведены в справочнике Директа отдельными регионами,
 *  а маленькие (Тутаев, Углич) — нет: попытка указать их приводит к
 *  «регион не импортирован». Для них берём область и сужаем показ
 *  ключевыми фразами, где город назван словом.
 */
export const CITY_REGION: Record<string, string> = {
  yaroslavl: 'Ярославль',
  rybinsk: 'Рыбинск',
  pereslavl: 'Переславль-Залесский',
  rostov: 'Ярославская область',
  tutaev: 'Ярославская область',
  uglich: 'Ярославская область',
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
        });
      });
    }
  }
  return rows;
};

/** Столбцы шаблона Коммандера — без блока комбинаторного объявления.
 *
 *  Тип поля Коммандер определяет ПО НАЗВАНИЮ столбца, а не по его месту
 *  (порядок и полнота набора значения не имеют). В полном шаблоне
 *  «Заголовок 1» и «Заголовок 2» встречаются дважды: сначала поля
 *  обычного объявления, следом одноимённые поля комбинаторного. При
 *  двух одинаковых именах побеждало последнее — и все строки уезжали
 *  в комбинаторные. Поэтому блок комбинаторных полей (Заголовок 1-7,
 *  Текст 1-3, изображения и видео) в файл не попадает вовсе: каждое
 *  имя встречается ровно один раз.
 */
const HEADERS = [
  'Доп. объявление группы', 'Тип объявления', 'ID группы', 'Название группы',
  'Номер группы', 'Тип кампании', 'Валюта', 'ID фразы', 'Фраза (с минус-словами)',
  'ID объявления', 'Заголовок 1', 'Заголовок 2', 'Текст',
  'Статус модерации ассетов', 'Ссылка', 'Отображаемая ссылка', 'Регион',
  'Ставка', 'Ставка в сетях', 'Организация Яндекс Бизнеса', 'Статус объявления',
  'Статус фразы', 'Заголовки быстрых ссылок', 'Описания быстрых ссылок',
  'Адреса быстрых ссылок', 'Параметр 1', 'Параметр 2', 'Метки', 'Изображение',
  'Креатив', 'Статус модерации креатива', 'Уточнения', 'Минус-фразы на группу',
  'Возрастные ограничения',
];

/** Номера столбцов, которые заполняем. Держим их рядом с HEADERS:
 *  при сдвиге сетки ошибка вылезет здесь, а не в чужом кабинете. */
const COL = {
  extra: 0, adType: 1, groupName: 3, groupNo: 4, campaignType: 5,
  phrase: 8, title: 10, title2: 11, text: 12,
  url: 14, region: 16, bid: 17, bidNet: 18, negatives: 32,
} as const;

/** Разделитель — табуляция: этого требует формат Коммандера.
 *  Поэтому же внутри значений табуляций быть не должно. */
const cell = (v: string | number) => String(v).replace(/[\t\r\n]+/g, ' ').trim();

/** Ставка по умолчанию. Без неё Коммандер подставляет свою и группы
 *  уходят на модерацию с нулём — показов не будет. Ставим скромную:
 *  поднять в кабинете проще, чем внезапно потратить бюджет. */
const DEFAULT_BID = '30';

export const toCsv = (rows: AdRow[]): string => {
  const lines = [HEADERS.join('\t')];
  const negatives = ALL_NEGATIVES.join(', ');

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

    // Все фразы группы — с одним и тем же главным объявлением
    list.forEach((r, i) => {
      row({
        extra: '-',
        adType: 'Текстово-графическое',
        groupName: r.group,
        groupNo: no,
        campaignType: 'Текстово-графическая кампания',
        phrase: r.phrase,
        title: main.title,
        title2: main.title2,
        text: main.text,
        url: main.url,
        // Регион и ставка заполняются только у главного объявления —
        // так требует формат, в остальных строках они игнорируются.
        region: i === 0 ? r.region : '',
        bid: i === 0 ? DEFAULT_BID : '',
        bidNet: i === 0 ? DEFAULT_BID : '',
        negatives: i === 0 ? negatives : '',
      });
    });

    /** Ещё два варианта объявления на группу: Директ сам покажет тот,
     *  что откликается лучше. Одно объявление на группу лишает его
     *  выбора и заодно лишает вас данных, какой текст работает. */
    const variants = list.slice(1, 3).filter((v) => v.text !== main.text);
    for (const v of variants) {
      row({
        extra: '+',
        adType: 'Текстово-графическое',
        groupNo: no,
        title: v.title,
        title2: v.title2,
        text: v.text,
        url: v.url,
      });
    }
  }
  return lines.join('\r\n');
};

/** Файл скачивается с меткой BOM — без неё Excel открывает кириллицу
 *  кракозябрами, и человек решает, что выгрузка сломана. */
export const downloadCsv = (rows: AdRow[], name: string) => {
  const blob = new Blob(['\uFEFF' + toCsv(rows)], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
};

/** Минус-слова одной строкой — их вставляют на уровне кампании, а не
 *  в каждое объявление. В файле их держать нельзя: 111 слов × тысячи
 *  строк раздували выгрузку до десятка мегабайт. */
export const negativesLine = (): string => ALL_NEGATIVES.join(', ');

export default buildRows;