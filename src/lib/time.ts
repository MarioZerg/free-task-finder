/**
 * Время на сайте — всегда московское.
 *
 * Сервис работает в Ярославской области, живёт по Москве, и человек должен
 * видеть одно и то же время независимо от того, где стоят часы его телефона.
 * Иначе исполнитель в другом часовом поясе прочитает «приходите к 9:00»
 * буквально и приедет не в тот час.
 *
 * Сервер отдаёт метки в UTC, поэтому пересчёт делаем здесь, в одном месте.
 */
export const MSK = 'Europe/Moscow';

const opts = (o: Intl.DateTimeFormatOptions): Intl.DateTimeFormatOptions => ({
  timeZone: MSK,
  ...o,
});

/** Только часы и минуты: «15:30». */
export const timeMsk = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', opts({ hour: '2-digit', minute: '2-digit' }));

/** День и месяц: «15 янв». */
export const dayMsk = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', opts({ day: 'numeric', month: 'short' }));

/** Дата целиком: «15 января 2026». */
export const dateMsk = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', opts({ day: 'numeric', month: 'long', year: 'numeric' }));

/** Дата и время: «15 янв 15:30». */
export const dateTimeMsk = (iso: string) =>
  new Date(iso).toLocaleDateString('ru-RU', opts({
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }));

/** Текущее время в Москве — часы и минуты. */
export const nowMsk = () =>
  new Date().toLocaleTimeString('ru-RU', opts({ hour: '2-digit', minute: '2-digit' }));

/**
 * «5 минут назад», «2 часа назад».
 * Считаем в абсолютных секундах, поэтому часовой пояс тут не важен —
 * разница между моментами одинакова в любой точке мира.
 */
export const agoMsk = (iso: string) => {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 60) return 'только что';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} дн назад`;
  return dateMsk(iso);
};
