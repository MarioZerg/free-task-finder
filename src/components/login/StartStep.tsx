const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

interface Props {
  maxId: string;
  setMaxId: (v: string) => void;
  legacyLogin: () => void;
}

const StartStep = ({ maxId, setMaxId, legacyLogin }: Props) => (
  <div>
    <label className="mb-2 block text-sm text-muted-foreground" htmlFor="login-max">
      Ваш профиль MAX
    </label>
    <input
      id="login-max"
      value={maxId}
      onChange={(e) => setMaxId(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && legacyLogin()}
      placeholder="@ivan_yar"
      autoComplete="username"
      className={field}
    />
    <p className="mt-2 text-xs text-chip">
      Упрощённый вход: подтверждение через MAX подключается.
    </p>
  </div>
);

export default StartStep;
