import { initials } from '@/data/mock';

interface Props {
  src?: string | null;
  name: string;
  size?: number;
  className?: string;
}

const Avatar = ({ src, name, size = 44, className = '' }: Props) => {
  const style = { width: size, height: size, fontSize: Math.max(11, Math.round(size * 0.32)) };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        style={style}
        className={`shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <span
      style={style}
      className={`flex shrink-0 items-center justify-center rounded-full bg-primary/20 font-head font-semibold text-primary ${className}`}
    >
      {initials(name)}
    </span>
  );
};

export default Avatar;
