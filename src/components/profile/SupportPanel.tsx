import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import type { SupportTicket } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const TOPICS = [
  'Не работает функция',
  'Ошибка в заказе',
  'Жалоба на пользователя',
  'Предложение по сервису',
  'Другое',
];

const statusMeta: Record<string, { label: string; cls: string }> = {
  new: { label: 'Новое', cls: 'bg-primary/15 text-primary' },
  answered: { label: 'Отвечено', cls: 'bg-emerald-500/15 text-emerald-600' },
  closed: { label: 'Закрыто', cls: 'bg-chip/20 text-chip' },
};

const dateRu = (v: string) =>
  new Date(v).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

const SupportPanel = ({ onSent }: { onSent?: () => void }) => {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [showList, setShowList] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.auth('support_my', { method: 'POST', body: {} });
      setTickets(r.tickets || []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const send = async () => {
    if (text.trim().length < 10) {
      toast({ title: 'Слишком короткое сообщение', description: 'Опишите проблему подробнее.' });
      return;
    }
    setBusy(true);
    try {
      await api.auth('support_create', { method: 'POST', body: { topic, text: text.trim() } });
      setText('');
      toast({
        title: 'Обращение отправлено',
        description: 'Ответ придёт сюда, в «Мои обращения».',
      });
      await load();
      onSent?.();
    } catch (e) {
      const code = (e as Error).message;
      toast({
        title: code === 'text_too_short' ? 'Слишком короткое сообщение' : 'Не удалось отправить',
        description: 'Попробуйте ещё раз чуть позже.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <select
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        className="min-h-[44px] w-full rounded-2xl border border-line bg-tile px-4 py-3 text-base outline-none transition-colors focus:border-primary/60"
      >
        {TOPICS.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Опишите, что случилось"
        className="min-h-[100px] w-full resize-none rounded-2xl border border-line bg-tile px-4 py-3 text-base outline-none placeholder:text-chip focus:border-primary/60"
      />

      <button
        onClick={send}
        disabled={busy}
        className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        <Icon name="Send" size={16} />
        {busy ? 'Отправляем…' : 'Отправить обращение'}
      </button>

      <button
        onClick={() => setShowList((v) => !v)}
        className="flex min-h-[44px] w-full items-center gap-2 rounded-2xl border border-line px-4 text-sm text-muted-foreground transition-colors hover:border-primary/50"
      >
        <Icon name="Inbox" size={15} className="shrink-0 text-primary" />
        <span className="min-w-0 flex-1 text-left">Мои обращения · {tickets.length}</span>
        <Icon
          name="ChevronDown"
          size={16}
          className={`shrink-0 transition-transform ${showList ? 'rotate-180' : ''}`}
        />
      </button>

      {showList &&
        (loading ? (
          <p className="text-sm text-chip">Загружаем…</p>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-chip">Обращений пока нет.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <div key={t.id} className="rounded-2xl border border-line bg-tile p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="min-w-0 break-words text-sm font-medium">{t.topic}</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs ${
                      statusMeta[t.status]?.cls || 'bg-chip/20 text-chip'
                    }`}
                  >
                    {statusMeta[t.status]?.label || t.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-chip">{dateRu(t.created_at)}</p>
                <p className="mt-2 whitespace-pre-line break-words text-sm text-muted-foreground">
                  {t.text}
                </p>
                {t.answer && (
                  <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                      <Icon name="LifeBuoy" size={14} />
                      Ответ поддержки
                    </p>
                    <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">
                      {t.answer}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
};

export default SupportPanel;
