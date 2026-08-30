import { useEffect, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { api, ChatMessage } from '@/lib/api';
import { useAppState } from '@/hooks/use-app-state';
import { toast } from '@/hooks/use-toast';

const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

const JobChat = ({ jobId }: { jobId: number; partner?: string }) => {
  const { sendMessage } = useAppState();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const r = await api.jobs('messages', { params: { jobId: String(jobId) } });
      setMessages(r.messages || []);
    } catch {
      /* тихо */
    }
  };

  useEffect(() => {
    load();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, 8000);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    boxRef.current?.scrollTo({ top: boxRef.current.scrollHeight });
  }, [messages.length]);

  const send = async () => {
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    try {
      await sendMessage(jobId, value);
      setText('');
      await load();
    } catch {
      toast({ title: 'Сообщение не отправлено', description: 'Попробуйте ещё раз.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-line bg-tile p-4">
      <div ref={boxRef} className="max-h-[50vh] space-y-3 overflow-y-auto pr-1 sm:max-h-[280px]">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-sm text-chip">
            Сообщений пока нет. Напишите, чтобы договориться о деталях.
          </p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex items-end gap-2 ${m.mine ? 'flex-row-reverse' : ''}`}
            >
              <Avatar src={m.authorAvatar} name={m.authorName} size={28} />
              <div
                className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                  m.mine
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-line bg-surface text-foreground'
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{m.text}</p>
                <p className={`mt-1 text-[11px] ${m.mine ? 'opacity-70' : 'text-chip'}`}>
                  {time(m.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Написать сообщение"
          maxLength={1000}
          className="min-h-[44px] w-full min-w-0 flex-1 rounded-full border border-line bg-surface px-4 py-3 text-base outline-none placeholder:text-chip focus:border-primary/60 sm:text-sm"
        />
        <button
          onClick={send}
          disabled={busy || !text.trim()}
          aria-label="Отправить"
          className="flex h-11 w-11 shrink-0 grow-0 basis-11 items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform hover:scale-105 disabled:opacity-50"
        >
          <Icon name="Send" size={17} />
        </button>
      </div>
    </div>
  );
};

export default JobChat;