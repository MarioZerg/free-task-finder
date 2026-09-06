import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { money } from '@/data/mock';

const CUSTOMER = { name: 'Ольга', avatar: '/img/demo-customer.jpg' };
const EXECUTOR = { name: 'Игорь', avatar: '/img/demo-executor.jpg' };

/* Заказ-герой показываем последним в ленте: он самый свежий и с фото.
   История идёт от начала до конца — засор, мастер, чистый результат
   и отзыв, — чтобы человек за полминуты увидел весь путь сделки. */
const HERO_JOB = {
  title: 'SOS! Засорился унитаз',
  price: 1800,
  when: 'Сегодня, срочно',
  photo: '/img/demo-toilet-dirty.jpg',
  text: 'Вода не уходит, поднимается и уже на полу. Нужен сантехник срочно!',
};

const jobs = [
  { id: 1, title: 'Перевезти диван', price: 1400, when: 'Сегодня до 19:00', city: 'Ярославль' },
  { id: 2, title: 'Собрать шкаф', price: 1200, when: 'Завтра, утро', city: 'Рыбинск' },
];

const chat = [
  { from: 'executor', text: 'Сантехник, возьмусь. Буду через 40 минут' },
  { from: 'customer', text: 'Спасите! Свободы, 42, кв. 15' },
  { from: 'executor', text: 'Выезжаю, трос с собой 🔧' },
];

/* Сцены истории. Каждая — один экран телефона.
   Держим их списком, чтобы порядок читался с первого взгляда. */
type Scene = 'feed1' | 'feed2' | 'hero' | 'taken' | 'chat1' | 'chat2' | 'chat3' | 'done' | 'review';

const SCENES: Scene[] = [
  'feed1',
  'feed2',
  'hero',
  'taken',
  'chat1',
  'chat2',
  'chat3',
  'done',
  'review',
];

/* Финальные сцены держим дольше: там есть что разглядеть — фото
   результата и текст отзыва. Пролистывать их в общем темпе жалко. */
const HOLD: Partial<Record<Scene, number>> = {
  hero: 2600,
  taken: 1800,
  done: 3200,
  review: 4200,
};
const STEP_MS = 1700;

const HeroPhone = () => {
  const [i, setI] = useState(0);
  const scene = SCENES[i];

  useEffect(() => {
    const t = window.setTimeout(
      () => setI((v) => (v + 1) % SCENES.length),
      HOLD[scene] || STEP_MS,
    );
    return () => window.clearTimeout(t);
  }, [i, scene]);

  const at = SCENES.indexOf(scene);
  const showFeed = at <= SCENES.indexOf('taken');
  const showChat = scene === 'chat1' || scene === 'chat2' || scene === 'chat3';
  const bubbles = showChat ? at - SCENES.indexOf('chat1') + 1 : 0;
  // Лента наполняется с первой же сцены: пустой экран выглядел бы поломкой.
  const visibleJobs = Math.min(at + 1, jobs.length);
  const heroVisible = at >= SCENES.indexOf('hero');

  const header = showFeed
    ? 'Лента заказов'
    : showChat
      ? 'Заказ в работе'
      : scene === 'done'
        ? 'Работа принята'
        : 'Отзыв заказчика';

  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[300px] animate-rise rounded-[34px] bg-[linear-gradient(155deg,hsl(var(--screen))_0%,hsl(100_10%_22%)_100%)] p-3 shadow-[0_40px_70px_-38px_rgba(30,40,25,.45)] sm:h-[604px] sm:max-w-[322px]">
      <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-screen px-4 py-5 text-[hsl(var(--primary-foreground))]">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[0.72em] font-medium">{header}</div>
          <div className="flex items-center gap-1.5 text-[0.58em] opacity-70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            онлайн
          </div>
        </div>

        {showFeed && (
          <div className="flex flex-col gap-2.5">
            {/* Свежий заказ приходит наверх ленты — так это и выглядит вживую. */}
            {heroVisible && (
              <div className="animate-slide-up-in overflow-hidden rounded-2xl border border-emerald-400/40 bg-emerald-400/[0.08]">
                <div className="px-3.5 py-3">
                  <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2 py-0.5 text-[0.5em] font-medium text-emerald-300">
                    <Icon name="Sparkles" size={9} />
                    Новое · срочно
                  </div>
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="text-[0.7em] font-medium leading-snug">{HERO_JOB.title}</div>
                    <div className="whitespace-nowrap font-head text-[0.85em] font-semibold">
                      {money(HERO_JOB.price)}
                    </div>
                  </div>
                  <div className="mt-2.5 flex items-start gap-2.5">
                    <img
                      src={HERO_JOB.photo}
                      alt="Засорившийся унитаз"
                      className="h-14 w-14 shrink-0 rounded-xl border border-white/10 object-cover"
                    />
                    <p className="text-[0.55em] leading-relaxed opacity-75">{HERO_JOB.text}</p>
                  </div>
                  <div className="mt-2.5 flex items-center gap-2">
                    <img
                      src={CUSTOMER.avatar}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                    <span className="text-[0.55em] opacity-70">{CUSTOMER.name}</span>
                    <span className="ml-auto text-[0.5em] opacity-60">{HERO_JOB.when}</span>
                  </div>
                </div>
              </div>
            )}

            {jobs.slice(0, visibleJobs).map((job, n) => (
              <div
                key={job.id}
                className="animate-slide-up-in overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07]"
                style={{ animationDelay: `${n * 60}ms` }}
              >
                <div className="px-3.5 py-3">
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="text-[0.7em] font-medium leading-snug">{job.title}</div>
                    <div className="whitespace-nowrap font-head text-[0.85em] font-semibold">
                      {money(job.price)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[0.55em] opacity-60">
                    <span>{job.city}</span>
                    <span>·</span>
                    <span>{job.when}</span>
                  </div>
                </div>
              </div>
            ))}

            {scene === 'taken' && (
              <div className="animate-bubble-in mt-1 flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-3.5 py-3">
                <img src={EXECUTOR.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                <span className="text-[0.6em]">Игорь, сантехник — готов взяться</span>
                <Icon name="CheckCheck" size={14} className="ml-auto text-emerald-400" />
              </div>
            )}
          </div>
        )}

        {showChat && (
          <div className="flex flex-1 flex-col">
            <div className="animate-bubble-in flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-3">
              <img src={EXECUTOR.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="text-[0.62em] font-medium">{EXECUTOR.name} · сантехник</p>
                <p className="text-[0.52em] text-emerald-400">в сети</p>
              </div>
              <span className="ml-auto whitespace-nowrap font-head text-[0.8em] font-semibold">
                {money(HERO_JOB.price)}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {chat.slice(0, bubbles).map((m, n) => {
                const mine = m.from === 'customer';
                return (
                  <div
                    key={n}
                    className={`flex animate-bubble-in items-end gap-1.5 ${
                      mine ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <img
                      src={mine ? CUSTOMER.avatar : EXECUTOR.avatar}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                    <div
                      className={`max-w-[78%] rounded-2xl px-3 py-2 text-[0.58em] leading-snug ${
                        mine ? 'bg-emerald-500/25' : 'bg-white/[0.09]'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
              <span className="text-[0.55em] opacity-50">Написать сообщение</span>
              <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/80">
                <Icon name="Send" size={11} />
              </span>
            </div>
          </div>
        )}

        {/* Заказчик выкладывает фото результата: до и после рядом —
            самое убедительное доказательство, что работа сделана. */}
        {scene === 'done' && (
          <div className="animate-bubble-in flex flex-1 flex-col">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="mb-1.5 text-[0.5em] uppercase tracking-wider opacity-50">Было</p>
                <img
                  src={HERO_JOB.photo}
                  alt="Засорившийся унитаз до работы"
                  className="h-28 w-full rounded-xl border border-white/10 object-cover opacity-70"
                />
              </div>
              <div>
                <p className="mb-1.5 text-[0.5em] uppercase tracking-wider text-emerald-300">
                  Стало
                </p>
                <img
                  src="/img/demo-toilet-clean.jpg"
                  alt="Чистый унитаз после работы"
                  className="h-28 w-full rounded-xl border border-emerald-400/40 object-cover"
                />
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-3.5 py-3">
              <Icon name="CircleCheck" size={16} className="shrink-0 text-emerald-400" />
              <span className="text-[0.58em] leading-snug">
                Игорь всё починил и убрал за собой
              </span>
            </div>

            <div className="mt-2.5 flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-3">
              <span className="text-[0.58em] opacity-70">Заказ закрыт на</span>
              <span className="ml-auto font-head text-[0.85em] font-semibold">
                {money(HERO_JOB.price)}
              </span>
            </div>
          </div>
        )}

        {scene === 'review' && (
          <div className="animate-bubble-in flex flex-1 flex-col">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5">
              <div className="flex items-center gap-2.5">
                <img src={EXECUTOR.avatar} alt="" className="h-9 w-9 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="text-[0.62em] font-medium">{EXECUTOR.name}</p>
                  <p className="text-[0.5em] opacity-60">сантехник · Ярославль</p>
                </div>
                <span className="ml-auto flex gap-0.5 text-[0.7em] text-amber-300">★★★★★</span>
              </div>

              <p className="mt-3 text-[0.58em] leading-relaxed opacity-85">
                «Приехал через полчаса, всё пробил и вымыл так, что стало чище, чем было.
                Спасибо, буду обращаться!»
              </p>

              <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-2.5">
                <img src={CUSTOMER.avatar} alt="" className="h-5 w-5 rounded-full object-cover" />
                <span className="text-[0.52em] opacity-60">{CUSTOMER.name} · заказчик</span>
                <span className="ml-auto text-[0.52em] opacity-60">{money(HERO_JOB.price)}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-3.5 py-3">
              <Icon name="TrendingUp" size={15} className="shrink-0 text-emerald-400" />
              <span className="text-[0.55em] leading-snug">
                Рейтинг Игоря вырос — заказов станет больше
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroPhone;
