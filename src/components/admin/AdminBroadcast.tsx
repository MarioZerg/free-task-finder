import { useState } from 'react';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const LAUNCH_LETTER = `Доделай.ру — спасибо, что вы с нами с первых дней

Вы среди первых, кто зарегистрировался на сервисе. Проект стартовал 1 сентября 2026 года и сейчас активно рекламируется в интернете, так что заказчиков в Ярославской области будет становиться больше.

Что важно знать:

1. Для исполнителей сервис полностью бесплатный. Комиссию мы не берём, оплата идёт напрямую от заказчика.

2. Теперь бот будет присылать вам сюда уведомление каждый раз, когда в вашем городе публикуется новый заказ. Заходите сразу и откликайтесь — заказчики обычно выбирают из первых откликов.

Чтобы не пропустить заказ, не отключайте уведомления от бота. Открыть сервис: https://dodelay.ru

Если появятся вопросы или предложения — напишите нам, мы читаем всё.`;

const audiences = [
  { id: 'all', label: 'Всем' },
  { id: 'executor', label: 'Исполнителям' },
  { id: 'customer', label: 'Заказчикам' },
];

const AdminBroadcast = () => {
  const [text, setText] = useState(LAUNCH_LETTER);
  const [audience, setAudience] = useState('all');
  const [busy, setBusy] = useState('');
  const [count, setCount] = useState<number | null>(null);
  const [confirm, setConfirm] = useState(false);

  const run = async (mode: 'preview' | 'send') => {
    setBusy(mode);
    try {
      const r = await api.auth('admin_broadcast', {
        method: 'POST',
        body: { mode, audience, text },
      });
      if (mode === 'preview') {
        setCount(r.recipients ?? 0);
        toast({
          title: 'Отправил вам в MAX',
          description: `Так увидят письмо получатели. В списке ${r.recipients ?? 0} чел.`,
        });
      } else {
        setConfirm(false);
        toast({ title: `Рассылка отправлена: ${r.sent ?? 0} чел.` });
      }
    } catch {
      toast({ title: 'Не получилось', description: 'Проверьте, подключён ли бот MAX.' });
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="rounded-3xl border border-line bg-surface p-5 md:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name="Send" size={20} />
        </span>
        <div className="min-w-0">
          <p className="font-head text-lg font-medium">Рассылка в MAX</p>
          <p className="mt-1 text-sm text-chip">
            Сообщение придёт всем, кто вошёл через MAX. Демо-профили и заблокированные
            исключены.
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {audiences.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              setAudience(a.id);
              setCount(null);
            }}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              audience === a.id
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-line text-chip hover:border-primary/50'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={14}
        className="mt-4 w-full resize-y rounded-2xl border border-line bg-tile px-4 py-3 text-sm leading-relaxed outline-none transition-colors focus:border-primary/60"
      />

      <p className="mt-2 text-xs text-chip">
        {text.length} символов
        {count !== null && ` · получателей: ${count}`}
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <button
          onClick={() => run('preview')}
          disabled={!!busy || !text.trim()}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line px-5 text-sm font-medium transition-colors hover:border-primary/60 disabled:opacity-50"
        >
          <Icon name="Eye" size={16} />
          {busy === 'preview' ? 'Отправляю…' : 'Прислать образец мне'}
        </button>

        {confirm ? (
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <button
              onClick={() => run('send')}
              disabled={!!busy}
              className="min-h-[44px] flex-1 rounded-full bg-destructive px-5 text-sm font-medium text-destructive-foreground disabled:opacity-50"
            >
              {busy === 'send' ? 'Отправляю…' : 'Да, отправить всем'}
            </button>
            <button
              onClick={() => setConfirm(false)}
              className="min-h-[44px] rounded-full border border-line px-5 text-sm"
            >
              Отмена
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirm(true)}
            disabled={!!busy || !text.trim()}
            className="min-h-[44px] rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50"
          >
            Отправить рассылку
          </button>
        )}
      </div>

      <p className="mt-3 flex items-start gap-1.5 text-xs text-chip">
        <Icon name="Info" size={13} className="mt-0.5 shrink-0" />
        Сначала пришлите образец себе — так вы увидите письмо глазами получателя.
      </p>
    </div>
  );
};

export default AdminBroadcast;
