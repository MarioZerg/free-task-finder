import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
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
}: SeoOptions) => {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setCanonical(canonical);
    setMeta('robots', robots || 'index, follow');

    setProp('og:title', ogTitle || title);
    setProp('og:description', ogDescription || description);
    setProp('og:url', canonical);
    setProp('og:image', ogImage || '/img/movers.jpg');
    setMeta('twitter:title', ogTitle || title);
    setMeta('twitter:description', ogDescription || description);
  }, [title, description, canonical, robots, ogTitle, ogDescription, ogImage]);
};

export default useSeo;
