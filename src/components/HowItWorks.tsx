import { useState } from 'react';
import Icon from '@/components/ui/icon';

// Это не роли аккаунта, а два сценария: оба доступны с одного профиля.
type Scenario = 'order' | 'work';

const steps: Record<Scenario, { icon: string; title: string; text: string }[]> = {
  order: [
    { icon: 'LogIn', title: 'Вход через MAX', text: 'Ни анкет, ни паролей — один тап и вы внутри.' },
    { icon: 'ImagePlus', title: 'Объявление', text: 'Опишите задачу, добавьте фото — или обойдитесь без него.' },
    { icon: 'Users', title: 'Отклики', text: 'Исполнители из Ярославля и области видят заказ в ленте и откликаются.' },
    { icon: 'BadgeCheck', title: 'Подтверждение', text: 'Выбираете человека и подтверждаете его на задание.' },
  ],
  work: [
    { icon: 'LogIn', title: 'Вход через MAX', text: 'Регистрация занимает меньше минуты.' },
    { icon: 'Radio', title: 'Лента заказов', text: 'Живая лента: новые задачи появляются сами, без фильтров и поиска.' },
    { icon: 'Hand', title: 'Отклик', text: 'Пара слов автору задачи — и вы в списке кандидатов.' },
    { icon: 'Wallet', title: 'Работа и оплата', text: 'Автор подтвердил — договариваетесь напрямую, без комиссий.' },
  ],
};

const HowItWorks = () => {
  const [scenario, setScenario] = useState<Scenario>('order');

  return (
    <section id="how" className="bg-surface py-20 md:py-28">
      <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-chip">Как это работает</p>
            <h2 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
              Четыре шага от задачи до рук
            </h2>
          </div>

          <div className="flex gap-1 rounded-full border border-line p-1">
            {(['order', 'work'] as Scenario[]).map((r) => (
              <button
                key={r}
                onClick={() => setScenario(r)}
                className={`rounded-full px-6 py-2.5 text-sm font-medium transition-colors ${
                  scenario === r
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {r === 'order' ? 'Заказать' : 'Заработать'}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-12 grid gap-5 md:mt-16 md:grid-cols-2 lg:grid-cols-4">
          {steps[scenario].map((s, i) => (
            <article
              key={s.title}
              className="animate-fade-in rounded-3xl border border-line bg-tile p-7"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon name={s.icon} size={20} />
                </span>
                <span className="font-head text-3xl font-bold text-primary/15">0{i + 1}</span>
              </div>
              <h3 className="mt-6 font-head text-lg font-medium">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;