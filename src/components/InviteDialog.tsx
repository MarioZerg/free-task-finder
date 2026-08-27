import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';
import { money } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

interface OpenJob {
  id: number;
  title: string;
  price: number;
}

interface Props {
  executor: { id: number; name: string } | null;
  onOpenChange: (v: boolean) => void;
}

const InviteDialog = ({ executor, onOpenChange }: Props) => {
  const [jobs, setJobs] = useState<OpenJob[]>([]);
  const [jobId, setJobId] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!executor) return;
    setLoading(true);
    api
      .jobs('my_open_jobs', { method: 'POST', body: {} })
      .then((r) => {
        const list: OpenJob[] = r.jobs || [];
        setJobs(list);
        setJobId(list[0] ? String(list[0].id) : '');
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, [executor]);

  const send = async () => {
    if (!executor || !jobId) {
      toast({ title: 'Сначала выставьте задание' });
      return;
    }
    setBusy(true);
    try {
      await api.jobs('invite', {
        method: 'POST',
        body: { jobId: Number(jobId), executorId: executor.id, note: note.trim() },
      });
      toast({
        title: 'Приглашение отправлено',
        description: `${executor.name} увидит ваш заказ.`,
      });
      setNote('');
      onOpenChange(false);
    } catch (e) {
      const code = (e as Error).message;
      toast({
        title:
          code === 'executor_busy'
            ? 'Исполнитель уже занят другим заказом'
            : code === 'no_open_job'
              ? 'Сначала выставьте задание'
              : 'Не удалось пригласить',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!executor} onOpenChange={onOpenChange}>
      <DialogContent className="border-line bg-surface text-foreground sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            Пригласить на заказ
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {executor ? `${executor.name} получит приглашение на ваш заказ.` : ''}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-chip">Загружаем ваши заказы…</p>
        ) : jobs.length === 0 ? (
          <p className="rounded-2xl border border-line bg-tile px-4 py-3.5 text-sm text-muted-foreground">
            У вас нет открытых заказов. Сначала выставьте задание.
          </p>
        ) : (
          <div className="space-y-3">
            <select
              value={jobId}
              onChange={(e) => setJobId(e.target.value)}
              className="w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none focus:border-primary/60"
            >
              {jobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title} · {money(j.price)}
                </option>
              ))}
            </select>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Сообщение исполнителю (необязательно)"
              className="min-h-[90px] w-full resize-none rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none placeholder:text-chip focus:border-primary/60"
            />
            <button
              onClick={send}
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              <Icon name="UserPlus" size={18} />
              {busy ? 'Отправляем…' : 'Пригласить'}
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InviteDialog;
