export interface ProfessionMeta {
  slug: string;
  label: string;
  genitive: string;
  icon: string;
}

export const FEATURED_PROFESSIONS: ProfessionMeta[] = [
  { slug: 'handyman', label: 'Муж на час', genitive: 'мужа на час', icon: 'Wrench' },
  { slug: 'electrician', label: 'Электрик', genitive: 'электрика', icon: 'Zap' },
  { slug: 'plumber', label: 'Сантехник', genitive: 'сантехника', icon: 'Droplets' },
  { slug: 'mover', label: 'Грузчик', genitive: 'грузчика', icon: 'Package' },
  { slug: 'furniture', label: 'Сборка мебели', genitive: 'сборщика мебели', icon: 'Armchair' },
];

export interface ProfessionCityPage {
  professionSlug: string;
  citySlug: string;
  professionLabel: string;
  professionGenitive: string;
  icon: string;
  title: string;
  description: string;
  h1: string;
  intro: string;
}

export const PROFESSION_CITY_PAGES: ProfessionCityPage[] = [
  {
    professionSlug: 'electrician',
    citySlug: 'yaroslavl',
    professionLabel: 'Электрик',
    professionGenitive: 'электрика',
    icon: 'Zap',
    title: 'Электрик в Ярославле — Доделай.ру',
    description:
      'Ищете электрика в Ярославле? Смотрите анкеты исполнителей и разместите заявку бесплатно. Вход через MAX.',
    h1: 'Электрик в Ярославле',
    intro:
      'Розетка искрит, автомат выбивает, нужно повесить люстру или развести проводку в новой квартире — по таким задачам в Ярославле чаще всего ищут электрика на разовую работу. Разместите заявку с описанием и бюджетом — увидят все электрики города, а не только те, кого вы знаете лично.',
  },
  {
    professionSlug: 'electrician',
    citySlug: 'rybinsk',
    professionLabel: 'Электрик',
    professionGenitive: 'электрика',
    icon: 'Zap',
    title: 'Электрик в Рыбинске — Доделай.ру',
    description:
      'Нужен электрик в Рыбинске? Разместите задачу бесплатно или посмотрите анкеты исполнителей рядом. Вход через MAX.',
    h1: 'Электрик в Рыбинске',
    intro:
      'В Рыбинске много домов старой застройки, где проводка требует внимания: от замены автомата до полной разводки в квартире. Опишите задачу и укажите район — Центр, Переборы или Заволжье, — и электрик из Рыбинска сможет откликнуться быстрее.',
  },
  {
    professionSlug: 'plumber',
    citySlug: 'yaroslavl',
    professionLabel: 'Сантехник',
    professionGenitive: 'сантехника',
    icon: 'Droplets',
    title: 'Сантехник в Ярославле — Доделай.ру',
    description:
      'Ищете сантехника в Ярославле: течёт кран, забился стояк, нужно поставить унитаз? Заявка бесплатна. Вход через MAX.',
    h1: 'Сантехник в Ярославле',
    intro:
      'Потёк смеситель, засорилась труба, нужно поставить унитаз или заменить батарею — с такими задачами в Ярославле обычно не хотят ждать неделями. Опубликуйте заявку бесплатно, укажите район и удобное время, и подходящий сантехник свяжется напрямую.',
  },
  {
    professionSlug: 'plumber',
    citySlug: 'rybinsk',
    professionLabel: 'Сантехник',
    professionGenitive: 'сантехника',
    icon: 'Droplets',
    title: 'Сантехник в Рыбинске — Доделай.ру',
    description:
      'Нужен сантехник в Рыбинске? Найдите исполнителя рядом или разместите задачу бесплатно. Вход через MAX.',
    h1: 'Сантехник в Рыбинске',
    intro:
      'Сантехнические поломки редко ждут удобного момента, а в Рыбинске выбор мастеров на разовый вызов не такой большой, как в областном центре. Разместите задачу с описанием проблемы — так сантехнику проще сразу понять объём работы и предложить цену.',
  },
  {
    professionSlug: 'mover',
    citySlug: 'yaroslavl',
    professionLabel: 'Грузчик',
    professionGenitive: 'грузчика',
    icon: 'Package',
    title: 'Грузчик в Ярославле — Доделай.ру',
    description:
      'Нужен грузчик в Ярославле для переезда или разгрузки? Разместите задачу бесплатно. Вход через MAX.',
    h1: 'Грузчик в Ярославле',
    intro:
      'Переезд, разгрузка мебели или помощь донести стройматериалы на этаж без лифта — в Ярославле такие заявки закрываются быстро, особенно если указать точный адрес и время. Разместите задачу бесплатно, и грузчики города сами откликнутся с предложением.',
  },
  {
    professionSlug: 'mover',
    citySlug: 'rybinsk',
    professionLabel: 'Грузчик',
    professionGenitive: 'грузчика',
    icon: 'Package',
    title: 'Грузчик в Рыбинске — Доделай.ру',
    description:
      'Ищете грузчика в Рыбинске на переезд или разгрузку машины? Разместите заявку бесплатно. Вход через MAX.',
    h1: 'Грузчик в Рыбинске',
    intro:
      'Город растянут вдоль Волги, поэтому для грузчика в Рыбинске важно сразу видеть район — Центр, Заволжье или Переборы — и этаж. Опишите объём работы: переезд, разгрузка машины или перенос тяжёлых вещей, и разместите заявку бесплатно.',
  },
  {
    professionSlug: 'handyman',
    citySlug: 'yaroslavl',
    professionLabel: 'Муж на час',
    professionGenitive: 'мужа на час',
    icon: 'Wrench',
    title: 'Муж на час в Ярославле — Доделай.ру',
    description:
      'Нужен муж на час в Ярославле: повесить полку, починить кран, собрать мебель? Заявка бесплатна. Вход через MAX.',
    h1: 'Муж на час в Ярославле',
    intro:
      'Повесить полку, собрать стул, починить скрипящую дверь или сделать ещё десяток мелких дел по дому — с этим в Ярославле обычно зовут мужа на час, а не крупную бригаду. Опишите список задач в одной заявке — так удобнее и вам, и исполнителю.',
  },
  {
    professionSlug: 'handyman',
    citySlug: 'rybinsk',
    professionLabel: 'Муж на час',
    professionGenitive: 'мужа на час',
    icon: 'Wrench',
    title: 'Муж на час в Рыбинске — Доделай.ру',
    description:
      'Ищете мужа на час в Рыбинске для мелкого ремонта по дому? Разместите заявку бесплатно. Вход через MAX.',
    h1: 'Муж на час в Рыбинске',
    intro:
      'Не под каждую мелкую поломку в доме есть смысл вызывать отдельного мастера — в Рыбинске для этого чаще ищут мужа на час, который закроет сразу несколько дел за один визит. Разместите заявку с перечнем работ, и заинтересованный исполнитель откликнется сам.',
  },
  {
    professionSlug: 'furniture',
    citySlug: 'yaroslavl',
    professionLabel: 'Сборка мебели',
    professionGenitive: 'сборщика мебели',
    icon: 'Armchair',
    title: 'Сборка мебели в Ярославле — Доделай.ру',
    description:
      'Нужна сборка мебели в Ярославле: шкаф, кухня, кровать? Разместите задачу бесплатно. Вход через MAX.',
    h1: 'Сборка мебели в Ярославле',
    intro:
      'Новый шкаф, кухонный гарнитур или кровать собираются быстрее с опытными руками — в Ярославле на такую разовую работу чаще откликаются мастера, знакомые с популярными сборками. Укажите тип мебели и срок, и подходящий исполнитель свяжется сам.',
  },
  {
    professionSlug: 'furniture',
    citySlug: 'rybinsk',
    professionLabel: 'Сборка мебели',
    professionGenitive: 'сборщика мебели',
    icon: 'Armchair',
    title: 'Сборка мебели в Рыбинске — Доделай.ру',
    description:
      'Ищете мастера по сборке мебели в Рыбинске? Разместите задачу бесплатно, вход через MAX.',
    h1: 'Сборка мебели в Рыбинске',
    intro:
      'От сборки шкафа-купе до установки кухни — в Рыбинске такие задачи обычно закрывают за один визит мастера, если заранее прислать инструкцию или модель мебели. Разместите заявку бесплатно, и сборщик мебели сам оценит объём работы.',
  },
];

export const getProfessionCityPage = (
  professionSlug?: string,
  citySlug?: string,
): ProfessionCityPage | undefined =>
  PROFESSION_CITY_PAGES.find(
    (p) => p.professionSlug === professionSlug && p.citySlug === citySlug,
  );

export const getProfessionCityPagesBySlug = (professionSlug: string): ProfessionCityPage[] =>
  PROFESSION_CITY_PAGES.filter((p) => p.professionSlug === professionSlug);
