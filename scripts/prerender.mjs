/**
 * Пререндер посадочных страниц.
 *
 * Зачем: сайт собран как SPA — сервер отдаёт один и тот же пустой index.html
 * на все адреса, а заголовки и тексты подставляет уже браузер. Google такие
 * страницы обрабатывает, а робот Яндекса — выборочно и с большой задержкой:
 * в отчёте обхода за двое суток он дошёл только до главной, ни одна из 304
 * страниц городов и профессий в индекс не попала.
 *
 * Что делает скрипт: на этапе сборки создаёт для каждого адреса отдельный
 * HTML-файл, где уже проставлены title, description, canonical, микроразметка
 * и читаемый текст страницы. Робот получает содержимое сразу, без выполнения
 * скриптов. Приложение при этом работает как раньше: React стартует и
 * заменяет статичный текст живым интерфейсом.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { build } from 'esbuild';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://dodelay.ru';
const OUT = resolve(root, 'dist');

/** Данные лежат в .ts с алиасами «@/» — собираем их в один временный
 *  модуль, чтобы прочитать реальные значения, а не парсить текст регулярками. */
const loadData = async () => {
  // Пишем во временный каталог системы, а не в node_modules: на сборочном
  // сервере зависимости часто монтируются только для чтения, и попытка
  // создать там файл роняла весь процесс сборки.
  const dir = await mkdtemp(join(tmpdir(), 'dodelay-prerender-'));
  const entry = join(dir, 'entry.mjs');
  const bundle = join(dir, 'data.mjs');

  try {
    writeFileSync(
      entry,
      `export { CITY_PAGES } from '@/data/cityPages';
       export { DISTRICT_PAGES } from '@/data/districtPages';
       export { PROFESSIONS } from '@/data/professionsCatalog';
       export { PROFESSION_CITY_PAGES } from '@/data/professionCityPages';`,
      'utf8',
    );

    await build({
      entryPoints: [entry],
      bundle: true,
      format: 'esm',
      platform: 'node',
      outfile: bundle,
      logLevel: 'silent',
      alias: { '@': resolve(root, 'src') },
    });

    // Абсолютный путь через file:// — иначе импорт ломается на Windows
    return await import(`${pathToFileURL(bundle).href}?t=${Date.now()}`);
  } finally {
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      /* временные файлы удалит система */
    }
  }
};

/** Экранирование: тексты попадают в HTML как есть, любые «<» и «&»
 *  внутри описаний иначе сломают разметку страницы. */
const esc = (s = '') =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const p = (text) => (text ? `<p style="margin:0 0 16px">${esc(text)}</p>` : '');
const h2 = (text) => `<h2 style="font-size:21px;margin:32px 0 12px">${esc(text)}</h2>`;

/** Таблица цен — тот же список, что видит пользователь в интерфейсе */
const priceTable = (tasks = []) =>
  tasks.length
    ? `<table style="width:100%;border-collapse:collapse;margin:0 0 20px"><tbody>${tasks
        .map(
          (t) =>
            `<tr><td style="padding:8px 0;border-bottom:1px solid #e8e6df">${esc(
              t.task,
            )}</td><td style="padding:8px 0;border-bottom:1px solid #e8e6df;text-align:right;white-space:nowrap">${esc(
              t.price,
            )}</td></tr>`,
        )
        .join('')}</tbody></table>`
    : '';

const linkList = (items) =>
  items.length
    ? `<ul style="margin:0 0 20px;padding-left:20px">${items
        .map((i) => `<li style="margin:0 0 6px"><a href="${i.href}">${esc(i.text)}</a></li>`)
        .join('')}</ul>`
    : '';

/** Общий подвал: ссылки на все города — робот обходит сайт по ним */
const footerLinks = (cities, currentSlug) =>
  linkList(
    cities
      .filter((c) => c.slug !== currentSlug)
      .map((c) => ({ href: `/podrabotka/${c.slug}`, text: `Подработка в ${c.name}` })),
  );

const jsonLd = (obj) =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const main = async () => {
  const { CITY_PAGES, DISTRICT_PAGES, PROFESSIONS, PROFESSION_CITY_PAGES } = await loadData();

  const indexFile = resolve(OUT, 'index.html');
  if (!existsSync(indexFile)) {
    console.warn('prerender: dist/index.html не найден — пропускаю');
    return;
  }

  const tpl = readFileSync(indexFile, 'utf8');
  if (!tpl.includes('id="seo-fallback"')) {
    console.warn('prerender: в index.html нет блока seo-fallback — пропускаю');
    return;
  }

  const pages = [];

  // ---- Города ----
  for (const city of CITY_PAGES) {
    const districts = DISTRICT_PAGES.filter((d) => d.citySlug === city.slug);
    const profs = PROFESSION_CITY_PAGES.filter((x) => x.citySlug === city.slug);
    const nearby = city.nearbyCities
      .map((s) => CITY_PAGES.find((c) => c.slug === s))
      .filter(Boolean);

    pages.push({
      path: `/podrabotka/${city.slug}`,
      title: city.title,
      description: city.description,
      body: [
        `<h1 style="font-size:28px;line-height:1.25;margin:0 0 16px">${esc(city.h1)}</h1>`,
        p(city.intro),
        city.population ? p(`Население: ${city.population}.`) : '',
        h2(`Специальности в ${city.name}`),
        linkList(
          profs.map((x) => ({
            href: `/podrabotka/${city.slug}/${x.professionSlug}`,
            text: `${x.professionLabel} в ${city.name}`,
          })),
        ),
        districts.length ? h2(`Районы ${city.nameGenitive}`) : '',
        linkList(
          districts.map((d) => ({
            href: `/podrabotka/${city.slug}/rayon/${d.slug}`,
            text: `Подработка в ${d.name}`,
          })),
        ),
        nearby.length ? h2('Соседние города') : '',
        linkList(
          nearby.map((c) => ({
            href: `/podrabotka/${c.slug}`,
            text: `Подработка в ${c.name}`,
          })),
        ),
      ].join('\n'),
      ld: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `Шабашка и подработка в ${city.nameNominative}`,
        description: city.description,
        areaServed: { '@type': 'City', name: city.nameNominative },
        url: `${SITE}/podrabotka/${city.slug}`,
      },
    });
  }

  // ---- Профессия × город ----
  for (const page of PROFESSION_CITY_PAGES) {
    const city = CITY_PAGES.find((c) => c.slug === page.citySlug);
    if (!city) continue;
    const others = PROFESSION_CITY_PAGES.filter(
      (x) => x.citySlug === city.slug && x.professionSlug !== page.professionSlug,
    ).slice(0, 12);
    const sameProf = CITY_PAGES.filter((c) => c.slug !== city.slug).map((c) => ({
      href: `/podrabotka/${c.slug}/${page.professionSlug}`,
      text: `${page.professionLabel} в ${c.name}`,
    }));

    pages.push({
      path: `/podrabotka/${page.citySlug}/${page.professionSlug}`,
      title: page.title,
      description: page.description,
      body: [
        `<h1 style="font-size:28px;line-height:1.25;margin:0 0 16px">${esc(page.h1)}</h1>`,
        p(page.intro),
        page.synonyms?.length > 1
          ? p(`Эту услугу также ищут так: ${page.synonyms.slice(0, 5).join(', ')}.`)
          : '',
        h2(`Цены на услуги: ${page.professionLabel.toLowerCase()} в ${city.name}`),
        priceTable(page.tasks),
        p(
          'Суммы указаны за работу и служат ориентиром — точную цену заказчик и исполнитель согласуют напрямую. Комиссию сервис не удерживает.',
        ),
        h2(`Другие мастера в ${city.name}`),
        linkList(
          others.map((x) => ({
            href: `/podrabotka/${city.slug}/${x.professionSlug}`,
            text: `${x.professionLabel} в ${city.name}`,
          })),
        ),
        h2(`${page.professionLabel} в других городах`),
        linkList(sameProf),
      ].join('\n'),
      ld: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `${page.professionLabel} в ${city.nameNominative}`,
        description: page.description,
        serviceType: page.professionLabel,
        areaServed: { '@type': 'City', name: city.nameNominative },
        url: `${SITE}/podrabotka/${page.citySlug}/${page.professionSlug}`,
      },
    });
  }

  // ---- Районы ----
  for (const d of DISTRICT_PAGES) {
    const city = CITY_PAGES.find((c) => c.slug === d.citySlug);
    if (!city) continue;
    const top = d.topProfessions
      .map((slug) => PROFESSIONS.find((x) => x.slug === slug))
      .filter(Boolean);

    pages.push({
      path: `/podrabotka/${d.citySlug}/rayon/${d.slug}`,
      title: d.title,
      description: d.description,
      body: [
        `<h1 style="font-size:28px;line-height:1.25;margin:0 0 16px">${esc(d.h1)}</h1>`,
        p(d.intro),
        h2(`Какие заказы чаще всего в ${d.name}`),
        p(d.demand),
        h2('Застройка и жилой фонд'),
        p(d.housing),
        h2('Микрорайоны и местные названия'),
        p(d.areas.join(', ') + '.'),
        p(`Ориентиры района: ${d.landmarks.join(', ')}.`),
        h2('Как добраться и что учесть'),
        p(d.logistics),
        h2(`Востребованные мастера в ${d.name}`),
        linkList(
          top.map((x) => ({
            href: `/podrabotka/${city.slug}/${x.slug}`,
            text: `${x.label} — ${x.tasks[0]?.price || 'цена по договорённости'}`,
          })),
        ),
        h2(`Другие районы ${city.nameGenitive}`),
        linkList(
          DISTRICT_PAGES.filter((x) => x.citySlug === d.citySlug && x.slug !== d.slug).map(
            (x) => ({
              href: `/podrabotka/${city.slug}/rayon/${x.slug}`,
              text: `Подработка в ${x.name}`,
            }),
          ),
        ),
      ].join('\n'),
      ld: {
        '@context': 'https://schema.org',
        '@type': 'Service',
        name: `Подработка в ${d.nameNominative}`,
        description: d.description,
        areaServed: { '@type': 'Place', name: d.nameNominative },
        url: `${SITE}/podrabotka/${d.citySlug}/rayon/${d.slug}`,
      },
    });
  }

  // ---- Служебные страницы ----
  // Своих данных у них нет, но title и description задаются в коде —
  // дублируем их в HTML, чтобы в выдаче не было заголовка главной.
  const STATIC = [
    {
      path: '/contacts',
      title: 'Контакты — Доделай.ру',
      description:
        'Как связаться с сервисом Доделай.ру: почта поддержки, реквизиты ИП, регион работы и время ответа.',
      heading: 'Контакты Доделай.ру',
      text: 'Служба поддержки отвечает на письма в течение рабочего дня. Здесь же указаны реквизиты и регион, в котором работает сервис.',
    },
    {
      path: '/terms',
      title: 'Условия использования и оферта — Доделай.ру',
      description:
        'Правила сервиса Доделай.ру: как размещать задания и откликаться, кто отвечает за оплату и качество работ, условия подписки PRO.',
      heading: 'Условия использования сервиса',
      text: 'Документ описывает правила размещения заданий и откликов, распределение ответственности между заказчиком и исполнителем, а также условия платных возможностей.',
    },
    {
      path: '/privacy',
      title: 'Политика конфиденциальности — Доделай.ру',
      description:
        'Какие данные собирает Доделай.ру, зачем они нужны, что видно другим участникам и как удалить аккаунт и объявления.',
      heading: 'Политика конфиденциальности',
      text: 'Здесь перечислено, какие сведения сервис сохраняет, для чего они используются, какая часть профиля доступна другим участникам и как удалить свои данные.',
    },
  ];

  for (const st of STATIC) {
    pages.push({
      path: st.path,
      title: st.title,
      description: st.description,
      body: [
        `<h1 style="font-size:28px;line-height:1.25;margin:0 0 16px">${esc(st.heading)}</h1>`,
        p(st.text),
        h2('Разделы сервиса'),
        linkList(
          CITY_PAGES.map((c) => ({
            href: `/podrabotka/${c.slug}`,
            text: `Подработка в ${c.name}`,
          })),
        ),
      ].join('\n'),
      ld: {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: st.title,
        description: st.description,
        url: `${SITE}${st.path}`,
      },
    });
  }

  // ---- Запись файлов ----
  let written = 0;
  for (const page of pages) {
    const canonical = `${SITE}${page.path}`;

    let html = tpl
      // Заголовок и описание: в шаблоне лежат значения главной страницы
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${esc(page.title)}</title>`)
      .replace(
        /<meta name="description" content="[^"]*"\s*\/?>/,
        `<meta name="description" content="${esc(page.description)}"/>`,
      )
      .replace(
        /<link rel="canonical" href="[^"]*"\s*\/?>/,
        `<link rel="canonical" href="${canonical}"/>`,
      )
      .replace(
        /<meta property="og:title" content="[^"]*"\s*\/?>/,
        `<meta property="og:title" content="${esc(page.title)}"/>`,
      )
      .replace(
        /<meta property="og:description" content="[^"]*"\s*\/?>/,
        `<meta property="og:description" content="${esc(page.description)}"/>`,
      )
      .replace(
        /<meta property="og:url" content="[^"]*"\s*\/?>/,
        `<meta property="og:url" content="${canonical}"/>`,
      );

    if (!html.includes('rel="canonical"')) {
      html = html.replace('</head>', `<link rel="canonical" href="${canonical}"/>\n</head>`);
    }

    // Микроразметка страницы — добавляем перед закрытием head
    html = html.replace('</head>', `${jsonLd(page.ld)}\n</head>`);

    // Текст страницы вместо общего блока главной. Скрипты в index.html
    // прячут этот блок сразу после старта React, поэтому пользователь
    // видит обычный интерфейс, а робот — готовый текст.
    html = html.replace(
      /(<div id="seo-fallback"[^>]*>)[\s\S]*?(<\/div>\s*<\/div>)/,
      (_m, open, close) => `${open}\n${page.body}\n${close}`,
    );

    const file = resolve(OUT, page.path.replace(/^\//, ''), 'index.html');
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, html, 'utf8');
    written += 1;
  }

  console.log(`prerender: ${written} страниц`);
};

// Пререндер — надстройка над готовой сборкой: dist к этому моменту уже
// собран и рабочий. Если генерация статики не удалась, сайт всё равно
// должен опубликоваться, поэтому выходим с нулевым кодом и пишем причину.
main().catch((e) => {
  console.warn('prerender: пропущен —', e && e.message ? e.message : e);
  process.exit(0);
});
