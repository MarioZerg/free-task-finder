import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { money } from '@/data/mock';

const CUSTOMER = { name: 'Ольга', avatar: '/img/demo-customer.jpg' };
const EXECUTOR = { name: 'Игорь', avatar: '/img/demo-executor.jpg' };

const jobs = [
  { id: 1, title: 'Перевезти диван', price: 1400, when: 'Сегодня до 19:00', city: 'Ярославль' },
  { id: 2, title: 'Собрать шкаф', price: 1200, when: 'Завтра, утро', city: 'Рыбинск' },
  { id: 3, title: 'Убрать участок', price: 900, when: 'Суббота', city: 'Тутаев' },
];

const chat = [
  { from: 'executor', text: 'Готов взяться, свободен с 15:00' },
  { from: 'customer', text: 'Отлично! Адрес: Свободы, 42' },
  { from: 'executor', text: 'Буду через час 👍' },
];

const STEPS = 9;

const HeroPhone = () => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((v) => (v + 1) % STEPS), 1600);
    return () => window.clearInterval(id);
  }, []);

  const visibleJobs = Math.min(step + 1, jobs.length);
  const showChat = step >= 4;
  const bubbles = showChat ? Math.min(step - 3, chat.length) : 0;
  const typing = showChat && bubbles === chat.length;

  return (
    <div className="relative mx-auto h-[560px] w-full max-w-[300px] animate-rise rounded-[34px] bg-[linear-gradient(155deg,hsl(var(--screen))_0%,hsl(100_10%_22%)_100%)] p-3 shadow-[0_40px_70px_-38px_rgba(30,40,25,.45)] sm:h-[604px] sm:max-w-[322px]">
      <div className="flex h-full flex-col overflow-hidden rounded-3xl bg-screen px-4 py-5 text-[hsl(var(--primary-foreground))]">
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[0.72em] font-medium">
            {showChat ? 'Заказ в работе' : 'Лента заказов'}
          </div>
          <div className="flex items-center gap-1.5 text-[0.58em] opacity-70">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            онлайн
          </div>
        </div>

        {!showChat ? (
          <div className="flex flex-col gap-2.5">
            {jobs.slice(0, visibleJobs).map((job, i) => (
              <div
                key={job.id}
                className="animate-slide-up-in overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07]"
                style={{ animationDelay: `${i * 60}ms` }}
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
                  <div className="mt-2.5 flex items-center gap-2">
                    <img
                      src={CUSTOMER.avatar}
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                    />
                    <span className="text-[0.55em] opacity-70">{CUSTOMER.name}</span>
                    {i === 0 && visibleJobs > 1 && (
                      <span className="ml-auto rounded-full bg-white/15 px-2.5 py-1 text-[0.5em]">
                        1 отклик
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {step === 3 && (
              <div className="animate-bubble-in mt-1 flex items-center gap-2 rounded-2xl bg-emerald-500/15 px-3.5 py-3">
                <Icon name="CheckCheck" size={15} className="text-emerald-400" />
                <span className="text-[0.6em]">Игорь готов взяться</span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-1 flex-col">
            <div className="animate-bubble-in flex items-center gap-2.5 rounded-2xl border border-white/10 bg-white/[0.07] px-3.5 py-3">
              <img
                src={EXECUTOR.avatar}
                alt=""
                className="h-8 w-8 rounded-full object-cover"
              />
              <div className="min-w-0">
                <p className="text-[0.62em] font-medium">{EXECUTOR.name} · исполнитель</p>
                <p className="text-[0.52em] text-emerald-400">в сети</p>
              </div>
              <span className="ml-auto whitespace-nowrap font-head text-[0.8em] font-semibold">
                {money(1400)}
              </span>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              {chat.slice(0, bubbles).map((m, i) => {
                const mine = m.from === 'customer';
                return (
                  <div
                    key={i}
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

              {typing && (
                <div className="flex items-end gap-1.5">
                  <img
                    src={CUSTOMER.avatar}
                    alt=""
                    className="h-5 w-5 rounded-full object-cover"
                  />
                  <div className="flex gap-1 rounded-2xl bg-white/[0.09] px-3 py-2.5">
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="h-1.5 w-1.5 animate-typing rounded-full bg-white"
                        style={{ animationDelay: `${d * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-auto flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3.5 py-2.5">
              <span className="text-[0.55em] opacity-50">Написать сообщение</span>
              <span className="ml-auto flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/80">
                <Icon name="Send" size={11} />
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroPhone;