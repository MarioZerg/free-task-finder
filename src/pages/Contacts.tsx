import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Breadcrumbs from '@/components/Breadcrumbs';
import useSeo from '@/hooks/use-seo';

const details = [
  { icon: 'Mail', label: 'Почта', value: 'support@dodelay.ru', href: 'mailto:support@dodelay.ru' },
  { icon: 'MapPin', label: 'Регион работы', value: 'Ярославская область: Ярославль, Рыбинск, Тутаев, Переславль-Залесский, Углич, Ростов Великий' },
  { icon: 'Clock', label: 'Время ответа', value: 'Отвечаем с 9:00 до 21:00, обычно в течение рабочего дня' },
];

const Contacts = () => {
  useSeo({
    title: 'Контакты — Доделай.ру',
    description:
      'Как связаться с сервисом Доделай.ру: почта поддержки, реквизиты ИП, регион работы и время ответа.',
    canonical: 'https://dodelay.ru/contacts',
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-background font-body text-foreground">
      <header className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-8 md:px-10">
        <Link to="/" className="font-head text-lg font-bold tracking-tight">
          ДОДЕЛАЙ.РУ
        </Link>
        <Link
          to="/"
          className="flex items-center gap-2 rounded-full border border-foreground/30 px-5 py-2.5 text-sm transition-colors hover:border-primary"
        >
          <Icon name="ArrowLeft" size={16} />
          На главную
        </Link>
      </header>

      <main className="mx-auto max-w-[900px] px-6 pb-24 md:px-10">
        <Breadcrumbs current="Контакты" />
        <p className="mt-6 text-sm uppercase tracking-[0.2em] text-foreground/60">Связь</p>
        <h1 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
          Контакты
        </h1>
        <p className="mt-3 text-sm text-chip">
          Информация обновлена <time dateTime="2026-08-29">29 августа 2026</time>
        </p>
        <p className="mt-6 max-w-[640px] text-base text-muted-foreground">
          Напишите нам, если объявление не публикуется, кто-то нарушает правила или нужна помощь с
          подпиской «Доделай PRO». Сервис бесплатный, поддержка — тоже.
        </p>

        <section className="mt-12 rounded-3xl border border-line bg-surface p-6 md:p-8">
          <h2 className="font-head text-xl font-medium tracking-tight md:text-2xl">
            Как с нами связаться
          </h2>
          <ul className="mt-6 space-y-6">
            {details.map((d) => (
              <li key={d.label} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                  <Icon name={d.icon} size={20} />
                </span>
                <div>
                  <p className="font-head text-base font-medium">{d.label}</p>
                  {d.href ? (
                    <a href={d.href} className="story-link text-base text-muted-foreground">
                      {d.value}
                    </a>
                  ) : (
                    <p className="text-base text-muted-foreground">{d.value}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-base text-muted-foreground">
            Если вы уже вошли через MAX, быстрее написать прямо из личного кабинета — в разделе
            поддержки: <Link to="/dashboard" className="story-link">кабинет Доделай.ру</Link>. Там
            видно вашу переписку и историю обращений.
          </p>
        </section>

        <section className="mt-6 rounded-3xl border border-line bg-surface p-6 md:p-8">
          <h2 className="font-head text-xl font-medium tracking-tight md:text-2xl">Реквизиты</h2>
          <ul className="mt-4 space-y-3">
            {[
              'Индивидуальный предприниматель, проект «Доделай.ру» (dodelay.ru).',
              'ИНН 760218194200.',
              'ОГРНИП 322774600341432.',
              'Подписка «Доделай PRO» — 990 ₽ в месяц, оплата через интернет-эквайринг Точка Банк.',
            ].map((t) => (
              <li key={t} className="flex gap-3 text-base text-muted-foreground">
                <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-3xl border border-line bg-surface p-6 md:p-8">
          <h2 className="font-head text-xl font-medium tracking-tight md:text-2xl">Документы</h2>
          <p className="mt-4 text-base text-muted-foreground">
            Перед публикацией задания посмотрите{' '}
            <Link to="/terms" className="story-link">условия использования и оферту</Link> и{' '}
            <Link to="/privacy" className="story-link">политику конфиденциальности</Link> — там
            написано, кто за что отвечает и какие данные видны другим участникам.
          </p>
        </section>

        <div className="mt-12 rounded-3xl border border-line bg-surface p-6 md:p-8">
          <p className="flex items-start gap-3 text-base text-muted-foreground">
            <Icon name="ShieldAlert" size={20} className="mt-0.5 shrink-0 text-primary" />
            Сервис бесплатный и является только доской объявлений. Мы не участвуем в расчётах и не
            можем вернуть деньги за работу — но разбираем жалобы на участников и блокируем
            нарушителей.
          </p>
        </div>

        <section className="mt-6 rounded-3xl border border-line bg-surface p-6 md:p-8">
          <h2 className="font-head text-xl font-medium tracking-tight md:text-2xl">
            Семантическое ядро для продвижения
          </h2>
          <p className="mt-4 max-w-[640px] text-base text-muted-foreground">
            Собранные ключевые запросы по тематике шабашки и подработки в Ярославской области — с
            разбивкой по городам, приоритету и типу интента. Пригодится для SEO и настройки
            контекстной рекламы.
          </p>
          <a
            href="/files/dodelay-semantic-core.xlsx"
            download
            className="mt-6 flex min-h-[44px] w-fit items-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Icon name="Download" size={18} />
            Скачать семантическое ядро (.xlsx)
          </a>
        </section>
      </main>
    </div>
  );
};

export default Contacts;