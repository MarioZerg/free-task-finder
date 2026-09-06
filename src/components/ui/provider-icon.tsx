/** Значок мессенджера, через который человек вошёл в сервис.
 *
 *  Сам знак MAX уже нарисован в max-logo.tsx для кнопок входа — берём его
 *  оттуда, чтобы в двух местах не разъезжались две разные картинки.
 *  Здесь только выбор знака по способу входа и подпись при наведении.
 *
 *  Задел на будущее: появится второй мессенджер — добавится строка в
 *  PROVIDER_LABEL и своя ветка ниже, остальной интерфейс не тронем.
 */
import MaxLogo from '@/components/ui/max-logo';

export type AuthProvider = 'max' | 'unknown';

export const PROVIDER_LABEL: Record<AuthProvider, string> = {
  max: 'Вошёл через MAX',
  unknown: 'Способ входа неизвестен',
};

const UnknownMark = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <rect width="24" height="24" rx="7" className="fill-muted-foreground/25" />
    <path
      d="M12 15.2v-.4c0-1 .5-1.6 1.3-2.1.7-.5 1.1-.9 1.1-1.7 0-1.1-.9-1.9-2.2-1.9-1.2 0-2.1.7-2.3 1.8M12 18.2h.01"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      className="text-muted-foreground"
    />
  </svg>
);

interface Props {
  provider?: string | null;
  size?: number;
  /** Подпись рядом со значком — в местах, где не хватает одной картинки */
  withLabel?: boolean;
  className?: string;
}

const ProviderIcon = ({ provider, size = 16, withLabel = false, className = '' }: Props) => {
  const key: AuthProvider = provider === 'max' ? 'max' : 'unknown';
  const label = PROVIDER_LABEL[key];

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 ${className}`}
      title={label}
      aria-label={label}
    >
      {key === 'max' ? (
        <MaxLogo size={size} className="text-[#2B6BF3]" />
      ) : (
        <UnknownMark size={size} />
      )}
      {withLabel && <span className="text-xs text-chip">{label}</span>}
    </span>
  );
};

export default ProviderIcon;
