export const PHOTO_MOVE = '/img/job-move.jpg';
export const PHOTO_GARDEN = '/img/job-garden.jpg';
export const PHOTO_FURNITURE = '/img/job-furniture.jpg';

export const REGION = 'Ярославская область';

export const CITIES = [
  'Ярославль, Кировский район',
  'Ярославль, Заволжский район',
  'Ярославль, Дзержинский район',
  'Ярославль, Фрунзенский район',
  'Ярославль, Красноперекопский район',
  'Ярославль, Ленинский район',
  'Рыбинск',
  'Тутаев',
  'Переславль-Залесский',
  'Углич',
  'Ростов Великий',
  'Гаврилов-Ям',
];

export const CATEGORIES = [
  'Все',
  'Переезд и грузы',
  'Ремонт',
  'Уборка',
  'Дача и участок',
  'Разное',
];

export const initials = (name: string) =>
  name
    .replace(/\(.*\)/, '')
    .trim()
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

export const money = (v: number) => `${v.toLocaleString('ru-RU')} ₽`;
