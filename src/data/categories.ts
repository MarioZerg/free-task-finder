export interface CategoryMeta {
  id: string;
  label: string;
  short: string;
  icon: string;
  tone: string;
  dot: string;
}

export const CATEGORY_META: CategoryMeta[] = [
  {
    id: 'move',
    label: 'Переезд и грузы',
    short: 'Переезд',
    icon: 'Truck',
    tone: 'border-amber-500/25 bg-amber-500/10 text-amber-700',
    dot: 'bg-amber-500',
  },
  {
    id: 'repair',
    label: 'Ремонт',
    short: 'Ремонт',
    icon: 'Hammer',
    tone: 'border-sky-500/25 bg-sky-500/10 text-sky-700',
    dot: 'bg-sky-500',
  },
  {
    id: 'clean',
    label: 'Уборка',
    short: 'Уборка',
    icon: 'Sparkles',
    tone: 'border-teal-500/25 bg-teal-500/10 text-teal-700',
    dot: 'bg-teal-500',
  },
  {
    id: 'garden',
    label: 'Дача и участок',
    short: 'Дача',
    icon: 'Trees',
    tone: 'border-lime-600/25 bg-lime-600/10 text-lime-800',
    dot: 'bg-lime-600',
  },
  {
    id: 'other',
    label: 'Разное',
    short: 'Разное',
    icon: 'Wrench',
    tone: 'border-slate-500/25 bg-slate-500/10 text-slate-700',
    dot: 'bg-slate-500',
  },
];

const FALLBACK = CATEGORY_META[CATEGORY_META.length - 1];

export const categoryMeta = (name?: string): CategoryMeta => {
  if (!name) return FALLBACK;
  const key = name.trim().toLowerCase();
  return CATEGORY_META.find((c) => c.label.toLowerCase() === key) || FALLBACK;
};

export interface JobPreset {
  title: string;
  category: string;
  description: string;
  price: number;
}

export const PRESETS: JobPreset[] = [
  {
    title: 'Перевезти диван',
    category: 'Переезд и грузы',
    description: 'Нужно перевезти диван из квартиры в квартиру, помочь вынести и занести.',
    price: 1500,
  },
  {
    title: 'Помочь с погрузкой',
    category: 'Переезд и грузы',
    description: 'Нужны руки на погрузку вещей и коробок в машину, примерно на час работы.',
    price: 1000,
  },
  {
    title: 'Собрать шкаф',
    category: 'Ремонт',
    description: 'Нужно собрать шкаф-купе по инструкции, все детали и крепёж на месте.',
    price: 1200,
  },
  {
    title: 'Повесить люстру и карнизы',
    category: 'Ремонт',
    description: 'Нужно повесить люстру в зале и два карниза, инструмент у меня есть.',
    price: 900,
  },
  {
    title: 'Убрать квартиру после ремонта',
    category: 'Уборка',
    description: 'Нужна уборка двухкомнатной квартиры после ремонта: пыль, окна, полы.',
    price: 2500,
  },
  {
    title: 'Мытьё окон',
    category: 'Уборка',
    description: 'Нужно вымыть четыре окна с рамами и подоконниками, средства свои.',
    price: 1200,
  },
  {
    title: 'Скосить траву на участке',
    category: 'Дача и участок',
    description: 'Нужно скосить траву на участке около шести соток и собрать её в кучу.',
    price: 1500,
  },
  {
    title: 'Вскопать грядки',
    category: 'Дача и участок',
    description: 'Нужно вскопать несколько грядок на даче и убрать сорняки, инструмент есть.',
    price: 1400,
  },
  {
    title: 'Расчистить снег у дома',
    category: 'Разное',
    description: 'Нужно расчистить снег у частного дома: дорожка к калитке и место под машину.',
    price: 1000,
  },
  {
    title: 'Помочь донести покупки',
    category: 'Разное',
    description: 'Нужно помочь довезти и поднять покупки на этаж, лифта в доме нет.',
    price: 700,
  },
];
