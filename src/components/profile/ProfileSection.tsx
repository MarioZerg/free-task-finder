import { ReactNode, useState } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  icon: string;
  title: string;
  hint?: string;
  badge?: number;
  accent?: 'default' | 'gold';
  defaultOpen?: boolean;
  children: ReactNode;
}

const ProfileSection = ({
  icon,
  title,
  hint,
  badge,
  accent = 'default',
  defaultOpen = false,
  children,
}: Props) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-tile">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-[52px] w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface"
      >
        <Icon
          name={icon}
          size={17}
          className={`shrink-0 ${accent === 'gold' ? 'text-amber-600' : 'text-primary'}`}
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{title}</span>
          {hint && <span className="mt-0.5 block truncate text-xs text-chip">{hint}</span>}
        </span>
        {!!badge && (
          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        <Icon
          name="ChevronDown"
          size={17}
          className={`shrink-0 text-chip transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && <div className="border-t border-line bg-surface px-4 py-4">{children}</div>}
    </div>
  );
};

export default ProfileSection;
