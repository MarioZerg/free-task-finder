import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://dodelay.ru';
const today = new Date().toISOString().slice(0, 10);

const read = (p) => readFileSync(resolve(root, p), 'utf8');

const citySlugs = [...read('src/data/cityPages.ts').matchAll(/slug:\s*'([^']+)'/g)].map(
  (m) => m[1],
);

const districts = [
  ...read('src/data/districtPages.ts').matchAll(
    /citySlug:\s*'([^']+)'[\s\S]{0,600}?slug:\s*'([^']+)'|slug:\s*'([^']+)'[\s\S]{0,600}?citySlug:\s*'([^']+)'/g,
  ),
].map((m) => (m[1] ? { city: m[1], slug: m[2] } : { city: m[4], slug: m[3] }));

const professionCities = [
  ...read('src/data/professionCityPages.ts').matchAll(
    /professionSlug:\s*'([^']+)'[\s\S]{0,600}?citySlug:\s*'([^']+)'/g,
  ),
].map((m) => ({ profession: m[1], city: m[2] }));

const urls = [
  { loc: '/', changefreq: 'daily', priority: '1.0' },
  ...citySlugs.map((s) => ({
    loc: `/podrabotka/${s}`,
    changefreq: 'weekly',
    priority: '0.8',
  })),
  ...professionCities.map((p) => ({
    loc: `/podrabotka/${p.city}/${p.profession}`,
    changefreq: 'weekly',
    priority: '0.7',
  })),
  ...districts.map((d) => ({
    loc: `/podrabotka/${d.city}/rayon/${d.slug}`,
    changefreq: 'weekly',
    priority: '0.6',
  })),
  { loc: '/contacts', changefreq: 'monthly', priority: '0.5' },
  { loc: '/terms', changefreq: 'yearly', priority: '0.3' },
  { loc: '/privacy', changefreq: 'yearly', priority: '0.3' },
];

const seen = new Set();
const unique = urls.filter((u) => !seen.has(u.loc) && seen.add(u.loc));

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique
  .map(
    (u) => `  <url>
    <loc>${SITE}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

writeFileSync(resolve(root, 'public/sitemap.xml'), xml, 'utf8');
console.log(`sitemap.xml: ${unique.length} адресов`);
