import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import { api } from '@/lib/api';
import type { JobItem } from '@/lib/api';
import { money } from '@/data/mock';
import { statusLabel } from '@/components/admin/AdminJobs';

const Ghost = ({ children }: { children: string }) => (
  <button
    disabled
    title="Просмотр глазами роли"
    className="min-h-[44px] w-full cursor-not-allowed rounded-full bg-primary/40 px-4 py-2 text-sm font-medium text-primary-foreground opacity-60 sm:w-auto"
  >
    {children}
  </button>
);

const Meta = ({ job }: { job: JobItem }) => (
  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-chip">
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
  </div>
);

const AdminRoleView = ({ mode }: { mode: 'customer' | 'executor' }) => {
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    api
      .jobs('admin_jobs', { method: 'POST', body: mode === 'executor' ? { status: 'open' } : {} })
      .then((r) => alive && setJobs(r.jobs || []))
      .catch(() => alive && setJobs([]))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [mode]);

  if (loading) return <p className="text-sm text-chip">Загружаем…</p>;
  if (jobs.length === 0)
    return (
      <p className="rounded-3xl border border-line bg-surface p-10 text-center text-sm text-chip">
        Заказов нет
      </p>
    );

  if (mode === 'executor') {
    return (
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {jobs.map((job) => (
          <article
            key={job.id}
            className="flex flex-col overflow-hidden rounded-3xl border border-line bg-surface"
          >
            {job.photo && (
              <img src={job.photo} alt={job.title} className="h-36 w-full object-cover" />
            )}
            <div className="flex flex-1 flex-col p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h4 className="min-w-0 break-words font-head text-lg font-medium leading-snug">{job.title}</h4>
                <span className="whitespace-nowrap font-head text-lg font-medium text-primary">
                  {money(job.price)}
                </span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">
                {job.description}
              </p>
              <Meta job={job} />
              <p className="mt-3 flex items-center gap-2 text-xs text-chip">
                <Avatar src={job.ownerAvatar} name={job.ownerName} size={24} />
                Заказчик: {job.ownerName} · ★ {job.ownerRating.toFixed(1)}
              </p>
              <div className="mt-auto pt-4">
                <button
                  disabled
                  title="Просмотр глазами роли"
                  className="min-h-[44px] w-full cursor-not-allowed rounded-full bg-primary/40 py-3 text-sm font-medium text-primary-foreground opacity-60"
                >
                  Готов взяться
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {jobs.map((job) => (
        <article key={job.id} className="rounded-3xl border border-line bg-surface p-4 sm:p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="break-words font-head text-xl font-medium">{job.title}</h4>
              <p className="mt-1 max-w-[560px] break-words text-sm text-muted-foreground">
                {job.description}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <span className="font-head text-xl font-medium text-primary">
                {money(job.finalPrice || job.price)}
              </span>
              <p className="mt-1 text-xs text-chip">{statusLabel[job.status]}</p>
            </div>
          </div>
          <Meta job={job} />

          <div className="mt-5 border-t border-line pt-4">
            <h5 className="font-head text-base font-medium">
              Отклики · {(job.responses || []).length}
            </h5>
            {(job.responses || []).length === 0 ? (
              <p className="mt-2 text-sm text-chip">Откликов нет.</p>
            ) : (
              <div className="mt-3 space-y-3">
                {(job.responses || []).map((r) => (
                  <div key={r.executorId} className="rounded-2xl border border-line bg-tile p-4">
                    <div className="flex items-start gap-3">
                      <Avatar src={r.avatar} name={r.name} size={40} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="font-medium">{r.name}</span>
                          <span className="text-xs text-chip">
                            ★ {r.rating.toFixed(1)} · {r.doneCount} работ
                          </span>
                        </div>
                        {r.skill && <p className="text-xs text-chip">{r.skill}</p>}
                        <p className="mt-1.5 text-sm text-muted-foreground">{r.note}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Ghost>Посмотреть профиль</Ghost>
                      <Ghost>Назначить на заказ</Ghost>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      ))}
    </div>
  );
};

export default AdminRoleView;
