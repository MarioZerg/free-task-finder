import { RefObject } from 'react';
import Icon from '@/components/ui/icon';

interface Props {
  code: string;
  codeRef: RefObject<HTMLParagraphElement>;
  copyCode: () => void;
  left: number;
  mmss: string;
  botLink: string;
  copied: boolean;
  requestCode: () => void;
  busy: boolean;
}

const CodeStep = ({ code, codeRef, copyCode, left, mmss, botLink, copied, requestCode, busy }: Props) => (
  <div className="space-y-4">
    <div className="rounded-3xl border border-line bg-tile p-6 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-chip">Ваш код входа</p>
      <p
        ref={codeRef}
        onClick={copyCode}
        className="mt-3 cursor-pointer select-all break-all font-head text-3xl font-semibold tracking-[0.22em] text-primary sm:text-4xl sm:tracking-[0.3em]"
      >
        {code}
      </p>
      <p className="mt-3 text-xs text-chip">
        {left > 0 ? `Код действует ещё ${mmss}` : 'Срок кода истёк'}
      </p>
    </div>
    <p className="text-sm text-muted-foreground">
      Отправьте боту этот код — вход подтвердится автоматически.
    </p>
    <a
      href={botLink}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
    >
      <Icon name="ExternalLink" size={18} />
      Открыть бота в MAX
    </a>
    <div className="flex gap-2">
      <button
        onClick={() => copyCode()}
        className="min-h-[44px] flex-1 rounded-full border border-line px-3 py-3 text-sm transition-colors hover:border-primary/50"
      >
        {copied ? 'Код скопирован' : 'Скопировать код'}
      </button>
      <button
        onClick={requestCode}
        disabled={busy}
        className="min-h-[44px] flex-1 rounded-full border border-line px-3 py-3 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
      >
        Получить новый код
      </button>
    </div>
    <p className="flex items-center justify-center gap-2 text-xs text-chip">
      <Icon name="Loader" size={14} />
      Ждём подтверждения в MAX…
    </p>
  </div>
);

export default CodeStep;
