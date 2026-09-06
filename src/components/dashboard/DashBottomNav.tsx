import Icon from '@/components/ui/icon';

export interface BottomNavItem {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

/** Нижняя панель вкладок — как в мобильном приложении.
 *
 *  На телефоне вкладки кабинета жили в горизонтальной прокрутке вверху:
 *  чтобы попасть в «Людей», нужно было доскроллить полосу пальцем, а после
 *  прокрутки страницы вкладки уезжали за экран. Панель внизу всегда под
 *  большим пальцем и не зависит от того, где человек находится на странице.
 *  На планшетах и десктопе она скрыта — там хватает обычных вкладок.
 */
const DashBottomNav = ({
  value,
  onChange,
  items,
}: {
  value: string;
  onChange: (v: string) => void;
  items: BottomNavItem[];
}) => (
  <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 backdrop-blur md:hidden">
    <div className="flex items-stretch">
      {items.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            aria-current={active ? 'page' : undefined}
            className={`relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors ${
              active ? 'role-accent-text' : 'text-muted-foreground'
            }`}
          >
            <span className="relative">
              <Icon name={t.icon} size={22} />
              {!!t.badge && (
                <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold leading-none text-destructive-foreground">
                  {t.badge > 99 ? '99+' : t.badge}
                </span>
              )}
            </span>
            <span className="max-w-full truncate">{t.label}</span>
          </button>
        );
      })}
    </div>
  </nav>
);

export default DashBottomNav;
