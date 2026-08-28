import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { useAppState } from '@/hooks/use-app-state';
import { pushConfig, pushTest, updateNotifyPrefs } from '@/lib/api';
import {
  currentSubscription,
  disablePush,
  enablePush,
  getPermission,
  iosNeedsInstall,
  pushSupported,
} from '@/lib/push';

type PrefKey = 'messages' | 'responses' | 'status';

const PREFS: { key: PrefKey; title: string; hint: string; icon: string }[] = [
  {
    key: 'messages',
    title: 'Сообщения по заказу',
    hint: 'Когда вам пишут в чате заказа',
    icon: 'MessageCircle',
  },
  {
    key: 'responses',
    title: 'Отклики на задание',
    hint: 'Когда исполнитель откликнулся на ваше задание',
    icon: 'Users',
  },
  {
    key: 'status',
    title: 'Статус задания',
    hint: 'Модерация, назначение, завершение и отзывы',
    icon: 'BellRing',
  },
];

const NotificationSettings = () => {
  const { user, setUserData } = useAppState();
  const [supported, setSupported] = useState(true);
  const [needsInstall, setNeedsInstall] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [publicKey, setPublicKey] = useState('');
  const [enabledOnServer, setEnabledOnServer] = useState(true);
  const [active, setActive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [savingKey, setSavingKey] = useState<PrefKey | null>(null);

  useEffect(() => {
    let alive = true;
    const init = async () => {
      const ok = pushSupported();
      if (!alive) return;
      setSupported(ok);
      setNeedsInstall(iosNeedsInstall());
      setPermission(getPermission());

      try {
        const cfg = await pushConfig();
        if (!alive) return;
        setPublicKey(cfg.publicKey || '');
        setEnabledOnServer(!!cfg.enabled);
      } catch {
        if (alive) setEnabledOnServer(false);
      }

      if (!ok) return;
      const sub = await currentSubscription();
      if (!alive) return;
      setActive(!!sub && getPermission() === 'granted');
    };
    init();
    return () => {
      alive = false;
    };
  }, []);

  const toggleMain = useCallback(
    async (next: boolean) => {
      if (busy) return;
      setBusy(true);
      try {
        if (next) {
          if (!publicKey) {
            toast({
              title: 'Уведомления недоступны',
              description: 'Сервер уведомлений пока не настроен.',
            });
            return;
          }
          const r = await enablePush(publicKey);
          setPermission(getPermission());
          if (!r.ok) {
            if (r.reason === 'unsupported') {
              setSupported(false);
              toast({ title: 'Браузер не поддерживает уведомления' });
            } else if (r.reason === 'denied') {
              toast({
                title: 'Уведомления запрещены',
                description: 'Разрешите уведомления для сайта в настройках браузера.',
              });
            } else {
              toast({ title: 'Не удалось включить уведомления', description: 'Попробуйте ещё раз.' });
            }
            return;
          }
          setActive(true);
          toast({ title: 'Уведомления включены' });
        } else {
          await disablePush();
          setActive(false);
          toast({ title: 'Уведомления выключены' });
        }
      } finally {
        setBusy(false);
      }
    },
    [busy, publicKey],
  );

  const togglePref = useCallback(
    async (key: PrefKey, next: boolean) => {
      if (!user) return;
      const current = {
        messages: user.notifyMessages !== false,
        responses: user.notifyResponses !== false,
        status: user.notifyStatus !== false,
      };
      const payload = { ...current, [key]: next };
      setSavingKey(key);
      try {
        const r = await updateNotifyPrefs(payload);
        if (r?.user) setUserData(r.user);
      } catch {
        toast({ title: 'Не удалось сохранить', description: 'Попробуйте ещё раз.' });
      } finally {
        setSavingKey(null);
      }
    },
    [user, setUserData],
  );

  const sendTest = useCallback(async () => {
    setTesting(true);
    try {
      const r = await pushTest();
      toast({
        title: r?.sent ? 'Пробное уведомление отправлено' : 'Нет активных устройств',
        description: r?.sent
          ? 'Оно придёт в течение нескольких секунд.'
          : 'Включите уведомления на этом устройстве.',
      });
    } catch {
      toast({ title: 'Не удалось отправить', description: 'Попробуйте ещё раз.' });
    } finally {
      setTesting(false);
    }
  }, []);

  if (!user) return null;

  const prefValue = (key: PrefKey) => {
    if (key === 'messages') return user.notifyMessages !== false;
    if (key === 'responses') return user.notifyResponses !== false;
    return user.notifyStatus !== false;
  };

  const note = (icon: string, text: string) => (
    <div className="flex items-start gap-2.5 rounded-2xl border border-line bg-tile p-3.5 text-sm text-chip">
      <Icon name={icon} size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );

  return (
    <div className="space-y-3">
      {!supported && note('CircleAlert', 'Ваш браузер не поддерживает уведомления. Попробуйте Chrome или Safari.')}

      {supported &&
        needsInstall &&
        note(
          'Smartphone',
          'На iPhone уведомления работают только в установленном приложении. Добавьте Доделай.ру на экран «Домой» — кнопка «Установить приложение» ниже.',
        )}

      {supported &&
        permission === 'denied' &&
        note(
          'BellOff',
          'Уведомления заблокированы в настройках браузера. Разрешите их для сайта и вернитесь сюда.',
        )}

      {supported && !enabledOnServer && note('CircleAlert', 'Сервер уведомлений временно недоступен.')}

      <div className="rounded-3xl border border-line bg-tile p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-2 font-head text-base font-medium">
              <Icon name="Bell" size={16} className="text-primary" />
              Уведомления на этом устройстве
            </p>
            <p className="mt-1 text-sm text-chip">
              {busy
                ? 'Настраиваем…'
                : active
                  ? 'Push включены — не пропустите отклик и сообщение.'
                  : 'Включите, чтобы получать push прямо в браузер.'}
            </p>
          </div>
          <Switch
            checked={active}
            disabled={busy || !supported || !enabledOnServer || permission === 'denied'}
            onCheckedChange={toggleMain}
            aria-label="Уведомления на этом устройстве"
          />
        </div>

        {active && (
          <button
            type="button"
            onClick={sendTest}
            disabled={testing}
            className="mt-3 flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/60 disabled:opacity-60"
          >
            <Icon name="Send" size={16} />
            {testing ? 'Отправляем…' : 'Отправить пробное уведомление'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {PREFS.map((p) => (
          <div
            key={p.key}
            className={`flex items-center justify-between gap-3 rounded-2xl border border-line bg-tile p-4 transition-opacity ${active ? '' : 'opacity-60'}`}
          >
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Icon name={p.icon} size={15} className="text-muted-foreground" />
                {p.title}
              </p>
              <p className="mt-0.5 text-xs text-chip">{p.hint}</p>
            </div>
            <Switch
              checked={prefValue(p.key)}
              disabled={!active || savingKey === p.key}
              onCheckedChange={(v) => togglePref(p.key, v)}
              aria-label={p.title}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationSettings;
