import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface Props {
  title: string;
  updated: string;
  intro: string;
  children: ReactNode;
}

const LegalLayout = ({ title, updated, intro, children }: Props) => (
  <div className="min-h-screen overflow-x-hidden bg-background font-body text-foreground">
    <header className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-8 md:px-10">
      <Link to="/" className="font-head text-lg font-bold tracking-tight">
        ШАБАШКА
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
      <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Документы</p>
      <h1 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
        {title}
      </h1>
      <p className="mt-3 text-sm text-chip">Редакция от {updated}</p>
      <p className="mt-6 max-w-[640px] text-base text-muted-foreground/85">{intro}</p>

      <div className="mt-12 space-y-4">{children}</div>

      <div className="mt-12 rounded-3xl border border-line bg-surface p-6 md:p-8">
        <p className="flex items-start gap-3 text-base text-muted-foreground/85">
          <Icon name="ShieldAlert" size={20} className="mt-0.5 shrink-0 text-primary" />
          Сервис бесплатный и является только доской объявлений. Всю ответственность за
          договорённости, оплату, качество и безопасность работ несут заказчики и исполнители
          самостоятельно.
        </p>
      </div>
    </main>
  </div>
);

export const LegalBlock = ({ title, items }: { title: string; items: string[] }) => (
  <section className="rounded-3xl border border-line bg-surface p-6 md:p-8">
    <h2 className="font-head text-xl font-medium tracking-tight md:text-2xl">{title}</h2>
    <ul className="mt-4 space-y-3">
      {items.map((t) => (
        <li key={t} className="flex gap-3 text-base text-muted-foreground/85">
          <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
          <span>{t}</span>
        </li>
      ))}
    </ul>
  </section>
);

export default LegalLayout;
