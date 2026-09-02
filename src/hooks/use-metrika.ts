import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const COUNTER_ID = 112255037;

declare global {
  interface Window {
    ym?: (id: number, action: string, ...args: unknown[]) => void;
  }
}

const useMetrika = () => {
  const { pathname, search } = useLocation();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (typeof window.ym !== 'function') return;
    window.ym(COUNTER_ID, 'hit', pathname + search, {
      title: document.title,
      referer: document.referrer,
    });
  }, [pathname, search]);
};

export default useMetrika;
