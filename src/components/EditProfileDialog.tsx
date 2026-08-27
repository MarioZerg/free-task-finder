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
import { useAppState } from '@/hooks/use-app-state';
import { CITIES } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

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

  useEffect(() => {
    if (!open || !user) return;
    setAvatar(user.avatar || '');
    setName(user.name || '');
    setCity(user.city || '');
    setPhone(user.phone || '');
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
        phone: phone.trim(),
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
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Телефон"
            inputMode="tel"
            className={field}
          />
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

        <button
          onClick={save}
          disabled={busy}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          <Icon name="Check" size={18} />
          {busy ? 'Сохраняем…' : 'Сохранить'}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileDialog;
