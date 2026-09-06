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

/* Экран ожидания. MAX уже открыт в соседней вкладке и получил код по ссылке —
   человеку остаётся только подтвердить вход. Код показываем мелко и убираем
   под спойлер: он нужен, лишь если вкладка не открылась. */
const CodeStep = ({ code, codeRef, copyCode, left, mmss, botLink, copied, requestCode, busy }: Props) => (
  <div className="space-y-4">
    <div className="rounded-3xl border border-line bg-tile p-6 text-center">
      <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <Icon name="Loader" size={26} className="animate-spin text-primary" />
      </span>
      <p className="mt-4 font-head text-lg font-semibold">Подтвердите вход в MAX</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Мессенджер открылся в соседней вкладке. Нажмите там «Начать» — и сразу
        вернётесь на сайт уже под своим именем.
      </p>
      <p className="mt-3 text-xs text-chip">
        {left > 0 ? `Ссылка действует ещё ${mmss}` : 'Срок ссылки истёк'}
      </p>
    </div>

    <a
      href={botLink}
      target="_blank"
      rel="noreferrer"
      className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
    >
      <Icon name="ExternalLink" size={18} />
      Открыть MAX ещё раз
    </a>

    <details className="rounded-2xl border border-line bg-surface px-4 py-3">
      <summary className="cursor-pointer list-none text-sm text-muted-foreground">
        MAX не открылся?
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">
        Найдите бота в MAX вручную и отправьте ему этот код:
      </p>
      <p
        ref={codeRef}
        onClick={copyCode}
        className="mt-2 cursor-pointer select-all text-center font-head text-2xl font-semibold tracking-[0.22em] text-primary"
      >
        {code}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => copyCode()}
          className="min-h-[44px] flex-1 rounded-full border border-line px-3 py-3 text-sm transition-colors hover:border-primary/50"
        >
          {copied ? 'Код скопирован' : 'Скопировать код'}
        </button>
        <button
          onClick={() => requestCode()}
          disabled={busy}
          className="min-h-[44px] flex-1 rounded-full border border-line px-3 py-3 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
        >
          Новый код
        </button>
      </div>
    </details>
  </div>
);

export default CodeStep;
