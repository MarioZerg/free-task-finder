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
import { useAppState } from '@/hooks/use-app-state';
import { CITIES } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { isPhoneValid, phoneDigits } from '@/lib/phone';
import AdminHintPanel from '@/components/login/AdminHintPanel';
import CodeStep from '@/components/login/CodeStep';
import RegisterStep from '@/components/login/RegisterStep';

// Профиль один на всех: и задачи размещают, и заказы берут с него же,
// поэтому выбор роли при входе больше не нужен.
const LOGIN_TITLE = 'Вход в Доделай.ру';
const LOGIN_HINT =
  'Один профиль на всё: размещайте свои задачи и берите заказы из живой ленты Ярославской области.';

const errorText: Record<string, string> = {
  bad_max_id: 'Ник в MAX: латиница, цифры, точка, дефис или подчёркивание, от 3 символов.',
  bad_name: 'Введите имя — минимум 2 символа.',
  terms_required: 'Заполните анкету и примите условия.',
  code_required: 'Подтвердите вход в боте MAX.',
  code_not_confirmed: 'Код ещё не подтверждён в боте MAX.',
  blocked: 'Аккаунт заблокирован администратором.',
  request_failed: 'Не получилось связаться с сервером. Попробуйте ещё раз.',
};

const CODE_TTL = 15 * 60;

const LoginDialog = () => {
  const { user, loginOpen, setLoginOpen, signIn, startMaxLogin } = useAppState();
  const navigate = useNavigate();

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

  /* Страховка на все случаи: если человек уже вошёл, форме входа висеть
     не за чем. Что бы ни случилось по дороге — сорвалась проверка, вход
     произошёл в другой вкладке, — окно закроется само. */
  useEffect(() => {
    if (user && loginOpen && !adminHint) setLoginOpen(false);
  }, [user, loginOpen, adminHint, setLoginOpen]);

  const success = (isAdmin?: boolean) => {
    toast({
      title: 'Вы в Доделай.ру',
      description: 'Лента заказов открыта, и можно сразу разместить свою задачу.',
    });
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
    // Вход прошёл — окно должно уйти само. Иначе человек возвращается
    // из MAX и видит поверх личного кабинета зависшую форму входа.
    setLoginOpen(false);
    navigate('/dashboard');
  };

  const finish = async (extra: Record<string, unknown> = {}) => {
    const user = await signIn({
      ...(code ? { code } : {}),
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

  /* Код запрашиваем заранее, как только открылось окно входа. Тогда кнопка
     «Войти через MAX» — обычная ссылка с готовым адресом, и браузер её не
     блокирует. Раньше мы открывали пустую вкладку и дописывали адрес после
     ответа сервера: часть браузеров считала это всплывающим окном и рубила
     переход. */
  const requestCode = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const r = await startMaxLogin();
      setCode(r.code);
      setBotLink(r.botLink);
      setLeft(CODE_TTL);
      doneRef.current = false;
      return r.botLink;
    } catch {
      setError(errorText.request_failed);
      return '';
    } finally {
      setBusy(false);
    }
  }, [startMaxLogin]);

  /* Готовим код сразу при открытии окна — к моменту клика ссылка уже есть. */
  useEffect(() => {
    if (!loginOpen || step !== 'start' || code || busy) return;
    requestCode();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginOpen, step]);

  useEffect(() => {
    if (step !== 'code' || !code) return;
    const tick = window.setInterval(() => setLeft((v) => Math.max(0, v - 1)), 1000);
    return () => window.clearInterval(tick);
  }, [step, code]);

  /* Ждём подтверждения из MAX.
     Проверяем, пока окно входа открыто и код получен, — независимо от шага.
     Раньше проверка шла только на экране «код», и если человек возвращался
     из мессенджера в другой момент, вход не подхватывался: форма продолжала
     висеть, хотя в MAX всё было подтверждено. */
  useEffect(() => {
    if (!loginOpen || !code || step === 'register') return;

    const check = async () => {
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
        /* молча ждём следующей попытки */
      }
    };

    const poll = window.setInterval(check, 2000);

    /* Человек подтвердил вход в MAX и переключился обратно на сайт —
       проверяем сразу, а не ждём очередной круг. Иначе он видит форму
       входа, хотя вход уже прошёл. */
    const onBack = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onBack);
    window.addEventListener('focus', onBack);
    window.addEventListener('pageshow', onBack);

    return () => {
      window.clearInterval(poll);
      document.removeEventListener('visibilitychange', onBack);
      window.removeEventListener('focus', onBack);
      window.removeEventListener('pageshow', onBack);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginOpen, code, step]);

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
        contact: phone.trim(),
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
                : LOGIN_TITLE}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {adminHint
              ? 'Доступна панель управления сервисом.'
              : step === 'register'
                ? 'Аккаунта пока нет — заполните анкету, это займёт минуту.'
                : LOGIN_HINT}
          </DialogDescription>
        </DialogHeader>

        {adminHint ? (
          <AdminHintPanel setLoginOpen={setLoginOpen} />
        ) : (
          <>
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
              /* Настоящая ссылка, а не кнопка: браузеры и мессенджеры
                 пропускают такой переход без блокировок. */
              <a
                href={botLink || undefined}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  if (!botLink) {
                    e.preventDefault();
                    return;
                  }
                  setStep('code');
                }}
                aria-disabled={!botLink}
                className={`flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] ${
                  botLink ? '' : 'pointer-events-none opacity-60'
                }`}
              >
                <Icon name="MessageCircle" size={18} />
                {botLink ? 'Войти через MAX' : 'Готовим вход…'}
              </a>
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