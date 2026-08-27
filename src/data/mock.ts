export const PHOTO_MOVE = '/img/job-move.jpg';
export const PHOTO_GARDEN = '/img/job-garden.jpg';
export const PHOTO_FURNITURE = '/img/job-furniture.jpg';

export const REGION = 'Ярославская область';

export const CITY_DISTRICTS: Record<string, string[]> = {
  Ярославль: [
    'Кировский район',
    'Ленинский район',
    'Дзержинский район',
    'Заволжский район',
    'Красноперекопский район',
    'Фрунзенский район',
  ],
  Рыбинск: ['Центр', 'Северный', 'Переборы', 'Мариевка', 'Веретье', 'Копаево'],
  Тутаев: ['Левый берег', 'Правый берег'],
  'Переславль-Залесский': [],
  Углич: [],
  'Ростов Великий': [],
  'Гаврилов-Ям': [],
  Данилов: [],
  Пошехонье: [],
  Мышкин: [],
  Некрасовское: [],
  Любим: [],
  Борисоглебский: [],
};

export const CITY_LIST = Object.keys(CITY_DISTRICTS);

export const CITIES = CITY_LIST.flatMap((c) => {
  const d = CITY_DISTRICTS[c];
  return d.length ? d.map((x) => `${c}, ${x}`) : [c];
});

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