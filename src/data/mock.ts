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

export const PHOTO_MOVE =
  'https://cdn.poehali.dev/projects/a032f6d5-c7e1-400d-8414-440de4d4ad5f/files/3b8c85f1-3697-4058-98e2-a1fb22589706.jpg';
export const PHOTO_GARDEN =
  'https://cdn.poehali.dev/projects/a032f6d5-c7e1-400d-8414-440de4d4ad5f/files/b0e1a1ea-0aa9-42dd-8741-b76ddfa0e653.jpg';
export const PHOTO_FURNITURE =
  'https://cdn.poehali.dev/projects/a032f6d5-c7e1-400d-8414-440de4d4ad5f/files/f7b506d4-00dc-4078-8ece-f56a3bac34fc.jpg';

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
    city: 'Химки',
    rating: 4.9,
    done: 128,
    since: 'март 2024',
    online: true,
  },
  {
    id: 'e2',
    name: 'Сергей Дроздов',
    skill: 'Сантехника, мелкий ремонт',
    city: 'Москва, СЗАО',
    rating: 4.8,
    done: 94,
    since: 'январь 2024',
    online: true,
  },
  {
    id: 'e3',
    name: 'Марина Лисицына',
    skill: 'Уборка, сборка мебели',
    city: 'Долгопрудный',
    rating: 5.0,
    done: 61,
    since: 'июнь 2024',
    online: false,
  },
  {
    id: 'e4',
    name: 'Игорь Панкратов',
    skill: 'Дача, покос, вывоз мусора',
    city: 'Сходня',
    rating: 4.7,
    done: 173,
    since: 'ноябрь 2023',
    online: false,
  },
  {
    id: 'e5',
    name: 'Даниил Хромов',
    skill: 'Электрика, установка техники',
    city: 'Химки',
    rating: 4.9,
    done: 45,
    since: 'август 2024',
    online: true,
  },
  {
    id: 'e6',
    name: 'Ольга Ратникова',
    skill: 'Клининг после ремонта',
    city: 'Москва, САО',
    rating: 4.8,
    done: 88,
    since: 'февраль 2024',
    online: false,
  },
];

export const customers: Customer[] = [
  {
    id: 'me',
    name: 'Вы (демо-аккаунт)',
    city: 'Химки',
    posted: 2,
    since: 'сегодня',
    verified: true,
  },
  {
    id: 'c2',
    name: 'Никита Ершов',
    city: 'Химки',
    posted: 7,
    since: 'апрель 2024',
    verified: true,
  },
  {
    id: 'c3',
    name: 'Людмила Сотникова',
    city: 'Долгопрудный',
    posted: 3,
    since: 'сентябрь 2024',
    verified: false,
  },
  {
    id: 'c4',
    name: 'Пётр Гаврилов',
    city: 'Сходня',
    posted: 12,
    since: 'декабрь 2023',
    verified: true,
  },
];

export const initialJobs: Job[] = [
  {
    id: 'j1',
    title: 'Перевезти диван',
    description:
      'Нужно вынести диван с 4 этажа без лифта и довезти до дачи в Сходне. Машина своя, нужны две пары рук.',
    price: 2500,
    city: 'Химки',
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
    description: 'Шкаф-купе из IKEA, две секции. Инструмент есть на месте.',
    price: 1800,
    city: 'Долгопрудный',
    when: 'Завтра, утро',
    category: 'Ремонт',
    photo: PHOTO_FURNITURE,
    ownerId: 'c3',
    responses: [{ executorId: 'e3', note: 'Собирала такой, часа за три сделаю.' }],
  },
  {
    id: 'j3',
    title: 'Убрать участок после зимы',
    description: 'Шесть соток: собрать листву, обрезать кусты, вынести мусор к контейнеру.',
    price: 3000,
    city: 'Сходня',
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
    description: 'Коробки до 20 кг, около двух часов работы. Нужны 3 человека.',
    price: 4200,
    city: 'Химки',
    when: 'Сегодня, 16:00',
    category: 'Переезд и грузы',
    ownerId: 'c2',
    responses: [{ executorId: 'e1', note: 'Подъеду к 15:40.' }],
  },
  {
    id: 'j5',
    title: 'Починить кран на кухне',
    description: 'Течёт смеситель, нужна замена картриджа. Деталь куплю сам.',
    price: 1200,
    city: 'Москва, СЗАО',
    when: 'Завтра, после 18:00',
    category: 'Ремонт',
    ownerId: 'c4',
    responses: [{ executorId: 'e2', note: 'Сделаю за час, картридж есть с собой.' }],
  },
  {
    id: 'j6',
    title: 'Уборка после ремонта',
    description: 'Двушка 54 м², снять плёнку, вымыть окна и полы, вынести строймусор.',
    price: 5500,
    city: 'Москва, САО',
    when: 'Пятница',
    category: 'Уборка',
    ownerId: 'c2',
    responses: [],
  },
  {
    id: 'j7',
    title: 'Повесить телевизор на стену',
    description: 'Кронштейн есть, стена бетонная. Нужен перфоратор.',
    price: 1500,
    city: 'Химки',
    when: 'В любой день недели',
    category: 'Разное',
    ownerId: 'c3',
    responses: [{ executorId: 'e5', note: 'Инструмент свой, приеду вечером.' }],
  },
  {
    id: 'j8',
    title: 'Помочь с переездом студии',
    description: 'Вещи уже упакованы, 12 коробок и стол. Лифт работает.',
    price: 3200,
    city: 'Долгопрудный',
    when: 'Воскресенье, 11:00',
    category: 'Переезд и грузы',
    ownerId: 'c4',
    responses: [],
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
