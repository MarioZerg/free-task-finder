import { useCallback, useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { api, SupportTicket } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

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

const SupportDialog = ({ open, onOpenChange }: Props) => {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);

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
    if (open) load();
  }, [open, load]);

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
        description: 'Ответ появится здесь, в разделе «Мои обращения».',
      });
      await load();
    } catch (e) {
      const code = (e as Error).message;
      toast({
        title:
          code === 'text_too_short' ? 'Слишком короткое сообщение' : 'Не удалось отправить',
        description: 'Попробуйте ещё раз чуть позже.',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            Техподдержка
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Напишите нам — разберёмся и ответим прямо здесь.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <select
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors focus:border-primary/60"
          >
            {TOPICS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Опишите, что не устраивает и что хотели бы поправить"
              className="min-h-[110px] w-full resize-none rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none placeholder:text-chip focus:border-primary/60"
            />
            <p className="mt-1 text-xs text-chip">
              {text.trim().length} символов{text.trim().length < 10 ? ' · минимум 10' : ''}
            </p>
          </div>

          <button
            onClick={send}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            <Icon name="Send" size={18} />
            {busy ? 'Отправляем…' : 'Отправить обращение'}
          </button>
        </div>

        <div className="border-t border-line pt-4">
          <h4 className="font-head text-lg font-medium">Мои обращения</h4>
          {loading ? (
            <p className="mt-2 text-sm text-chip">Загружаем…</p>
          ) : tickets.length === 0 ? (
            <p className="mt-2 text-sm text-chip">Обращений пока нет.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {tickets.map((t) => (
                <div key={t.id} className="rounded-2xl border border-line bg-tile p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{t.topic}</span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs ${
                        statusMeta[t.status]?.cls || 'bg-chip/20 text-chip'
                      }`}
                    >
                      {statusMeta[t.status]?.label || t.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-chip">{dateRu(t.created_at)}</p>
                  <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">{t.text}</p>
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
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SupportDialog;
