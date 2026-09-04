import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import type { DirectThread, User } from '@/lib/api';

const DirectThreads = ({
  threads,
  archivedCount,
  showArchive,
  onToggleArchive,
  onOpenPeer,
  onArchiveThread,
}: {
  threads: DirectThread[];
  archivedCount: number;
  showArchive: boolean;
  onToggleArchive: () => void;
  onOpenPeer: (u: User) => void;
  onArchiveThread: (peerId: number, restore: boolean) => void;
}) => {
  if (threads.length === 0 && archivedCount === 0) return null;

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm uppercase tracking-[0.16em] text-chip">
          <Icon name={showArchive ? 'Archive' : 'MessagesSquare'} size={15} />
          {showArchive ? 'Архив диалогов' : 'Диалоги'}
        </p>
        <button
          onClick={onToggleArchive}
          className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/50"
        >
          <Icon name={showArchive ? 'ArrowLeft' : 'Archive'} size={13} />
          {showArchive ? 'К активным' : `Архив${archivedCount ? ` · ${archivedCount}` : ''}`}
        </button>
      </div>

      {threads.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-line bg-surface px-4 py-5 text-center text-sm text-chip">
          {showArchive ? 'В архиве пока пусто.' : 'Активных диалогов нет.'}
        </p>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {threads.map((t) => (
            <div
              key={t.userId}
              className={`flex min-h-[44px] items-center gap-2 rounded-2xl border bg-surface p-3 transition-colors hover:border-primary/50 ${
                t.unread > 0 ? 'border-primary/50' : 'border-line'
              }`}
            >
              <button
                onClick={() =>
                  onOpenPeer({ id: t.userId, name: t.name, avatar: t.avatar } as User)
                }
                className="flex min-w-0 flex-1 items-center gap-3 text-left"
              >
                <Avatar src={t.avatar} name={t.name} size={38} online={t.online} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{t.name}</span>
                    {t.unread > 0 && (
                      <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive px-1.5 text-[11px] font-semibold leading-none text-destructive-foreground">
                        {t.unread > 99 ? '99+' : t.unread}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-chip">{t.lastText}</span>
                </span>
              </button>
              <button
                onClick={() => onArchiveThread(t.userId, showArchive)}
                title={showArchive ? 'Вернуть из архива' : 'В архив'}
                aria-label={showArchive ? 'Вернуть из архива' : 'В архив'}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line text-chip transition-colors hover:border-primary/60 hover:text-primary"
              >
                <Icon name={showArchive ? 'ArchiveRestore' : 'Archive'} size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DirectThreads;
