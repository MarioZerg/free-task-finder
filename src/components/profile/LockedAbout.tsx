import Icon from '@/components/ui/icon';

/** Размытое описание профиля для тех, у кого нет PRO.
 *
 *  Настоящий текст сюда не приходит — сервер отдаёт только его длину.
 *  Размытие делается стилями, а стили в браузере снимаются в два клика,
 *  поэтому под замком не должно быть ничего, что можно подсмотреть.
 *  Рисуем полоски по длине оригинала: видно, что текст правда есть и
 *  сколько его, но прочитать нечего.
 */
interface Props {
  /** Длина скрытого текста — по ней считаем, сколько полосок рисовать */
  length: number;
  title: string;
  icon: string;
  onOpenPro: () => void;
}

/** Строк примерно столько же, сколько занял бы реальный текст */
const linesFor = (length: number) => Math.min(6, Math.max(2, Math.round(length / 55)));

const LockedAbout = ({ length, title, icon, onOpenPro }: Props) => {
  const lines = linesFor(length);

  return (
    <>
      <h4 className="mt-3 flex items-center gap-1.5 font-head text-base font-medium">
        <Icon name={icon} size={15} className="text-primary" fallback="Hammer" />
        {title}
      </h4>

      <div className="relative mt-2">
        <div aria-hidden className="select-none space-y-2 blur-[5px]">
          {Array.from({ length: lines }).map((_, i) => (
            <div
              key={i}
              className="h-3 rounded-full bg-muted-foreground/30"
              // Последняя строка короче — так абзац выглядит настоящим,
              // а не заготовкой из одинаковых плашек.
              style={{ width: i === lines - 1 ? '55%' : `${88 + ((i * 7) % 12)}%` }}
            />
          ))}
        </div>

        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={onOpenPro}
            className="flex min-h-[36px] items-center gap-1.5 rounded-full border border-amber-500/40 bg-surface/90 px-4 text-xs font-medium text-amber-600 shadow-sm backdrop-blur-sm transition-transform hover:scale-[1.03]"
          >
            <Icon name="Lock" size={13} />
            Видно при статусе PRO
          </button>
        </div>
      </div>
    </>
  );
};

export default LockedAbout;
