export const statusLabel: Record<string, string> = {
  open: 'В ленте',
  assigned: 'В работе',
  expiring: 'Время вышло',
  done: 'Завершён',
  cancelled: 'Отменён',
};

export const hoursLeft = (iso?: string | null) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return null;
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} ч ${m} мин` : `${m} мин`;
};

const DashTabs = ({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: { id: string; label: string; badge?: number }[];
}) => (
  <div className="scrollbar-none flex gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1">
    {items.map((t) => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={`flex min-h-[44px] shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-5 py-2.5 text-sm font-medium transition-colors sm:px-6 ${
          value === t.id ? 'role-accent-bg' : 'text-muted-foreground'
        }`}
      >
        {t.label}
        {!!t.badge && (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground">
            {t.badge > 99 ? '99+' : t.badge}
          </span>
        )}
      </button>
    ))}
  </div>
);

export default DashTabs;