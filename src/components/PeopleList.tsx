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
import type { DirectThread, PeopleCounts, Profession, User } from '@/lib/api';

const PER_PAGE = 15;

const PeopleList = () => {
  const { user, unread, refresh } = useAppState();
  const [tab, setTab] = useState<'executor' | 'customer'>('executor');
  const [invite, setInvite] = useState<User | null>(null);
  const [message, setMessage] = useState<User | null>(null);
  const [proOpen, setProOpen] = useState(false);
  const [executors, setExecutors] = useState<User[]>([]);
  const [customers, setCustomers] = useState<User[]>([]);
  const [counts, setCounts] = useState<PeopleCounts>({ executors: 0, customers: 0, online: 0 });
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
        const r = await people({ professions: key ? key.split(',') : [] });
        if (!alive) return;
        setExecutors(r.executors || []);
        setCustomers(r.customers || []);
        setCounts(r.counts || { executors: 0, customers: 0, online: 0 });
      } catch {
        /* тихо */
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 60000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [key]);

  useEffect(() => setPage(1), [tab, key]);

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
    }, 30000);
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

  const list = tab === 'executor' ? executors : customers;
  const pages = Math.max(1, Math.ceil(list.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = list.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const isPro = !!user?.isPro;
  const canInvite = user?.role === 'customer' && tab === 'executor' && isPro;
  const canMessage = user?.role === 'executor' && tab === 'customer' && isPro;
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
        tab={tab}
        onTab={setTab}
        professions={professions}
        picked={picked}
        onPicked={setPicked}
        onToggle={toggle}
        isPro={isPro}
        user={user}
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

      <ProfileDialog userId={profileId} onOpenChange={() => setProfileId(null)} />
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
        hint={
          user?.role === 'executor'
            ? 'Личные сообщения заказчикам доступны по подписке PRO'
            : 'Приглашение исполнителей доступно по подписке PRO'
        }
      />
    </section>
  );
};

export default PeopleList;
