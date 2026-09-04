import Icon from '@/components/ui/icon';

export type SectionId =
  | 'overview'
  | 'moderation'
  | 'support'
  | 'jobs'
  | 'reviews'
  | 'users'
  | 'broadcast'
  | 'preview'
  | 'sandbox';

export interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
  hint: string;
}

export const navGroups: { title: string; items: NavItem[] }[] = [
  {
    title: 'Обзор',
    items: [
      {
        id: 'overview',
        label: 'Сводка',
        icon: 'LayoutDashboard',
        hint: 'Ключевые цифры сервиса',
      },
    ],
  },
  {
    title: 'Требует внимания',
    items: [
      {
        id: 'moderation',
        label: 'Модерация',
        icon: 'ShieldCheck',
        hint: 'Проверка новых заданий перед публикацией',
      },
      {
        id: 'support',
        label: 'Обращения',
        icon: 'LifeBuoy',
        hint: 'Вопросы и жалобы от пользователей',
      },
    ],
  },
  {
    title: 'Содержимое',
    items: [
      {
        id: 'jobs',
        label: 'Заказы',
        icon: 'ClipboardList',
        hint: 'Все задания сервиса и управление ими',
      },
      {
        id: 'reviews',
        label: 'Отзывы',
        icon: 'Star',
        hint: 'Оценки участников друг другу',
      },
      {
        id: 'users',
        label: 'Пользователи',
        icon: 'Users',
        hint: 'Участники сервиса, блокировка и правка',
      },
    ],
  },
  {
    title: 'Инструменты',
    items: [
      {
        id: 'broadcast',
        label: 'Рассылка',
        icon: 'Send',
        hint: 'Сообщение участникам в MAX',
      },
      {
        id: 'preview',
        label: 'Глазами роли',
        icon: 'Eye',
        hint: 'Как сервис видят заказчик и исполнитель',
      },
      {
        id: 'sandbox',
        label: 'Тестовые кабинеты',
        icon: 'FlaskConical',
        hint: 'Войти демо-аккаунтом и всё проверить',
      },
    ],
  },
];

export const allNavItems: NavItem[] = navGroups.flatMap((g) => g.items);

const AdminNav = ({
  active,
  onSelect,
  badges,
}: {
  active: SectionId;
  onSelect: (id: SectionId) => void;
  badges: Partial<Record<SectionId, number>>;
}) => (
  <nav className="flex flex-col gap-6">
    {navGroups.map((group) => (
      <div key={group.title}>
        <p className="px-3 text-[11px] uppercase tracking-[0.16em] text-chip">
          {group.title}
        </p>
        <div className="mt-2 flex flex-col gap-1">
          {group.items.map((item) => {
            const on = active === item.id;
            const count = badges[item.id] || 0;
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`flex min-h-[44px] w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-sm transition-colors ${
                  on
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-tile hover:text-foreground'
                }`}
              >
                <Icon name={item.icon} size={17} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
                {count > 0 && (
                  <span
                    className={`flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none ${
                      on
                        ? 'bg-primary-foreground text-primary'
                        : 'bg-destructive text-destructive-foreground'
                    }`}
                  >
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    ))}
  </nav>
);

export default AdminNav;
