import { useEffect, useRef } from 'react';

/**
 * Живое обновление данных.
 *
 * Обновляем часто, пока человек реально смотрит на страницу, и притормаживаем,
 * когда он отошёл: это держит ленту актуальной, не насилуя сервер и батарею
 * телефона. Скрытая вкладка не опрашивает сервер вообще, а при возврате
 * данные подтягиваются сразу — чтобы не встречать пользователя устаревшим
 * экраном.
 */
export const useLive = (fn: () => void, activeMs: number, idleMs = activeMs * 4) => {
  const saved = useRef(fn);
  saved.current = fn;

  useEffect(() => {
    let timer = 0;
    let lastAct = Date.now();

    const idle = () => Date.now() - lastAct > 120000;

    const tick = () => {
      if (document.visibilityState === 'visible') saved.current();
      timer = window.setTimeout(tick, idle() ? idleMs : activeMs);
    };
    timer = window.setTimeout(tick, activeMs);

    const wake = () => {
      lastAct = Date.now();
      if (document.visibilityState === 'visible') saved.current();
    };
    const touch = () => {
      lastAct = Date.now();
    };

    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);
    window.addEventListener('focus', wake);
    window.addEventListener('pointerdown', touch, { passive: true });
    window.addEventListener('keydown', touch);
    window.addEventListener('scroll', touch, { passive: true });

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
      window.removeEventListener('focus', wake);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('keydown', touch);
      window.removeEventListener('scroll', touch);
    };
  }, [activeMs, idleMs]);
};

export default useLive;
