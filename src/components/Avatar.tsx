import { useEffect, useState } from 'react';
import { initials } from '@/data/mock';

interface Props {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
  online?: boolean;
}

const Avatar = ({ src, name, size = 44, className = '', online }: Props) => {
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.32)) };
  const dot = Math.max(8, Math.round(size * 0.26));
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    setBroken(false);
  }, [src]);

  const inner = src && !broken ? (
    <img
      src={src}
      alt={name}
      style={style}
      onError={() => setBroken(true)}
      className="rounded-full object-cover"
    />
  ) : (
    <span
      style={style}
      className="flex items-center justify-center rounded-full bg-primary/20 font-head font-semibold text-primary"
    >
      {initials(name)}
    </span>
  );

  if (online === undefined) {
    return <span className={`relative inline-flex shrink-0 ${className}`}>{inner}</span>;
  }

  return (
    <span className={`relative inline-flex shrink-0 ${className}`}>
      {inner}
      <span
        title={online ? 'Онлайн' : 'Не в сети'}
        style={{ width: dot, height: dot }}
        className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-surface ${
          online ? 'bg-emerald-500' : 'bg-chip/60'
        }`}
      />
    </span>
  );
};

export const OnlineBadge = ({ online }: { online?: boolean }) => (
  <span
    className={`inline-flex items-center gap-1.5 text-xs ${
      online ? 'text-emerald-600' : 'text-chip'
    }`}
  >
    <span className={`h-2 w-2 rounded-full ${online ? 'bg-emerald-500' : 'bg-chip/60'}`} />
    {online ? 'онлайн' : 'не в сети'}
  </span>
);

export default Avatar;