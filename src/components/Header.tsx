import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { initials } from '@/data/mock';

const links = [
  { href: '#feed', label: 'Лента заказов' },
  { href: '#how', label: 'Как это работает' },
  { href: '#executors', label: 'Исполнителям' },
  { href: '#people', label: 'О сервисе' },
];

const Header = () => {
  const { session, openLogin, logout } = useAppState();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <header className="absolute inset-x-0 top-0 z-40 animate-fade-plain">
      <div className="flex items-center justify-between px-6 py-7 md:px-16 md:py-11">
        <a href="#top" className="font-head text-xl font-bold leading-none tracking-tight md:text-2xl">
          ШАБАШКА<sup className="align-super text-[0.42em] font-normal">®</sup>
        </a>

        <nav className="hidden items-center gap-11 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="story-link text-base font-medium text-foreground/95">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden lg:block">
          {session ? (
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary font-head text-sm font-semibold text-primary-foreground">
                {initials(session.name)}
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-foreground/40 px-6 py-3 text-sm font-medium transition-colors hover:bg-foreground/10"
              >
                Выйти
              </button>
            </div>
          ) : (
            <button
              onClick={() => openLogin('customer')}
              className="rounded-full bg-primary px-9 py-4 text-base font-medium leading-none text-primary-foreground transition-transform hover:scale-[1.03]"
            >
              Войти через MAX
            </button>
          )}
        </div>

        <button
          className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/35 lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Меню"
        >
          <Icon name="Menu" size={20} />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-screen/95 px-6 py-7 animate-fade-plain backdrop-blur lg:hidden">
          <div className="flex items-center justify-between">
            <span className="font-head text-xl font-bold">ШАБАШКА</span>
            <button
              className="flex h-11 w-11 items-center justify-center rounded-full border border-foreground/35"
              onClick={() => setOpen(false)}
              aria-label="Закрыть"
            >
              <Icon name="X" size={20} />
            </button>
          </div>
          <nav className="mt-14 flex flex-col gap-7">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="font-head text-3xl font-medium tracking-tight"
              >
                {l.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto">
            {session ? (
              <button
                onClick={() => {
                  logout();
                  setOpen(false);
                }}
                className="w-full rounded-full border border-foreground/40 py-4 text-base font-medium"
              >
                Выйти
              </button>
            ) : (
              <button
                onClick={() => {
                  setOpen(false);
                  openLogin('customer');
                }}
                className="w-full rounded-full bg-primary py-4 text-base font-medium text-primary-foreground"
              >
                Войти через MAX
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
