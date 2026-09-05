import Icon from '@/components/ui/icon';

interface Props {
  asExecutor: boolean;
  asCustomer: boolean;
  onExecutor: (v: boolean) => void;
  onCustomer: (v: boolean) => void;
}

const modes = [
  {
    key: 'executor' as const,
    icon: 'Hammer',
    title: 'Беру заказы',
    text: 'Профиль виден тем, кто ищет исполнителя. Вам приходят уведомления о новых задачах по вашим специальностям.',
  },
  {
    key: 'customer' as const,
    icon: 'ClipboardList',
    title: 'Размещаю задачи',
    text: 'Профиль виден исполнителям как заказчик. Они смогут посмотреть ваши отзывы, прежде чем откликнуться.',
  },
];

/** Два независимых переключателя вместо прежних ролей.
 *
 *  Можно оставить оба — тогда профиль показывается и в списке
 *  исполнителей, и в списке заказчиков. Выключить оба нельзя:
 *  иначе человек исчезнет из вкладки «Люди», это проверяет форма. */
const ProfileModes = ({ asExecutor, asCustomer, onExecutor, onCustomer }: Props) => {
  const value = { executor: asExecutor, customer: asCustomer };
  const set = { executor: onExecutor, customer: onCustomer };
  const none = !asExecutor && !asCustomer;

  return (
    <div className="space-y-2.5">
      {modes.map((m) => {
        const on = value[m.key];
        return (
          <button
            key={m.key}
            type="button"
            onClick={() => set[m.key](!on)}
            aria-pressed={on}
            className={`flex w-full items-start gap-3.5 rounded-2xl border p-4 text-left transition-colors ${
              on
                ? 'border-primary/60 bg-primary/5'
                : 'border-line bg-tile hover:border-primary/40'
            }`}
          >
            <span
              className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${
                on ? 'bg-primary text-primary-foreground' : 'bg-surface text-chip'
              }`}
            >
              <Icon name={m.icon} size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-2">
                <span className="font-medium">{m.title}</span>
                {on && <Icon name="Check" size={15} className="shrink-0 text-primary" />}
              </span>
              <span className="mt-1 block text-sm leading-relaxed text-chip">{m.text}</span>
            </span>
            <span
              className={`mt-1 flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${
                on ? 'bg-primary' : 'bg-line'
              }`}
            >
              <span
                className={`h-5 w-5 rounded-full bg-surface shadow transition-transform ${
                  on ? 'translate-x-5' : ''
                }`}
              />
            </span>
          </button>
        );
      })}

      {none && (
        <p className="flex items-start gap-2.5 rounded-2xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-muted-foreground">
          <Icon name="TriangleAlert" size={16} className="mt-0.5 shrink-0 text-destructive" />
          Отметьте хотя бы одно — иначе профиль не появится во вкладке «Люди».
        </p>
      )}
    </div>
  );
};

export default ProfileModes;
