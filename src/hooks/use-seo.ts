import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  /** og:type страницы: website для разделов, article для текстовых */
  ogType?: string;
}

const setMeta = (name: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const setProp = (property: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

const SITE = 'https://dodelay.ru';

const toAbs = (url: string) => (url.startsWith('http') ? url : SITE + url);

const setLink = (rel: string, href: string, hreflang?: string) => {
  const sel = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.head.querySelector<HTMLLinkElement>(sel);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (hreflang) el.setAttribute('hreflang', hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

const setCanonical = (href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

export const useSeo = ({
  title,
  description,
  canonical,
  robots,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
}: SeoOptions) => {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setCanonical(canonical);
    setMeta('robots', robots || 'index, follow');

    setProp('og:title', ogTitle || title);
    setProp('og:description', ogDescription || description);
    setProp('og:url', canonical);
    setProp('og:type', ogType || 'website');
    setProp('og:locale', 'ru_RU');
    setProp('og:site_name', 'Доделай.ру');
    // Абсолютный адрес картинки — соцсети и Google не понимают относительный
    setProp('og:image', toAbs(ogImage || '/img/og-cover.jpg'));
    setProp('og:image:alt', ogTitle || title);
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', ogTitle || title);
    setMeta('twitter:description', ogDescription || description);
    setMeta('twitter:image', toAbs(ogImage || '/img/og-cover.jpg'));
    // Google использует hreflang даже для одноязычных сайтов
    setLink('alternate', canonical, 'ru-RU');

    // Разметка из index.html описывает главную. На внутренних страницах она
    // конфликтует со своей — два FAQPage и два BreadcrumbList Google не разбирает.
    const noindex = (robots || '').includes('noindex');
    const isHome = !noindex && canonical.replace(/\/+$/, '') === SITE;
    ['ld-home-faq', 'ld-home-breadcrumbs', 'ld-home-webpage'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.toggleAttribute('data-off', !isHome);
      if (el) el.setAttribute('type', isHome ? 'application/ld+json' : 'application/json');
    });
  }, [title, description, canonical, robots, ogTitle, ogDescription, ogImage, ogType]);
};

export default useSeo;