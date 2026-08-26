export type Role = 'customer' | 'executor';

export interface Executor {
  id: string;
  name: string;
  skill: string;
  city: string;
  rating: number;
  done: number;
  since: string;
  online: boolean;
}

export interface Customer {
  id: string;
  name: string;
  city: string;
  posted: number;
  since: string;
  verified: boolean;
}

export interface JobResponse {
  executorId: string;
  note: string;
}

export interface Job {
  id: string;
  title: string;
  description: string;
  price: number;
  city: string;
  when: string;
  category: string;
  photo?: string;
  ownerId: string;
  responses: JobResponse[];
  confirmed?: string;
}

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

export const executors: Executor[] = [
  {
    id: 'e1',
    name: 'Артём Ковалёв',
    skill: 'Грузчик, переезды',
    city: 'Ярославль, Заволжский район',
    rating: 4.9,
    done: 128,
    since: 'март 2024',
    online: true,
  },
  {
    id: 'e2',
    name: 'Сергей Дроздов',
    skill: 'Сантехника, мелкий ремонт',
    city: 'Ярославль, Кировский район',
    rating: 4.8,
    done: 94,
    since: 'январь 2024',
    online: true,
  },
  {
    id: 'e3',
    name: 'Марина Лисицына',
    skill: 'Уборка, сборка мебели',
    city: 'Ярославль, Дзержинский район',
    rating: 5.0,
    done: 61,
    since: 'июнь 2024',
    online: false,
  },
  {
    id: 'e4',
    name: 'Игорь Панкратов',
    skill: 'Дача, покос, вывоз мусора',
    city: 'Тутаев',
    rating: 4.7,
    done: 173,
    since: 'ноябрь 2023',
    online: false,
  },
  {
    id: 'e5',
    name: 'Даниил Хромов',
    skill: 'Электрика, установка техники',
    city: 'Ярославль, Фрунзенский район',
    rating: 4.9,
    done: 45,
    since: 'август 2024',
    online: true,
  },
  {
    id: 'e6',
    name: 'Ольга Ратникова',
    skill: 'Клининг после ремонта',
    city: 'Рыбинск',
    rating: 4.8,
    done: 88,
    since: 'февраль 2024',
    online: false,
  },
  {
    id: 'e7',
    name: 'Владимир Токарев',
    skill: 'Разнорабочий, погрузка',
    city: 'Ярославль, Красноперекопский район',
    rating: 4.6,
    done: 112,
    since: 'октябрь 2023',
    online: true,
  },
  {
    id: 'e8',
    name: 'Анна Севрюкова',
    skill: 'Уборка квартир, мытьё окон',
    city: 'Переславль-Залесский',
    rating: 4.9,
    done: 57,
    since: 'май 2024',
    online: false,
  },
];

export const customers: Customer[] = [
  {
    id: 'me',
    name: 'Максим Городецкий',
    city: 'Ярославль, Кировский район',
    posted: 2,
    since: 'сегодня',
    verified: true,
  },
  {
    id: 'c2',
    name: 'Никита Ершов',
    city: 'Ярославль, Заволжский район',
    posted: 7,
    since: 'апрель 2024',
    verified: true,
  },
  {
    id: 'c3',
    name: 'Людмила Сотникова',
    city: 'Ярославль, Дзержинский район',
    posted: 3,
    since: 'сентябрь 2024',
    verified: false,
  },
  {
    id: 'c4',
    name: 'Пётр Гаврилов',
    city: 'Рыбинск',
    posted: 12,
    since: 'декабрь 2023',
    verified: true,
  },
  {
    id: 'c5',
    name: 'Елена Барышева',
    city: 'Углич',
    posted: 5,
    since: 'июль 2024',
    verified: true,
  },
  {
    id: 'c6',
    name: 'Роман Дубровин',
    city: 'Ростов Великий',
    posted: 4,
    since: 'февраль 2025',
    verified: false,
  },
];

export const initialJobs: Job[] = [
  {
    id: 'j1',
    title: 'Перевезти диван',
    description:
      'Нужно вынести диван с 4 этажа без лифта на Свободе и довезти до дачи под Тутаевом. Машина своя, нужны две пары рук.',
    price: 1400,
    city: 'Ярославль, Кировский район',
    when: 'Сегодня до 19:00',
    category: 'Переезд и грузы',
    photo: PHOTO_MOVE,
    ownerId: 'me',
    responses: [
      { executorId: 'e1', note: 'Свободен с 15:00, есть ремни и перчатки.' },
      { executorId: 'e4', note: 'Готов подъехать, беру напарника.' },
    ],
  },
  {
    id: 'j2',
    title: 'Собрать шкаф',
    description: 'Шкаф-купе, две секции, квартира на Урицкого. Инструмент есть на месте.',
    price: 1200,
    city: 'Ярославль, Дзержинский район',
    when: 'Завтра, утро',
    category: 'Ремонт',
    photo: PHOTO_FURNITURE,
    ownerId: 'c3',
    responses: [{ executorId: 'e3', note: 'Собирала такой, часа за три сделаю.' }],
  },
  {
    id: 'j3',
    title: 'Убрать участок после зимы',
    description:
      'Шесть соток в СНТ под Тутаевом: собрать листву, обрезать кусты, вынести мусор к контейнеру.',
    price: 1500,
    city: 'Тутаев',
    when: 'Суббота, весь день',
    category: 'Дача и участок',
    photo: PHOTO_GARDEN,
    ownerId: 'me',
    responses: [
      { executorId: 'e4', note: 'Есть свой инструмент и прицеп для вывоза.' },
      { executorId: 'e2', note: 'Могу в субботу с утра.' },
    ],
  },
  {
    id: 'j4',
    title: 'Разгрузить фуру',
    description: 'Склад на Полушкиной роще. Коробки до 20 кг, около двух часов работы.',
    price: 1300,
    city: 'Ярославль, Красноперекопский район',
    when: 'Сегодня, 16:00',
    category: 'Переезд и грузы',
    ownerId: 'c2',
    responses: [{ executorId: 'e7', note: 'Подъеду к 15:40.' }],
  },
  {
    id: 'j5',
    title: 'Починить кран на кухне',
    description: 'Течёт смеситель, нужна замена картриджа. Деталь куплю сам.',
    price: 800,
    city: 'Ярославль, Заволжский район',
    when: 'Завтра, после 18:00',
    category: 'Ремонт',
    ownerId: 'c4',
    responses: [{ executorId: 'e2', note: 'Сделаю за час, картридж есть с собой.' }],
  },
  {
    id: 'j6',
    title: 'Уборка после ремонта',
    description: 'Двушка 54 м² в Рыбинске: снять плёнку, вымыть окна и полы, вынести мусор.',
    price: 1500,
    city: 'Рыбинск',
    when: 'Пятница',
    category: 'Уборка',
    ownerId: 'c2',
    responses: [],
  },
  {
    id: 'j7',
    title: 'Повесить телевизор на стену',
    description: 'Кронштейн есть, стена бетонная. Нужен перфоратор.',
    price: 700,
    city: 'Ярославль, Фрунзенский район',
    when: 'В любой день недели',
    category: 'Разное',
    ownerId: 'c3',
    responses: [{ executorId: 'e5', note: 'Инструмент свой, приеду вечером.' }],
  },
  {
    id: 'j8',
    title: 'Помочь с переездом студии',
    description: 'Вещи уже упакованы, 12 коробок и стол. Лифт работает.',
    price: 1100,
    city: 'Ярославль, Ленинский район',
    when: 'Воскресенье, 11:00',
    category: 'Переезд и грузы',
    ownerId: 'c4',
    responses: [],
  },
  {
    id: 'j9',
    title: 'Наколоть и сложить дрова',
    description: 'Кубометр берёзы у дома, колун на месте. Работа на пару часов.',
    price: 900,
    city: 'Углич',
    when: 'В выходные',
    category: 'Дача и участок',
    ownerId: 'c5',
    responses: [{ executorId: 'e4', note: 'Приеду в субботу утром.' }],
  },
  {
    id: 'j10',
    title: 'Помыть окна в кафе',
    description: 'Шесть больших окон на первом этаже, средства свои не нужны.',
    price: 1000,
    city: 'Ростов Великий',
    when: 'Четверг, до обеда',
    category: 'Уборка',
    ownerId: 'c6',
    responses: [{ executorId: 'e8', note: 'Есть стяжка и стремянка.' }],
  },
  {
    id: 'j11',
    title: 'Занести стройматериалы на 5 этаж',
    description: 'Десять мешков смеси и пачка гипсокартона, лифта нет.',
    price: 1200,
    city: 'Переславль-Залесский',
    when: 'Завтра, 10:00',
    category: 'Переезд и грузы',
    ownerId: 'c5',
    responses: [],
  },
  {
    id: 'j12',
    title: 'Расчистить двор и вывезти хлам',
    description: 'Старая мебель и коробки в частном доме, нужен человек с прицепом.',
    price: 1500,
    city: 'Гаврилов-Ям',
    when: 'На этой неделе',
    category: 'Разное',
    ownerId: 'c6',
    responses: [{ executorId: 'e7', note: 'Прицеп есть, вывезу за один заезд.' }],
  },
];

export const findExecutor = (id: string) => executors.find((e) => e.id === id);
export const findCustomer = (id: string) => customers.find((c) => c.id === id);

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