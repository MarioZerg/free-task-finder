import { useCallback, useEffect, useState } from 'react';
import ProfileDialog from '@/components/ProfileDialog';
import InviteDialog from '@/components/InviteDialog';
import DirectMessageDialog from '@/components/DirectMessageDialog';
import SubscriptionDialog from '@/components/SubscriptionDialog';
import PeopleFilters from '@/components/people/PeopleFilters';
import DirectThreads from '@/components/people/DirectThreads';
import PeopleGrid from '@/components/people/PeopleGrid';
import { useAppState } from '@/hooks/use-app-state';
import { dmArchive, dmList, listProfessions, people } from '@/lib/api';
import type { DirectThread, PeopleCounts, PeopleMode, Profession, User } from '@/lib/api';

const PER_PAGE = 15;

const PeopleList = () => {
  const { user, unread, refresh } = useAppState();
  const [invite, setInvite] = useState<User | null>(null);
  const [message, setMessage] = useState<User | null>(null);
  const [proOpen, setProOpen] = useState(false);
  // Список один, но его можно сузить: показать только тех, кто берёт
  // заказы, или только тех, кто их размещает.
  const [mode, setMode] = useState<PeopleMode>('all');
  const [members, setMembers] = useState<User[]>([]);
  const [counts, setCounts] = useState<PeopleCounts>({
    members: 0,
    executors: 0,
    customers: 0,
    online: 0,
  });
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [threads, setThreads] = useState<DirectThread[]>([]);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedCount, setArchivedCount] = useState(0);

  useEffect(() => {
    let alive = true;
    listProfessions()
      .then((r) => alive && setProfessions(r.professions || []))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  const key = picked.join(',');

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const r = await people({ mode, professions: key ? key.split(',') : [] });
        if (!alive) return;
        setMembers(r.members || []);
        setCounts(r.counts || { members: 0, executors: 0, customers: 0, online: 0 });
      } catch {
        /* тихо */
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 10000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [key, mode]);

  useEffect(() => setPage(1), [key, mode]);

  useEffect(() => {
    let alive = true;
    const load = () =>
      dmList(showArchive)
        .then((r) => {
          if (!alive) return;
          setThreads(r.threads || []);
          setArchivedCount(r.archivedCount || 0);
        })
        .catch(() => undefined);
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 6000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [message, unread.total, showArchive]);

  const archiveThread = async (peerId: number, restore: boolean) => {
    setThreads((prev) => prev.filter((t) => t.userId !== peerId));
    setArchivedCount((c) => Math.max(0, restore ? c - 1 : c + 1));
    try {
      await dmArchive(peerId, restore);
    } catch {
      /* тихо */
    }
    dmList(showArchive)
      .then((r) => {
        setThreads(r.threads || []);
        setArchivedCount(r.archivedCount || 0);
      })
      .catch(() => undefined);
  };

  const toggle = useCallback((slug: string) => {
    setPicked((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug],
    );
  }, []);

  // Себя в списке не показываем: пригласить или написать самому себе нельзя.
  const list = members.filter((m) => m.id !== user?.id);
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const isPro = !!user?.isPro;
  // Обе возможности теперь даёт одна подписка, роль ни при чём.
  const canInvite = isPro;
  const canMessage = isPro;
  const unreadOf = (id: number) => unread.byUser[String(id)] || 0;
  const handleInvite = (u: User) => setInvite(u);
  const handleMessage = (u: User) => setMessage(u);
  const messageFor = (u: User) => {
    if (canMessage) return handleMessage;
    return unreadOf(u.id) > 0 ? handleMessage : undefined;
  };

  return (
    <section>
      <PeopleFilters
        counts={counts}
        mode={mode}
        onMode={setMode}
        professions={professions}
        picked={picked}
        onPicked={setPicked}
        onToggle={toggle}
        isPro={isPro}
        onPro={() => setProOpen(true)}
      />

      <DirectThreads
        threads={threads}
        archivedCount={archivedCount}
        showArchive={showArchive}
        onToggleArchive={() => setShowArchive((v) => !v)}
        onOpenPeer={setMessage}
        onArchiveThread={archiveThread}
      />

      <PeopleGrid
        loading={loading}
        list={list}
        shown={shown}
        picked={picked}
        onResetPicked={() => setPicked([])}
        onOpenProfile={setProfileId}
        onInvite={canInvite ? handleInvite : undefined}
        messageFor={messageFor}
        unreadOf={unreadOf}
        pages={pages}
        current={current}
        onPage={setPage}
      />

      <ProfileDialog userId={profileId} showDetails onOpenChange={() => setProfileId(null)} />
      <InviteDialog executor={invite} onOpenChange={() => setInvite(null)} />
      <DirectMessageDialog
        peer={message}
        onOpenChange={() => {
          setMessage(null);
          refresh();
        }}
      />
      <SubscriptionDialog
        open={proOpen}
        onOpenChange={setProOpen}
        hint="Личные сообщения и приглашения на заказ доступны по подписке PRO"
      />
    </section>
  );
};

export default PeopleList;