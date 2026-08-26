import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { CATEGORIES, PHOTO_FURNITURE, PHOTO_GARDEN, PHOTO_MOVE } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

const photoOptions = [
  { id: 'none', label: 'Без фото', url: undefined },
  { id: 'move', label: 'Переезд', url: PHOTO_MOVE },
  { id: 'garden', label: 'Участок', url: PHOTO_GARDEN },
  { id: 'furniture', label: 'Мебель', url: PHOTO_FURNITURE },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CreateJobDialog = ({ open, onOpenChange }: Props) => {
  const { addJob } = useAppState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [city, setCity] = useState('Ярославль, Кировский район');
  const [when, setWhen] = useState('Сегодня до 19:00');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [photo, setPhoto] = useState('none');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = 'Коротко назовите задачу';
    if (description.trim().length < 10) next.description = 'Опишите подробнее — минимум 10 символов';
    if (!price || Number(price) < 500 || Number(price) > 1500)
      next.price = 'Оплата на сервисе — от 500 до 1500 ₽';
    if (!city.trim()) next.city = 'Укажите город или район области';
    setErrors(next);
    if (Object.keys(next).length) return;

    addJob({
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      city: city.trim(),
      when: when.trim() || 'Дата не указана',
      category,
      photo: photoOptions.find((p) => p.id === photo)?.url,
    });

    toast({
      title: 'Объявление в ленте',
      description: 'Исполнители из Ярославля и области уже видят его — ждите откликов.',
    });
    setTitle('');
    setDescription('');
    setPrice('');
    setPhoto('none');
    onOpenChange(false);
  };

  const field =
    'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            Новое объявление
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            Публикация бесплатна. Объявление появится в общей ленте исполнителей Ярославской
            области.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <input
              className={field}
              placeholder="Что нужно сделать"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="mt-1 text-sm text-destructive-foreground/90">{errors.title}</p>}
          </div>

          <div>
            <textarea
              className={`${field} min-h-[110px] resize-none`}
              placeholder="Подробности: объём работ, инструмент, этаж, сроки"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive-foreground/90">{errors.description}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <input
                className={field}
                inputMode="numeric"
                placeholder="Оплата, 500–1500 ₽"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))}
              />
              {errors.price && <p className="mt-1 text-sm text-destructive-foreground/90">{errors.price}</p>}
            </div>
            <div>
              <input
                className={field}
                placeholder="Город или район Ярославской области"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
              {errors.city && <p className="mt-1 text-sm text-destructive-foreground/90">{errors.city}</p>}
            </div>
          </div>

          <input
            className={field}
            placeholder="Когда нужно"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />

          <div>
            <p className="mb-2 text-sm text-muted-foreground/80">Категория</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(1).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`rounded-full border px-4 py-2 text-sm transition-colors ${
                    category === c
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-line text-muted-foreground/80 hover:border-primary/50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground/80">Фото (необязательно)</p>
            <div className="grid grid-cols-4 gap-2">
              {photoOptions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPhoto(p.id)}
                  className={`overflow-hidden rounded-xl border transition-colors ${
                    photo === p.id ? 'border-primary' : 'border-line hover:border-primary/50'
                  }`}
                >
                  {p.url ? (
                    <img src={p.url} alt={p.label} className="h-16 w-full object-cover" />
                  ) : (
                    <span className="flex h-16 w-full items-center justify-center text-chip">
                      <Icon name="ImageOff" size={18} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={submit}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
          >
            <Icon name="Send" size={18} />
            Опубликовать бесплатно
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;