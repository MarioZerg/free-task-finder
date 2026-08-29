import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import InstallPwa from '@/components/InstallPwa';
import { useAppState, Role } from '@/hooks/use-app-state';
import { CITIES } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { isPhoneValid, phoneDigits } from '@/lib/phone';
import AdminHintPanel from '@/components/login/AdminHintPanel';
import CodeStep from '@/components/login/CodeStep';
import StartStep from '@/components/login/StartStep';
import RegisterStep from '@/components/login/RegisterStep';

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

const CODE_TTL = 15 * 60;

const LoginDialog = () => {
  const { loginOpen, setLoginOpen, loginRole, openLogin, signIn, startMaxLogin, maxEnabled } =
    useAppState();
  const navigate = useNavigate();

  const [maxId, setMaxId] = useState('');
  const [step, setStep] = useState<'start' | 'code' | 'register'>('start');
  const [code, setCode] = useState('');
  const [botLink, setBotLink] = useState('');
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
  const [copied, setCopied] = useState(false);
  const doneRef = useRef(false);
  const codeRef = useRef<HTMLParagraphElement>(null);

  const copyCode = useCallback(async () => {
    const value = codeRef.current?.textContent?.replace(/\s/g, '') || '';
    if (!value) return;
    let ok = false;
    try {
      await navigator.clipboard.writeText(value);
      ok = true;
    } catch {
      const area = document.createElement('textarea');
      area.value = value;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      area.setSelectionRange(0, value.length);
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      document.body.removeChild(area);
    }
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      toast({ title: 'Код скопирован', description: value });
    } else {
      toast({
        title: 'Скопируйте код вручную',
        description: `Ваш код: ${value}`,
      });
    }
  }, []);

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
        phone: isPhoneValid(phone) ? `+${phoneDigits(phone)}` : '',
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
                ? 'Аккаунта пока нет — заполните анкету, это займёт минуту.'
                : roleCopy[loginRole].hint}
          </DialogDescription>
        </DialogHeader>

        {adminHint ? (
          <AdminHintPanel setLoginOpen={setLoginOpen} />
        ) : (
          <>
            <div className="flex gap-2 rounded-full border border-line p-1">
              {(['customer', 'executor'] as Role[]).map((r) => (
                <button
                  key={r}
                  onClick={() => openLogin(r)}
                  className={`min-h-[44px] flex-1 rounded-full px-3 py-2.5 text-sm font-medium transition-colors ${
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
              <CodeStep
                code={code}
                codeRef={codeRef}
                copyCode={copyCode}
                left={left}
                mmss={mmss}
                botLink={botLink}
                copied={copied}
                requestCode={requestCode}
                busy={busy}
              />
            )}

            {step === 'start' && !maxEnabled && (
              <StartStep maxId={maxId} setMaxId={setMaxId} legacyLogin={legacyLogin} />
            )}

            {step === 'register' && (
              <RegisterStep
                name={name}
                setName={setName}
                city={city}
                setCity={setCity}
                phone={phone}
                setPhone={setPhone}
                skill={skill}
                setSkill={setSkill}
                about={about}
                setAbout={setAbout}
                terms={terms}
                setTerms={setTerms}
                loginRole={loginRole}
              />
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

        <div className="flex flex-col items-center gap-2 border-t border-line pt-4 text-center">
          <InstallPwa variant="link" />
          <p className="text-xs text-chip">
            Установите приложение на телефон — вход останется сохранённым
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
