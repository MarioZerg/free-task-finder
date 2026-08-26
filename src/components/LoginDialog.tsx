import { useEffect, useState } from 'react';
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

const roleCopy: Record<Role, { title: string; hint: string }> = {
  customer: {
    title: 'Вход для заказчика',
    hint: 'Выставляйте задачи, смотрите отклики и назначайте исполнителя.',
  },
  executor: {
    title: 'Вход для исполнителя',
    hint: 'Радар Доделай — живая лента заказов Ярославской области.',
  },
};

const errorText: Record<string, string> = {
  bad_max_id: 'Ник в MAX: латиница, цифры, точка, дефис или подчёркивание, от 3 символов.',
  bad_role: 'Выберите роль.',
  bad_name: 'Введите имя — минимум 2 символа.',
  terms_required: 'Заполните анкету и примите условия.',
  request_failed: 'Не получилось связаться с сервером. Попробуйте ещё раз.',
};

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

const LoginDialog = () => {
  const { loginOpen, setLoginOpen, loginRole, openLogin, signIn } = useAppState();
  const navigate = useNavigate();

  const [maxId, setMaxId] = useState('');
  const [step, setStep] = useState<'max' | 'register'>('max');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [skill, setSkill] = useState('');
  const [about, setAbout] = useState('');
  const [terms, setTerms] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loginOpen) {
      setStep('max');
      setError('');
      setBusy(false);
    }
  }, [loginOpen]);

  useEffect(() => {
    setStep('max');
    setError('');
  }, [loginRole]);

  const cleanMax = maxId.trim().replace(/^@/, '').toLowerCase();
  const maxValid = /^[a-z0-9._-]{3,60}$/.test(cleanMax);

  const success = () => {
    toast({
      title: 'Вы в Доделай.ру',
      description:
        loginRole === 'customer'
          ? 'Можно выставлять задачу — исполнители увидят её в радаре.'
          : 'Радар открыт — откликайтесь на заказы.',
    });
    setMaxId('');
    setName('');
    setPhone('');
    setSkill('');
    setAbout('');
    setTerms(false);
    navigate('/dashboard');
  };

  const tryLogin = async () => {
    if (!maxValid) {
      setError(errorText.bad_max_id);
      return;
    }
    setError('');
    setBusy(true);
    try {
      await signIn({ maxId: cleanMax, role: loginRole });
      success();
    } catch (e) {
      const code = (e as Error).message;
      if (code === 'terms_required' || code === 'bad_name') {
        setStep('register');
        setError('');
      } else {
        setError(errorText[code] || 'Не удалось войти. Проверьте ник MAX.');
      }
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
      await signIn({
        maxId: cleanMax,
        role: loginRole,
        name: name.trim(),
        city: city.trim() || CITIES[0],
        phone: phone.trim(),
        contact: `MAX: @${cleanMax}`,
        skill: skill.trim(),
        about: about.trim(),
        acceptedTerms: true,
      });
      success();
    } catch (e) {
      const code = (e as Error).message;
      setError(errorText[code] || 'Не удалось создать аккаунт. Попробуйте ещё раз.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            {step === 'register' ? 'Создание аккаунта' : roleCopy[loginRole].title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            {step === 'register'
              ? 'Аккаунта с таким ником пока нет — заполните короткую анкету.'
              : roleCopy[loginRole].hint}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 rounded-full border border-line p-1">
          {(['customer', 'executor'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => openLogin(r)}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                loginRole === r
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground/80 hover:text-foreground'
              }`}
            >
              {r === 'customer' ? 'Я заказчик' : 'Я исполнитель'}
            </button>
          ))}
        </div>

        <div>
          <label className="mb-2 block text-sm text-muted-foreground/80" htmlFor="login-max">
            Ваш профиль MAX
          </label>
          <input
            id="login-max"
            value={maxId}
            onChange={(e) => setMaxId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && step === 'max' && tryLogin()}
            placeholder="@ivan_yar"
            autoComplete="username"
            className={field}
          />
        </div>

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

            <label className="flex cursor-pointer gap-3 rounded-2xl border border-line bg-tile p-4 text-sm text-muted-foreground/85">
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
                <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
                  политику конфиденциальности
                </Link>
              </span>
            </label>
          </div>
        )}

        {error && <p className="text-sm text-destructive-foreground/90">{error}</p>}

        {step === 'max' ? (
          <button
            onClick={tryLogin}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            <Icon name="MessageCircle" size={18} />
            {busy ? 'Проверяем…' : 'Продолжить через MAX'}
          </button>
        ) : (
          <button
            onClick={register}
            disabled={!terms || busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="UserPlus" size={18} />
            {busy ? 'Создаём…' : 'Создать аккаунт'}
          </button>
        )}

        <p className="text-center text-xs text-chip">
          Сервис бесплатный, комиссий нет. Ответственность за сделки — на пользователях.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
