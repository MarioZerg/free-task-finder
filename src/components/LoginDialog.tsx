import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAppState, Role } from '@/hooks/use-app-state';
import { CITIES } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const roleCopy: Record<Role, { title: string; hint: string }> = {
  customer: {
    title: 'Вход для заказчика',
    hint: 'Выставляйте задачи, смотрите отклики и назначайте исполнителя.',
  },
  executor: {
    title: 'Вход для исполнителя',
    hint: 'Живая лента заказов Ярославской области — откликайтесь в один клик.',
  },
};

const errorText: Record<string, string> = {
  bad_max_id: 'Ник в MAX: латиница, цифры, точка, дефис или подчёркивание, от 3 символов.',
  bad_role: 'Выберите роль.',
  bad_name: 'Введите имя — минимум 2 символа.',
  terms_required: 'Заполните анкету и примите условия.',
  code_required: 'Подтвердите вход в боте MAX.',
  code_not_confirmed: 'Код ещё не подтверждён в боте MAX.',
  blocked: 'Аккаунт заблокирован администратором.',
  request_failed: 'Не получилось связаться с сервером. Попробуйте ещё раз.',
};

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

const CODE_TTL = 15 * 60;

const LoginDialog = () => {
  const { loginOpen, setLoginOpen, loginRole, openLogin, signIn, startMaxLogin, maxEnabled } =
    useAppState();
  const navigate = useNavigate();

  const [maxId, setMaxId] = useState('');
  const [step, setStep] = useState<'start' | 'code' | 'register'>('start');
  const [code, setCode] = useState('');
  const [botLink, setBotLink] = useState('');
  const [botName, setBotName] = useState('');
  const [left, setLeft] = useState(CODE_TTL);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [skill, setSkill] = useState('');
  const [about, setAbout] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [adminHint, setAdminHint] = useState(false);
  const doneRef = useRef(false);

  const reset = useCallback(() => {
    setStep('start');
    setError('');
    setBusy(false);
    setCode('');
    setLeft(CODE_TTL);
    doneRef.current = false;
  }, []);

  useEffect(() => {
    if (!loginOpen) {
      reset();
      setAdminHint(false);
    }
  }, [loginOpen, reset]);

  useEffect(() => {
    reset();
  }, [loginRole, reset]);

  const cleanMax = maxId.trim().replace(/^@/, '').toLowerCase();
  const maxValid = /^[a-z0-9._-]{3,60}$/.test(cleanMax);

  const success = (isAdmin?: boolean) => {
    toast({
      title: 'Вы в Доделай.ру',
      description:
        loginRole === 'customer'
          ? 'Можно выставить задачу — после проверки она появится в ленте.'
          : 'Лента заказов открыта — откликайтесь.',
    });
    setMaxId('');
    setName('');
    setPhone('');
    setSkill('');
    setAbout('');
    setTerms(false);
    if (isAdmin) {
      setAdminHint(true);
      setLoginOpen(true);
      return;
    }
    navigate('/dashboard');
  };

  const finish = async (extra: Record<string, unknown> = {}) => {
    const user = await signIn({
      role: loginRole,
      ...(code ? { code } : {}),
      ...(maxEnabled ? {} : { maxId: cleanMax }),
      ...extra,
    });
    success(user.isAdmin);
  };

  const handleError = (e: unknown) => {
    const c = (e as Error).message;
    if (c === 'terms_required' || c === 'bad_name') {
      setStep('register');
      setError('');
      return true;
    }
    setError(errorText[c] || 'Не удалось войти. Попробуйте ещё раз.');
    return false;
  };

  const requestCode = async () => {
    setBusy(true);
    setError('');
    try {
      const r = await startMaxLogin();
      setCode(r.code);
      setBotLink(r.botLink);
      setBotName(r.botName);
      setLeft(CODE_TTL);
      doneRef.current = false;
      setStep('code');
    } catch {
      setError(errorText.request_failed);
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (step !== 'code' || !code) return;
    const tick = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(tick);
  }, [step, code]);

  useEffect(() => {
    if (step !== 'code' || !code) return;
    const poll = window.setInterval(async () => {
      if (doneRef.current) return;
      try {
        const r = await api.auth('login_status', { params: { code } });
        if (r.status !== 'confirmed') return;
        doneRef.current = true;
        window.clearInterval(poll);
        try {
          await finish();
        } catch (e) {
          handleError(e);
        }
      } catch {
        /* keep polling */
      }
    }, 3000);
    return () => window.clearInterval(poll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, code, loginRole]);

  const legacyLogin = async () => {
    if (!maxValid) {
      setError(errorText.bad_max_id);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await finish();
    } catch (e) {
      handleError(e);
    } finally {
      setBusy(false);
    }
  };

  const register = async () => {
    if (name.trim().length < 2) {
      setError(errorText.bad_name);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await finish({
        name: name.trim(),
        city: city.trim() || CITIES[0],
        phone: phone.trim(),
        contact: cleanMax ? `MAX: @${cleanMax}` : phone.trim(),
        skill: skill.trim(),
        about: about.trim(),
        acceptedTerms: true,
      });
    } catch (e) {
      const c = (e as Error).message;
      setError(errorText[c] || 'Не удалось создать аккаунт. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  const mmss = `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}`;

  return (
    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            {adminHint
              ? 'Вы вошли как администратор'
              : step === 'register'
                ? 'Создание аккаунта'
                : roleCopy[loginRole].title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {adminHint
              ? 'Доступна панель управления сервисом.'
              : step === 'register'
                ? 'Аккаунта пока нет — заполните короткую анкету.'
                : roleCopy[loginRole].hint}
          </DialogDescription>
        </DialogHeader>

        {adminHint ? (
          <div className="space-y-3">
            <button
              onClick={() => {
                setLoginOpen(false);
                navigate('/admin');
              }}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
            >
              <Icon name="ShieldCheck" size={18} />
              Перейти в админку
            </button>
            <button
              onClick={() => {
                setLoginOpen(false);
                navigate('/dashboard');
              }}
              className="w-full rounded-full border border-line py-4 text-base font-medium transition-colors hover:border-primary/50"
            >
              В обычный кабинет
            </button>
          </div>
        ) : (
          <>
            <div className="flex gap-2 rounded-full border border-line p-1">
              {(['customer', 'executor'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => openLogin(r)}
                  className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    loginRole === r
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r === 'customer' ? 'Я заказчик' : 'Я исполнитель'}
                </button>
              ))}
            </div>

            {step === 'code' && (
              <div className="space-y-4">
                <div className="rounded-3xl border border-line bg-tile p-6 text-center">
                  <p className="text-xs uppercase tracking-[0.18em] text-chip">Ваш код входа</p>
                  <p className="mt-3 font-head text-4xl font-semibold tracking-[0.3em] text-primary">
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
                  Открыть бота в MAX{botName ? ` · @${botName}` : ''}
                </a>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard?.writeText(code);
                      toast({ title: 'Код скопирован' });
                    }}
                    className="flex-1 rounded-full border border-line py-3 text-sm transition-colors hover:border-primary/50"
                  >
                    Скопировать код
                  </button>
                  <button
                    onClick={requestCode}
                    disabled={busy}
                    className="flex-1 rounded-full border border-line py-3 text-sm transition-colors hover:border-primary/50 disabled:opacity-60"
                  >
                    Получить новый код
                  </button>
                </div>
                <p className="flex items-center justify-center gap-2 text-xs text-chip">
                  <Icon name="Loader" size={14} />
                  Ждём подтверждения в MAX…
                </p>
              </div>
            )}

            {step === 'start' && !maxEnabled && (
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
            )}

            {step === 'register' && (
              <div className="space-y-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как вас зовут"
                  className={field}
                />
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Город или район области"
                  list="cities-list"
                  className={field}
                />
                <datalist id="cities-list">
                  {CITIES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Телефон для связи"
                  inputMode="tel"
                  className={field}
                />
                {loginRole === 'executor' && (
                  <>
                    <input
                      value={skill}
                      onChange={(e) => setSkill(e.target.value)}
                      placeholder="Чем занимаетесь: грузчик, сборка мебели…"
                      className={field}
                    />
                    <textarea
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      placeholder="О себе: опыт, инструмент, когда свободны"
                      className={`${field} min-h-[90px] resize-none`}
                    />
                  </>
                )}

                <label className="flex cursor-pointer gap-3 rounded-2xl border border-line bg-tile p-4 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={terms}
                    onChange={(e) => setTerms(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[hsl(var(--primary))]"
                  />
                  <span>
                    Я принимаю{' '}
                    <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
                      условия оферты
                    </Link>{' '}
                    и{' '}
                    <Link
                      to="/privacy"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      политику конфиденциальности
                    </Link>
                  </span>
                </label>
              </div>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            {step === 'register' ? (
              <button
                onClick={register}
                disabled={!terms || busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Icon name="UserPlus" size={18} />
                {busy ? 'Создаём…' : 'Создать аккаунт'}
              </button>
            ) : step === 'start' ? (
              <button
                onClick={maxEnabled ? requestCode : legacyLogin}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                <Icon name="MessageCircle" size={18} />
                {busy ? 'Проверяем…' : maxEnabled ? 'Войти через MAX' : 'Продолжить через MAX'}
              </button>
            ) : null}

            <p className="text-center text-xs text-chip">
              Сервис бесплатный, комиссий нет. Ответственность за сделки — на пользователях.
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
