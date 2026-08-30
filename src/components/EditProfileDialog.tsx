import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import Avatar from '@/components/Avatar';
import SubscriptionDialog from '@/components/SubscriptionDialog';
import NotificationSettings from '@/components/NotificationSettings';
import InstallPwa from '@/components/InstallPwa';
import ProfileSection from '@/components/profile/ProfileSection';
import SupportPanel from '@/components/profile/SupportPanel';
import { useAppState } from '@/hooks/use-app-state';
import { CITIES } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import { formatPhone, isPhoneValid, phoneDigits } from '@/lib/phone';
import { listProfessions, Profession, updateMyProfessions } from '@/lib/api';

const MAX_PROFESSIONS = 8;

const GENDERS: { value: string; label: string; icon: string }[] = [
  { value: 'male', label: 'Мужской', icon: 'User' },
  { value: 'female', label: 'Женский', icon: 'User' },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

const compress = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('read_failed'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('image_failed'));
      img.onload = () => {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('canvas_failed'));
        const side = Math.min(img.width, img.height);
        ctx.drawImage(
          img,
          (img.width - side) / 2,
          (img.height - side) / 2,
          side,
          side,
          0,
          0,
          size,
          size,
        );
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

const EditProfileDialog = ({ open, onOpenChange }: Props) => {
  const { user, updateProfile, setUserData, logout } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string>('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');
  const [skill, setSkill] = useState('');
  const [about, setAbout] = useState('');
  const [gender, setGender] = useState('');
  const [busy, setBusy] = useState(false);
  const [proOpen, setProOpen] = useState(false);
  const [professions, setProfessions] = useState<Profession[]>([]);
  const [selected, setSelected] = useState<number[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    setAvatar(user.avatar || '');
    setName(user.name || '');
    setCity(user.city || '');
    setPhone(user.phone ? formatPhone(user.phone) : '');
    setContact(user.contact || '');
    setSkill(user.skill || '');
    setAbout(user.about || '');
    setGender(user.gender || '');
    setSelected((user.professions || []).map((p) => p.id));
  }, [open, user]);

  useEffect(() => {
    if (!open || user?.role !== 'executor') return;
    let alive = true;
    listProfessions()
      .then((r) => {
        if (alive) setProfessions(r.professions || []);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [open, user?.role]);

  if (!user) return null;

  const isExecutor = user.role === 'executor';

  const toggleProfession = (id: number) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_PROFESSIONS) {
        toast({ title: `Можно выбрать до ${MAX_PROFESSIONS} специальностей` });
        return prev;
      }
      return [...prev, id];
    });
  };

  const pick = async (file?: File | null) => {
    if (!file) return;
    try {
      setAvatar(await compress(file));
    } catch {
      toast({ title: 'Не удалось загрузить фото', description: 'Попробуйте другое изображение.' });
    }
  };

  const save = async () => {
    if (name.trim().length < 2) {
      toast({ title: 'Введите имя', description: 'Минимум 2 символа.' });
      return;
    }
    setBusy(true);
    try {
      await updateProfile({
        name: name.trim(),
        city: city.trim(),
        phone: isPhoneValid(phone) ? `+${phoneDigits(phone)}` : '',
        contact: contact.trim(),
        skill: skill.trim(),
        about: about.trim(),
        gender,
        ...(avatar && avatar !== user.avatar ? { avatar } : {}),
      });
      if (isExecutor) {
        const r = await updateMyProfessions(selected).catch(() => null);
        if (r?.user) setUserData(r.user);
      }
      toast({ title: 'Профиль сохранён' });
      onOpenChange(false);
    } catch {
      toast({ title: 'Не удалось сохранить', description: 'Попробуйте ещё раз.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            Мой профиль
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Как вас видят другие пользователи Доделай.ру.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <button
            onClick={() => fileRef.current?.click()}
            className="relative shrink-0 rounded-full transition-transform hover:scale-[1.03]"
            aria-label="Загрузить фото"
          >
            <Avatar src={avatar} name={name || user.name} size={64} />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon name="Camera" size={14} />
            </span>
          </button>
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 truncate font-head text-lg font-medium">
              {user.name}
              {user.isPro && (
                <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                  <Icon name="Crown" size={11} />
                  PRO
                </span>
              )}
            </p>
            <p className="mt-0.5 truncate text-xs text-chip">
              ★ {user.rating.toFixed(1)} ·{' '}
              {user.role === 'customer' ? 'заказчик' : `${user.doneCount} работ`}
            </p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

        <ProfileSection
          icon="UserRound"
          title="Личные данные"
          hint="Имя, город, контакты"
          defaultOpen
        >
        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            className={field}
          />
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Город или район области"
            list="profile-cities"
            className={field}
          />
          <datalist id="profile-cities">
            {CITIES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <div>
            <input
              value={phone}
              onFocus={() => !phone && setPhone('+7 (')}
              onChange={(e) => setPhone(formatPhone(e.target.value))}
              placeholder="+7 (900) 000-00-00"
              inputMode="tel"
              maxLength={18}
              className={field}
            />
            {phone && !isPhoneValid(phone) && (
              <p className="mt-1 text-xs text-destructive">Номер из 10 цифр после +7</p>
            )}
          </div>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Контакт для связи: MAX, Telegram"
            className={field}
          />
          {isExecutor && (
            <>
              <div>
                <input
                  value={skill}
                  onChange={(e) => setSkill(e.target.value)}
                  placeholder="Коротко о себе как о специалисте"
                  className={field}
                />
                <p className="mt-1 px-1 text-xs text-chip">
                  Одна строка в карточке — например «Электрик с допуском, работаю по области».
                </p>
              </div>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                placeholder="О себе: опыт, инструмент, когда свободны"
                className={`${field} min-h-[90px] resize-none`}
              />
            </>
          )}

          <div>
            <p className="px-1 text-sm font-medium">Пол</p>
            <p className="mt-0.5 px-1 text-xs text-chip">
              Пол — нужен только для аватара по умолчанию.
            </p>
            <div className="mt-2 flex gap-2">
              {GENDERS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => setGender(gender === g.value ? '' : g.value)}
                  className={`flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm transition-colors ${
                    gender === g.value
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-line bg-tile text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  <Icon name={g.icon} size={15} fallback="Wrench" />
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        </ProfileSection>

        {isExecutor && (
          <ProfileSection
            icon="Wrench"
            title="Что вы умеете"
            hint={`Выбрано ${selected.length} из ${MAX_PROFESSIONS}`}
          >
            <p className="text-sm text-chip">
              Заказчики найдут вас по этим специальностям во вкладке «Люди».
            </p>
            {professions.length === 0 ? (
              <p className="mt-3 text-sm text-chip">Загружаем список…</p>
            ) : (
              <div className="mt-3 flex flex-wrap gap-2">
                {professions.map((p) => {
                  const on = selected.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => toggleProfession(p.id)}
                      className={`flex min-h-[44px] items-center gap-2 rounded-full border px-4 py-2.5 text-sm transition-colors ${
                        on
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-line bg-tile text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      <Icon name={p.icon} size={15} fallback="Wrench" />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            )}
          </ProfileSection>
        )}

        <ProfileSection
          icon="Crown"
          accent="gold"
          title="Подписка PRO"
          hint={user.isPro ? 'Активна' : 'Не подключена'}
        >
          <p className="text-sm text-chip">
            {user.isPro
              ? `Доделай PRO активен до ${new Date(user.subscriptionUntil || '').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : 'Доделай PRO — больше заданий, быстрое поднятие и приглашения исполнителей.'}
          </p>
          <button
            onClick={() => setProOpen(true)}
            className="mt-3 min-h-[44px] w-full rounded-full border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20"
          >
            {user.isPro ? 'Управлять подпиской' : 'Подключить PRO'}
          </button>
        </ProfileSection>

        <ProfileSection icon="Bell" title="Уведомления" hint="Push и события">
          <NotificationSettings />
        </ProfileSection>

        <ProfileSection icon="LifeBuoy" title="Техподдержка" hint="Написать в поддержку">
          <SupportPanel />
        </ProfileSection>

        <ProfileSection icon="Smartphone" title="Приложение" hint="Установить на телефон">
          <p className="text-sm text-chip">
            Доделай.ру можно поставить как обычное приложение — с иконкой на экране и push-уведомлениями.
          </p>
          <div className="mt-3 [&>button]:min-h-[48px] [&>button]:w-full">
            <InstallPwa />
          </div>
        </ProfileSection>

        {user.isAdmin && (
          <Link
            to="/admin"
            onClick={() => onOpenChange(false)}
            className="flex min-h-[52px] items-center gap-3 rounded-2xl border border-line bg-tile px-4 transition-colors hover:border-primary/50"
          >
            <Icon name="ShieldCheck" size={17} className="shrink-0 text-primary" />
            <span className="min-w-0 flex-1 text-sm font-medium">Админка</span>
            <Icon name="ChevronRight" size={17} className="shrink-0 text-chip" />
          </Link>
        )}

        <div className="flex gap-2">
          <button
            onClick={save}
            disabled={busy}
            className="flex min-h-[52px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            <Icon name="Check" size={18} />
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </button>
          <button
            onClick={() => {
              onOpenChange(false);
              logout();
            }}
            title="Выйти"
            aria-label="Выйти"
            className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full border border-line text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
          >
            <Icon name="LogOut" size={18} />
          </button>
        </div>

        <SubscriptionDialog open={proOpen} onOpenChange={setProOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;