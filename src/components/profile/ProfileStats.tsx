import Icon from '@/components/ui/icon';
import type { User } from '@/lib/api';

/** Крупные цифры профиля.
 *
 *  Показываем ровно то, что относится к включённым режимам: у человека,
 *  который только заказывает, блок про выполненные работы был бы пустым
 *  и сбивал бы с толку. */
const ProfileStats = ({ user }: { user: User }) => {
  const asExecutor = user.asExecutor !== false;
  const asCustomer = user.asCustomer !== false;

  const cards = [
    ...(asExecutor
      ? [
          {
            key: 'done',
            icon: 'Hammer',
            value: user.doneCount,
            label: 'выполнено заказов',
            accent: true,
          },
        ]
      : []),
    ...(asCustomer
      ? [
          {
            key: 'created',
            icon: 'ClipboardList',
            value: user.createdCount ?? 0,
            label: 'создано заказов',
            accent: false,
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-2.5">
      <div className={`grid gap-2.5 ${cards.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {cards.map((c) => (
          <div
            key={c.key}
            className={`rounded-3xl border p-5 text-center ${
              c.accent ? 'border-primary/40 bg-primary/5' : 'border-line bg-tile'
            }`}
          >
            <Icon
              name={c.icon}
              size={18}
              className={`mx-auto ${c.accent ? 'text-primary' : 'text-chip'}`}
            />
            <p
              className={`mt-2 font-head text-4xl font-bold leading-none tracking-tight ${
                c.accent ? 'text-primary' : ''
              }`}
            >
              {c.value}
            </p>
            <p className="mt-2 text-xs leading-tight text-chip">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Рейтинги раздельные: как работает и каким бывает заказчиком. */}
      <div className={`grid gap-2.5 ${asExecutor && asCustomer ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {asExecutor && (
          <div className="rounded-2xl border border-line bg-tile px-4 py-3 text-center">
            <p className="font-head text-lg text-primary">
              ★ {(user.ratingExecutor ?? 0).toFixed(1)}
            </p>
            <p className="mt-0.5 text-xs text-chip">
              как исполнитель · {user.reviewsExecutor ?? 0} отз.
            </p>
          </div>
        )}
        {asCustomer && (
          <div className="rounded-2xl border border-line bg-tile px-4 py-3 text-center">
            <p className="font-head text-lg text-primary">
              ★ {(user.ratingCustomer ?? 0).toFixed(1)}
            </p>
            <p className="mt-0.5 text-xs text-chip">
              как заказчик · {user.reviewsCustomer ?? 0} отз.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileStats;
