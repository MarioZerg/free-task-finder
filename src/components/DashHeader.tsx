import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import EditProfileDialog from '@/components/EditProfileDialog';
import SupportDialog from '@/components/SupportDialog';
import { useAppState } from '@/hooks/use-app-state';

const DashHeader = () => {
  const { user, logout } = useAppState();
  const [profileOpen, setProfileOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [menu, setMenu] = useState(false);
  if (!user) return null;

  const actions = (
    <>
      {user.isAdmin && (
        <Link
          to="/admin"
          className="rounded-full border border-line px-5 py-2.5 text-center text-sm transition-colors hover:border-primary/60"
        >
          Админка
        </Link>
      )}
      <button
        onClick={() => {
          setProfileOpen(true);
          setMenu(false);
        }}
        className="flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/60"
      >
        <Icon name="UserRound" size={16} />
        Мой профиль
      </button>
      <button
        onClick={() => {
          setSupportOpen(true);
          setMenu(false);
        }}
        className="flex items-center justify-center gap-2 rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/60"
      >
        <Icon name="LifeBuoy" size={16} />
        Техподдержка
      </button>
      <button
        onClick={logout}
        className="rounded-full border border-line px-5 py-2.5 text-sm transition-colors hover:border-primary/60"
      >
        Выйти
      </button>
    </>
  );

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between gap-4 px-5 py-4 md:px-10 md:py-5 lg:px-16">
        <Link to="/" className="font-head text-lg font-bold leading-none tracking-tight md:text-xl">
          ДОДЕЛАЙ<sup className="align-super text-[0.42em] font-normal">.РУ</sup>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setProfileOpen(true)}
            className="flex items-center gap-2.5 rounded-full border border-line py-1 pl-1 pr-3 transition-colors hover:border-primary/60 md:border-0 md:p-0"
          >
            <Avatar src={user.avatar} name={user.name} size={38} />
            <span className="hidden leading-tight sm:block">
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {user.name}
                {user.isPro && (
                  <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                    <Icon name="Crown" size={11} />
                    PRO
                  </span>
                )}
              </span>
              <span className="block text-xs text-chip">
                ★ {user.rating.toFixed(1)} ·{' '}
                {user.role === 'customer' ? 'заказчик' : `${user.doneCount} работ`}
              </span>
            </span>
          </button>

          <div className="hidden flex-wrap items-center gap-2 lg:flex">{actions}</div>

          <button
            onClick={() => setMenu((v) => !v)}
            aria-label="Меню"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-line lg:hidden"
          >
            <Icon name={menu ? 'X' : 'Menu'} size={18} />
          </button>
        </div>
      </div>

      {menu && (
        <div className="grid gap-2 border-t border-line px-5 py-4 lg:hidden">{actions}</div>
      )}

      <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
      <SupportDialog open={supportOpen} onOpenChange={setSupportOpen} />
    </header>
  );
};

export default DashHeader;