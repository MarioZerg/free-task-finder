import { useEffect } from 'react';

interface SeoOptions {
  title: string;
  description: string;
  canonical: string;
  robots?: string;
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

const setCanonical = (href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
};

export const useSeo = ({ title, description, canonical, robots }: SeoOptions) => {
  useEffect(() => {
    document.title = title;
    setMeta('description', description);
    setCanonical(canonical);
    setMeta('robots', robots || 'index, follow');
  }, [title, description, canonical, robots]);
};

export default useSeo;
