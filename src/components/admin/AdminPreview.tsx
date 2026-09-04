import { useState } from 'react';
import Icon from '@/components/ui/icon';
import AdminRoleView from '@/components/admin/AdminRoleView';

type Mode = 'customer' | 'executor';

const modes: { id: Mode; label: string; icon: string }[] = [
  { id: 'customer', label: 'Заказчик', icon: 'UserRound' },
  { id: 'executor', label: 'Исполнитель', icon: 'Hammer' },
];

const AdminPreview = () => {
  const [mode, setMode] = useState<Mode>('customer');

  return (
    <div>
      <div className="scrollbar-none flex w-full gap-1 overflow-x-auto rounded-full border border-line bg-surface p-1 sm:w-auto">
        {modes.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`flex min-h-[44px] shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
              mode === m.id
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon name={m.icon} size={16} />
            {m.label}
          </button>
        ))}
      </div>

      <p className="mt-4 flex items-center gap-2 rounded-2xl border border-line bg-tile px-5 py-3.5 text-sm text-muted-foreground">
        <Icon name="Eye" size={16} className="shrink-0 text-primary" />
        Так сервис выглядит для роли «{mode === 'customer' ? 'Заказчик' : 'Исполнитель'}».
        Только просмотр — кнопки не работают.
      </p>

      <div className="mt-6">
        <AdminRoleView mode={mode} />
      </div>
    </div>
  );
};

export default AdminPreview;
