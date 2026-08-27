import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { api } from '@/lib/api';

interface Props {
  jobId: number;
  title: string;
  thumb: string;
  hasFull?: boolean;
  className?: string;
  compact?: boolean;
}

const PhotoViewer = ({ jobId, title, thumb, hasFull, className = '', compact }: Props) => {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState('');

  useEffect(() => {
    if (!open || !hasFull || full) return;
    let alive = true;
    api
      .jobs('photo', { params: { jobId: String(jobId) } })
      .then((r) => alive && r.photo && setFull(r.photo))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, hasFull, full, jobId]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={`group relative block w-full overflow-hidden ${className}`}
      >
        <img
          src={thumb}
          alt={title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        {compact ? (
          <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background/85 shadow-sm">
            <Icon name="Maximize2" size={12} />
          </span>
        ) : (
          <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-background/85 px-3 py-1.5 text-xs font-medium shadow-sm">
            <Icon name="Maximize2" size={13} />
            Открыть фото
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[92vw] border-line bg-surface p-3 sm:max-w-[720px]">
          <img
            src={full || thumb}
            alt={title}
            className="max-h-[78vh] w-full rounded-2xl object-contain"
          />
          <p className="px-1 pb-1 text-center text-sm text-chip">{title}</p>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PhotoViewer;
