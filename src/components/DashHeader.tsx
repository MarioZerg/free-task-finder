import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import EditProfileDialog from '@/components/EditProfileDialog';
import { useAppState } from '@/hooks/use-app-state';

const DashHeader = () => {
  const { user } = useAppState();
  const [profileOpen, setProfileOpen] = useState(false);
  if (!user) return null;

  return (
    <header className="safe-top sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur">
      <div className="safe-x mx-auto flex w-full max-w-[1400px] items-center justify-between gap-3 px-5 py-4 md:px-10 md:py-5 lg:px-16">
        <Link to="/" className="font-head text-lg font-bold leading-none tracking-tight md:text-xl">
          ДОДЕЛАЙ<sup className="align-super text-[0.42em] font-normal">.РУ</sup>
        </Link>

        <button
          onClick={() => setProfileOpen(true)}
          className="flex min-w-0 items-center gap-2.5 rounded-full border border-line py-1 pl-1 pr-2.5 transition-colors hover:border-primary/60"
        >
          <Avatar src={user.avatar} name={user.name} size={36} />
          <span className="hidden min-w-0 leading-tight sm:block">
            <span className="flex items-center gap-1.5 text-sm font-medium">
              <span className="truncate">{user.name}</span>
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
          <Icon name="ChevronDown" size={16} className="shrink-0 text-chip" />
        </button>
      </div>

      <EditProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </header>
  );
};

export default DashHeader;
