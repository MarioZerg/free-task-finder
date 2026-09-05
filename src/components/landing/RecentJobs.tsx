import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import type { JobItem } from '@/lib/api';

/** Лента последних заявок для посадочных страниц.
 *  Даёт две вещи сразу: посетитель видит, что сервис живой и заказы
 *  реальные, а поисковик — регулярно обновляемый контент с датами. */

const MONTHS = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];

/** «15 минут назад», «3 часа назад», «5 сентября» */
const posted = (iso: string) => {
  const date = new Date(iso);
  const min = Math.floor((Date.now() - date.getTime()) / 60000);
  if (min < 1) return 'только что';
  if (min < 60) return `${min} мин назад`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} ч назад`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'вчера';
  if (d < 7) return `${d} дн назад`;
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
};

/** Машиночитаемая дата для атрибута datetime */
const iso = (s: string) => new Date(s).toISOString().slice(0, 10);

interface Props {
  /** Город в именительном падеже — фильтр ленты */
  cityNominative: string;
  /** Город в предложном падеже — для заголовка */
  cityPrepositional: string;
  /** Ссылка «смотреть все» */
  citySlug: string;
  /** Ограничение по категории — для страниц профессий */
  category?: string;
  /** Заголовок секции */
  heading?: string;
  limit?: number;
  /** Сдвиг выборки и подводки: страницы одного города показывают разные
   *  заказы и разные формулировки, иначе тексты дублируют друг друга. */
  seed?: number;
  /** Скрыть описания задач — на страницах, где текста и так много */
  compact?: boolean;
}

/** Подводка к ленте — вариант выбирается по seed страницы */
const LEADS = [
  'Реальные задачи, размещённые заказчиками. Чтобы откликнуться, войдите через MAX — отклик бесплатный.',
  'Это живые заявки из ленты, а не витрина примеров. Отклик ничего не стоит: вход через MAX занимает меньше минуты.',
  'Задачи опубликованы обычными людьми и ждут исполнителя. Комиссию с оплаты мы не берём — расчёт идёт напрямую.',
  'Свежие заявки за последние дни. Откликнуться может любой: сервис не берёт плату ни за доступ, ни за отклики.',
  'Заказы публикуют жители города каждый день. Выбирайте подходящий и связывайтесь с заказчиком без посредников.',
];

const RecentJobs = ({
  cityNominative,
  cityPrepositional,
  citySlug,
  category,
  heading,
  limit = 6,
  seed = 0,
  compact = false,
}: Props) => {
  const { feed, openLogin } = useAppState();

  const target = cityNominative.trim().toLowerCase();
  const all: JobItem[] = feed
    .filter((j) => j.city.split(',')[0].trim().toLowerCase() === target)
    .filter((j) => (category ? j.category === category : true))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  // Разные страницы одного города берут разный срез ленты: иначе шесть
  // страниц показывают шесть одинаковых карточек и выглядят копиями.
  const start = all.length > limit ? Math.abs(seed) % (all.length - limit + 1) : 0;
  const jobs = all.slice(start, start + limit);

  if (jobs.length === 0) return null;

  return (
    <section className="mt-16">
      <p className="text-sm uppercase tracking-[0.2em] text-chip">Лента</p>
      <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
        {heading || `Последние заказы в ${cityPrepositional}`}
      </h2>
      <p className="mt-3 max-w-[620px] text-sm text-muted-foreground">
        {LEADS[Math.abs(seed) % LEADS.length]}
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="flex flex-col rounded-3xl border border-line bg-surface p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-head text-base font-medium leading-snug text-foreground">
                {job.title}
              </h3>
              {job.price > 0 && (
                <span className="whitespace-nowrap rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                  {job.price.toLocaleString('ru-RU')} ₽
                </span>
              )}
            </div>

            {!compact && job.description && (
              <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {job.description}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-chip">
              <span className="flex items-center gap-1.5">
                <Icon name="MapPin" size={13} />
                {job.city.split(',')[0]}
              </span>
              <time dateTime={iso(job.createdAt)} className="flex items-center gap-1.5">
                <Icon name="Clock" size={13} />
                {posted(job.createdAt)}
              </time>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          to="/dashboard"
          className="flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
        >
          Смотреть все заказы
          <Icon name="ArrowRight" size={15} />
        </Link>
        <button
          onClick={() => openLogin('customer')}
          className="flex min-h-[44px] items-center rounded-full border border-line bg-surface px-6 text-sm font-medium transition-colors hover:border-primary"
        >
          Разместить задачу
        </button>
        <Link
          to={`/podrabotka/${citySlug}`}
          className="flex min-h-[44px] items-center text-sm text-chip underline decoration-line underline-offset-4 transition-colors hover:text-foreground"
        >
          Все специальности
        </Link>
      </div>
    </section>
  );
};

export default RecentJobs;