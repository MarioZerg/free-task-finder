import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { money } from '@/data/mock';

const CUSTOMER = { name: 'Ольга', avatar: '/img/demo-customer.jpg' };
const EXECUTOR = { name: 'Игорь', avatar: '/img/demo-executor.jpg' };

/* Заказ-герой встаёт в конец ленты, как обычная новая задача.
   Раньше он выпрыгивал наверх и это читалось как сбой: список
   дёргался, глаз терял место. Теперь лента просто дополняется. */
const HERO_JOB = {
  title: 'Засорился унитаз',
  price: 1800,
  when: 'Сегодня, срочно',
  photo: '/img/demo-toilet-dirty.jpg',
  text: 'Вода не уходит и уже на полу. Нужен сантехник срочно!',
};

const jobs = [
  { id: 1, title: 'Перевезти диван', price: 1400, when: 'Сегодня до 19:00', city: 'Ярославль' },
  { id: 2, title: 'Собрать шкаф', price: 1200, when: 'Завтра, утро', city: 'Рыбинск' },
];

const chat = [
  { from: 'executor', text: 'Сантехник, возьмусь. Буду через 40 минут' },
  { from: 'customer', text: 'Спасите! Свободы, 42, кв. 15' },
];

/* Сцены истории. Каждая — один экран телефона.
   Порядок читается сверху вниз, как сама история. */
type Scene =
  | 'feed1'
  | 'feed2'
  | 'hero'
  | 'taking'
  | 'taken'
  | 'chat1'
  | 'chat2'
  | 'photo'
  | 'closing'
  | 'review';

const SCENES: Scene[] = [
  'feed1',
  'feed2',
  'hero',
  'taking',
  'taken',
  'chat1',
  'chat2',
  'photo',
  'closing',
  'review',
];

/* Каждой сцене — своё время. Там, где есть что прочитать или разглядеть,
   держим дольше: анимация должна успевать за глазами, а не наоборот. */
const HOLD: Record<Scene, number> = {
  feed1: 2200,
  feed2: 2200,
  hero: 4200,
  taking: 2800,
  taken: 3200,
  chat1: 2800,
  chat2: 2800,
  photo: 4500,
  closing: 3400,
  review: 5500,
};

const HeroPhone = () => {
  const [i, setI] = useState(0);
  const scene = SCENES[i];

  useEffect(() => {
    const t = window.setTimeout(() => setI((v) => (v + 1) % SCENES.length), HOLD[scene]);
    return () => window.clearTimeout(t);
  }, [i, scene]);

  const at = SCENES.indexOf(scene);
  const showFeed = at <= SCENES.indexOf('taken');
  const showChat = scene === 'chat1' || scene === 'chat2';
  const bubbles = showChat ? at - SCENES.indexOf('chat1') + 1 : 0;
  const heroVisible = at >= SCENES.indexOf('hero');

  const header = showFeed
    ? 'Лента заказов'
    : showChat
      ? 'Заказ в работе'
      : scene === 'photo'
        ? 'Работа выполнена'
        : scene === 'closing'
          ? 'Заказчик принимает'
          : 'Отзыв заказчика';

  return (
    <div className="relative mx-auto h-[600px] w-full max-w-[340px] animate-rise rounded-[38px] bg-[linear-gradient(155deg,hsl(var(--screen))_0%,hsl(100_10%_22%)_100%)] p-3 shadow-[0_40px_70px_-38px_rgba(30,40,25,.45)] sm:h-[660px] sm:max-w-[372px]">
      <div className="flex h-full flex-col overflow-hidden rounded-[30px] bg-screen px-4 py-5 text-[hsl(var(--primary-foreground))]">
        <div className="mb-3.5 flex items-center justify-between">
          <div className="text-base font-medium">{header}</div>
          <div className="flex items-center gap-1.5 text-xs opacity-70">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            онлайн
          </div>
        </div>

        {showFeed && (
          <div className="flex flex-col gap-2.5">
            {jobs.map((job, n) => (
              <div
                key={job.id}
                className="animate-slide-up-in overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07]"
                style={{ animationDelay: `${n * 80}ms` }}
              >
                <div className="px-4 py-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[15px] font-medium leading-snug">{job.title}</div>
                    <div className="whitespace-nowrap font-head text-[17px] font-semibold">
                      {money(job.price)}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs opacity-60">
                    <span>{job.city}</span>
                    <span>·</span>
                    <span>{job.when}</span>
                  </div>
                </div>
              </div>
            ))}

            {/* Новый заказ встаёт в конец списка — так же, как в жизни. */}
            {heroVisible && (
              <div className="animate-slide-up-in overflow-hidden rounded-2xl border border-emerald-400/40 bg-emerald-400/[0.09]">
                <div className="px-4 py-3.5">
                  <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-400/20 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                    <Icon name="Sparkles" size={11} />
                    Новый заказ
                  </div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-[15px] font-medium leading-snug">{HERO_JOB.title}</div>
                    <div className="whitespace-nowrap font-head text-[17px] font-semibold">
                      {money(HERO_JOB.price)}
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-3">
                    <img
                      src={HERO_JOB.photo}
                      alt="Засорившийся унитаз"
                      className="h-16 w-16 shrink-0 rounded-xl border border-white/10 object-cover"
                    />
                    <p className="text-xs leading-relaxed opacity-80">{HERO_JOB.text}</p>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <img
                      src={CUSTOMER.avatar}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <span className="text-xs opacity-75">{CUSTOMER.name}</span>
                    <span className="ml-auto text-[11px] opacity-60">{HERO_JOB.when}</span>
                  </div>

                  {/* Показываем сам момент отклика: сначала кнопка, потом нажатие. */}
                  {scene === 'taking' && (
                    <div className="animate-bubble-in mt-3 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-2.5 text-[13px] font-medium text-white">
                      <Icon name="Hand" size={15} />
                      Откликнуться
                    </div>
                  )}
                </div>
              </div>
            )}

            {scene === 'taken' && (
              <div className="animate-bubble-in flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 px-4 py-3.5">
                <img src={EXECUTOR.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium">Игорь взял заказ</p>
                  <p className="text-[11px] opacity-65">сантехник · 4 года на сервисе</p>
                </div>
                <Icon name="CheckCheck" size={17} className="ml-auto shrink-0 text-emerald-400" />
              </div>
            )}
          </div>
        )}

        {showChat && (
          <div className="flex flex-1 flex-col">
            <div className="animate-bubble-in flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-3.5">
              <img src={EXECUTOR.avatar} alt="" className="h-10 w-10 rounded-full object-cover" />
              <div className="min-w-0">
                <p className="text-[14px] font-medium">{EXECUTOR.name} · сантехник</p>
                <p className="text-xs text-emerald-400">в сети</p>
              </div>
              <span className="ml-auto whitespace-nowrap font-head text-[16px] font-semibold">
                {money(HERO_JOB.price)}
              </span>
            </div>

            <div className="mt-4 flex flex-col gap-2.5">
              {chat.slice(0, bubbles).map((m, n) => {
                const mine = m.from === 'customer';
                return (
                  <div
                    key={n}
                    className={`flex animate-bubble-in items-end gap-2 ${
                      mine ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <img
                      src={mine ? CUSTOMER.avatar : EXECUTOR.avatar}
                      alt=""
                      className="h-6 w-6 rounded-full object-cover"
                    />
                    <div
                      className={`max-w-[78%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                        mine ? 'bg-emerald-500/25' : 'bg-white/[0.09]'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3">
              <span className="text-xs opacity-50">Написать сообщение</span>
              <span className="ml-auto flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/80">
                <Icon name="Send" size={13} />
              </span>
            </div>
          </div>
        )}

        {/* Исполнитель показывает результат: фото до и после рядом —
            самое убедительное доказательство, что работа сделана. */}
        {scene === 'photo' && (
          <div className="animate-bubble-in flex flex-1 flex-col">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wider opacity-50">Было</p>
                <img
                  src={HERO_JOB.photo}
                  alt="Засорившийся унитаз до работы"
                  className="h-36 w-full rounded-xl border border-white/10 object-cover opacity-70"
                />
              </div>
              <div>
                <p className="mb-2 text-[11px] uppercase tracking-wider text-emerald-300">Стало</p>
                <img
                  src="/img/demo-toilet-clean.jpg"
                  alt="Чистый унитаз после работы"
                  className="h-36 w-full rounded-xl border border-emerald-400/40 object-cover"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 px-4 py-3.5">
              <img src={EXECUTOR.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
              <span className="text-[13px] leading-snug">
                Игорь: «Прочистил, всё убрал. Принимайте!»
              </span>
            </div>
          </div>
        )}

        {/* Заказ закрывает заказчик — это его решение и его подтверждение. */}
        {scene === 'closing' && (
          <div className="animate-bubble-in flex flex-1 flex-col">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-4 py-4">
              <p className="text-[14px] font-medium">Принять работу?</p>
              <p className="mt-1.5 text-xs leading-relaxed opacity-70">
                Подтвердите, что задача решена. После этого сможете оставить отзыв.
              </p>

              <div className="mt-4 flex items-center justify-between rounded-2xl bg-white/[0.06] px-3.5 py-3">
                <span className="text-[13px] opacity-75">Итоговая сумма</span>
                <span className="font-head text-[18px] font-semibold">
                  {money(HERO_JOB.price)}
                </span>
              </div>

              <div className="mt-3.5 flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-4 py-3 text-[14px] font-medium text-white">
                <Icon name="Check" size={16} />
                Работа принята
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 px-4 py-3.5">
              <img src={CUSTOMER.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
              <span className="text-xs leading-snug opacity-85">
                Ольга закрыла заказ и рассчиталась напрямую
              </span>
            </div>
          </div>
        )}

        {scene === 'review' && (
          <div className="animate-bubble-in flex flex-1 flex-col">
            <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4">
              <div className="flex items-center gap-3">
                <img src={EXECUTOR.avatar} alt="" className="h-11 w-11 rounded-full object-cover" />
                <div className="min-w-0">
                  <p className="text-[14px] font-medium">{EXECUTOR.name}</p>
                  <p className="text-[11px] opacity-60">сантехник · Ярославль</p>
                </div>
                <span className="ml-auto text-[15px] text-amber-300">★★★★★</span>
              </div>

              <p className="mt-3.5 text-[13px] leading-relaxed opacity-90">
                «Приехал через полчаса, всё пробил и вымыл так, что стало чище, чем было.
                Спасибо, буду обращаться!»
              </p>

              <div className="mt-3.5 flex items-center gap-2 border-t border-white/10 pt-3">
                <img src={CUSTOMER.avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                <span className="text-xs opacity-60">{CUSTOMER.name} · заказчик</span>
                <span className="ml-auto text-xs opacity-60">{money(HERO_JOB.price)}</span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-emerald-500/15 px-4 py-3.5">
              <Icon name="TrendingUp" size={17} className="shrink-0 text-emerald-400" />
              <span className="text-xs leading-snug">
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
