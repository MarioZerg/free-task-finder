import { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { dmSend, dmThread } from '@/lib/api';
import type { DirectMessage } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import Loader from '@/components/Loader';

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

interface Props {
  peer: { id: number; name: string; avatar?: string | null } | null;
  onOpenChange: (v: boolean) => void;
}

const DirectMessageDialog = ({ peer, onOpenChange }: Props) => {
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!peer) return;
    try {
      const r = await dmThread(peer.id);
      setMessages(r.messages || []);
    } catch {
      /* тихо */
    }
  };

  useEffect(() => {
    if (!peer) return;
    setLoading(true);
    load().finally(() => setLoading(false));
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 8000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [peer?.id]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages.length]);

  const send = async () => {
    const value = text.trim();
    if (!value || !peer) return;
    setBusy(true);
    try {
      await dmSend(peer.id, value);
      setText('');
      await load();
    } catch {
      toast({ title: 'Сообщение не отправлено', description: 'Попробуйте ещё раз.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!peer} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[80vh] flex-col border-line bg-surface text-foreground sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 font-head text-xl font-medium tracking-tight">
            <Avatar src={peer?.avatar} name={peer?.name || ''} size={30} />
            {peer?.name}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Личная переписка вне заказа.
          </DialogDescription>
        </DialogHeader>

        <div ref={boxRef} className="min-h-[200px] flex-1 space-y-2.5 overflow-y-auto pr-1">
          {loading ? (
            <Loader />
          ) : messages.length === 0 ? (
            <p className="text-sm text-chip">Сообщений пока нет — напишите первым.</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm ${
                    m.mine
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-line bg-tile text-foreground'
                  }`}
                >
                  <p className="break-words">{m.text}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      m.mine ? 'text-primary-foreground/70' : 'text-chip'
                    }`}
                  >
                    {time(m.createdAt)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-end gap-2 border-t border-line pt-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Написать сообщение"
            rows={1}
            className="min-h-[44px] w-full resize-none rounded-2xl border border-line bg-tile px-4 py-3 text-base outline-none placeholder:text-chip focus:border-primary/60"
          />
          <button
            onClick={send}
            disabled={busy || !text.trim()}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-60"
          >
            <Icon name="Send" size={18} />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DirectMessageDialog;