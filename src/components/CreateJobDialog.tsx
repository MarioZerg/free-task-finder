import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { CATEGORIES, CITY_DISTRICTS, CITY_LIST } from '@/data/mock';
import { prepareJobPhoto } from '@/lib/image';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const CreateJobDialog = ({ open, onOpenChange }: Props) => {
  const { createJob } = useAppState();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cityName, setCityName] = useState(CITY_LIST[0]);
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [when, setWhen] = useState('Сегодня до 19:00');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [photoThumb, setPhotoThumb] = useState('');
  const [photoFull, setPhotoFull] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const next: Record<string, string> = {};
    if (title.trim().length < 3) next.title = 'Коротко назовите задачу';
    if (description.trim().length < 10) next.description = 'Опишите подробнее — минимум 10 символов';
    if (!price || Number(price) < 1) next.price = 'Укажите сумму';
    if (!cityName) next.city = 'Выберите город';
    if (districts.length && !district) next.district = 'Выберите район';
    setErrors(next);
    if (Object.keys(next).length) return;

    setBusy(true);
    try {
      await createJob({
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        city: [cityName, district, address.trim()].filter(Boolean).join(', '),
        when: when.trim() || 'Дата не указана',
        category,
        photoThumb: photoThumb || undefined,
        photoFull: photoFull || undefined,
      });
      toast({
        title: 'Задание отправлено на проверку',
        description: 'После одобрения модератором оно появится в ленте заказов.',
      });
      setTitle('');
      setDescription('');
      setPrice('');
      setAddress('');
      setPhotoThumb('');
      setPhotoFull('');
      onOpenChange(false);
    } catch (e) {
      const code = (e as Error).message;
      toast({
        title:
          code === 'active_job_exists' ? 'Уже есть активное задание' : 'Не удалось опубликовать',
        description:
          code === 'active_job_exists'
            ? 'Новое можно выставить после завершения текущего или через 24 часа.'
            : 'Проверьте поля и попробуйте ещё раз.',
      });
    } finally {
      setBusy(false);
    }
  };

  const districts = CITY_DISTRICTS[cityName] || [];

  const field =
    'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line bg-surface text-foreground sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            Новое объявление
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Публикация бесплатна. Одновременно можно вести одно задание.
          </DialogDescription>
        </DialogHeader>

        <p className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3.5 text-sm text-muted-foreground">
          <Icon name="TriangleAlert" size={18} className="mt-0.5 shrink-0 text-primary" />
          Задание прописывайте тщательно: что нужно сделать, объём, адрес и срок. Модераторы
          проверят его и после проверки выставят в ленту заказов.
        </p>

        <div className="space-y-4">
          <div>
            <input
              className={field}
              placeholder="Что нужно сделать"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            {errors.title && <p className="mt-1 text-sm text-destructive">{errors.title}</p>}
          </div>

          <div>
            <textarea
              className={`${field} min-h-[110px] resize-none`}
              placeholder="Подробности: объём работ, инструмент, этаж, сроки"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            {errors.description && (
              <p className="mt-1 text-sm text-destructive">{errors.description}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm text-muted-foreground">Сумма оплаты</label>
            <div className="relative">
              <input
                className={`${field} pr-12 font-head text-2xl font-medium`}
                inputMode="numeric"
                placeholder="0"
                value={price ? Number(price).toLocaleString('ru-RU') : ''}
                onChange={(e) => setPrice(e.target.value.replace(/\D/g, '').slice(0, 7))}
              />
              <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 font-head text-2xl text-chip">
                ₽
              </span>
            </div>
            <p className="mt-1.5 text-xs text-chip">
              Сумму назначаете вы. Итоговую можно изменить при завершении заказа.
            </p>
            {errors.price && <p className="mt-1 text-sm text-destructive">{errors.price}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-muted-foreground">Город</label>
              <select
                className={field}
                value={cityName}
                onChange={(e) => {
                  setCityName(e.target.value);
                  setDistrict('');
                }}
              >
                {CITY_LIST.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              {errors.city && <p className="mt-1 text-sm text-destructive">{errors.city}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm text-muted-foreground">
                {districts.length ? 'Район' : 'Район не требуется'}
              </label>
              <select
                className={field}
                value={district}
                disabled={!districts.length}
                onChange={(e) => setDistrict(e.target.value)}
              >
                <option value="">{districts.length ? 'Выберите район' : 'Весь город'}</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
              {errors.district && (
                <p className="mt-1 text-sm text-destructive">{errors.district}</p>
              )}
            </div>
          </div>

          <input
            className={field}
            placeholder="Улица и дом (необязательно)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />

          <input
            className={field}
            placeholder="Когда нужно"
            value={when}
            onChange={(e) => setWhen(e.target.value)}
          />

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Категория</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.slice(1).map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors ${
                    category === c
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-line text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-muted-foreground">Фото задачи (необязательно)</p>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                if (!file) return;
                setPhotoBusy(true);
                try {
                  const r = await prepareJobPhoto(file);
                  setPhotoThumb(r.thumb);
                  setPhotoFull(r.full);
                } catch {
                  toast({
                    title: 'Не удалось загрузить фото',
                    description: 'Выберите другое изображение.',
                  });
                } finally {
                  setPhotoBusy(false);
                }
              }}
            />

            {photoThumb ? (
              <div className="relative overflow-hidden rounded-2xl border border-line">
                <img src={photoThumb} alt="Фото задачи" className="h-48 w-full object-cover" />
                <div className="absolute right-3 top-3 flex gap-2">
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="min-h-[44px] rounded-full bg-background/90 px-4 py-2 text-xs font-medium shadow-sm"
                  >
                    Заменить
                  </button>
                  <button
                    onClick={() => {
                      setPhotoThumb('');
                      setPhotoFull('');
                    }}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-background/90 shadow-sm"
                    aria-label="Удалить фото"
                  >
                    <Icon name="X" size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={photoBusy}
                className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-tile px-4 py-8 text-sm text-muted-foreground transition-colors hover:border-primary/60 disabled:opacity-60"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon name={photoBusy ? 'Loader' : 'Camera'} size={20} />
                </span>
                {photoBusy ? 'Готовим фото…' : 'Загрузить фото с телефона или компьютера'}
                <span className="text-xs text-chip">Фото поможет исполнителю оценить объём</span>
              </button>
            )}
          </div>

          <button
            onClick={submit}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
          >
            <Icon name="Send" size={18} />
            {busy ? 'Публикуем…' : 'Опубликовать бесплатно'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;