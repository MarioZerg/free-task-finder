import { useEffect, useRef, useState } from 'react';
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
import { useAppState } from '@/hooks/use-app-state';
import { CITIES } from '@/data/mock';
import { toast } from '@/hooks/use-toast';
import { formatPhone, isPhoneValid, phoneDigits } from '@/lib/phone';

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
  const { user, updateProfile } = useAppState();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState<string>('');
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [contact, setContact] = useState('');
  const [skill, setSkill] = useState('');
  const [about, setAbout] = useState('');
  const [busy, setBusy] = useState(false);
  const [proOpen, setProOpen] = useState(false);

  useEffect(() => {
    if (!open || !user) return;
    setAvatar(user.avatar || '');
    setName(user.name || '');
    setCity(user.city || '');
    setPhone(user.phone ? formatPhone(user.phone) : '');
    setContact(user.contact || '');
    setSkill(user.skill || '');
    setAbout(user.about || '');
  }, [open, user]);

  if (!user) return null;

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
        ...(avatar && avatar !== user.avatar ? { avatar } : {}),
      });
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
            className="relative rounded-full transition-transform hover:scale-[1.03]"
            aria-label="Загрузить фото"
          >
            <Avatar src={avatar} name={name || user.name} size={72} />
            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Icon name="Camera" size={14} />
            </span>
          </button>
          <div className="text-sm text-chip">
            <p>Нажмите на фото, чтобы заменить.</p>
            <p className="mt-1">Квадрат 512×512, вес уменьшим автоматически.</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </div>

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
          {user.role === 'executor' && (
            <>
              <input
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="Чем занимаетесь"
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
        </div>

        <div className="rounded-3xl border border-line bg-tile p-4">
          <p className="flex items-center gap-2 font-head text-base font-medium">
            <Icon name="Crown" size={16} className="text-amber-600" />
            Подписка
          </p>
          <p className="mt-1 text-sm text-chip">
            {user.isPro
              ? `Доделай PRO активен до ${new Date(user.subscriptionUntil || '').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}`
              : 'Доделай PRO — больше заданий, быстрое поднятие и приглашения исполнителей.'}
          </p>
          <button
            onClick={() => setProOpen(true)}
            className="mt-3 w-full rounded-full border border-amber-500/50 bg-amber-500/10 px-5 py-2.5 text-sm font-medium text-amber-600 transition-colors hover:bg-amber-500/20"
          >
            {user.isPro ? 'Управлять подпиской' : 'Подключить PRO'}
          </button>
        </div>

        <button
          onClick={save}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          <Icon name="Check" size={18} />
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>

        <SubscriptionDialog open={proOpen} onOpenChange={setProOpen} />
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;