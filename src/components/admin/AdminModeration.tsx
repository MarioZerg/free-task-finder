import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { api, JobItem } from '@/lib/api';
import { money } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

const AdminModeration = () => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(0);

  const load = async () => {
    setLoading(true);
    try {
      const r = await api.jobs('admin_jobs', { method: 'POST', body: { status: 'moderation' } });
      setJobs(r.jobs || []);
    } catch {
      toast({ title: 'Не удалось загрузить очередь' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = window.setInterval(load, 15000);
    return () => window.clearInterval(id);
  }, []);

  const decide = async (job: JobItem, approved: boolean) => {
    setBusy(job.id);
    try {
      await api.jobs('admin_update_job', {
        method: 'POST',
        body: approved
          ? { jobId: job.id, moderation: 'approved' }
          : { jobId: job.id, moderation: 'rejected', status: 'cancelled' },
      });
      toast({
        title: approved ? 'Задание в ленте' : 'Задание отклонено',
        description: approved
          ? 'Исполнители уже видят его.'
          : 'Заказчик увидит причину в своём кабинете.',
      });
      await load();
    } catch {
      toast({ title: 'Не получилось', description: 'Действие не выполнено.' });
    } finally {
      setBusy(0);
    }
  };

  if (loading) return <p className="text-sm text-chip">Загружаем очередь…</p>;

  if (jobs.length === 0) {
    return (
      <div className="rounded-3xl border border-line bg-surface p-10 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Icon name="ShieldCheck" size={22} />
        </span>
        <p className="mt-4 font-head text-lg">Очередь пуста</p>
        <p className="mt-2 text-sm text-chip">Все задания проверены — новых на модерации нет.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="flex items-center gap-2 text-sm text-chip">
        <Icon name="Clock" size={16} className="text-primary" />
        Ждут проверки: {jobs.length}
      </p>

      {jobs.map((job) => (
        <article key={job.id} className="rounded-3xl border border-line bg-surface p-5 md:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h4 className="font-head text-lg font-medium md:text-xl">{job.title}</h4>
              <p className="mt-1.5 text-sm text-muted-foreground">{job.description}</p>
            </div>
            <span className="shrink-0 font-head text-2xl font-semibold leading-none text-primary md:text-3xl">
              {money(job.price)}
            </span>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-chip">
            <span className="flex items-center gap-1.5">
              <Icon name="MapPin" size={14} />
              {job.city}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Clock" size={14} />
              {job.when}
            </span>
            <span className="flex items-center gap-1.5">
              <Icon name="Tag" size={14} />
              {job.category}
            </span>
            <span className="flex items-center gap-2">
              <Avatar src={job.ownerAvatar} name={job.ownerName} size={22} />
              {job.ownerName}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2 border-t border-line pt-4">
            <button
              disabled={busy === job.id}
              onClick={() => decide(job, true)}
              className="flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:scale-[1.03] disabled:opacity-60"
            >
              <Icon name="Check" size={16} />
              Одобрить и выставить в ленту
            </button>
            <button
              disabled={busy === job.id}
              onClick={() => decide(job, false)}
              className="flex items-center gap-2 rounded-full border border-line px-6 py-2.5 text-sm transition-colors hover:border-destructive/60 hover:text-destructive disabled:opacity-60"
            >
              <Icon name="X" size={16} />
              Отклонить
            </button>
          </div>
        </article>
      ))}
    </div>
  );
};

export default AdminModeration;
