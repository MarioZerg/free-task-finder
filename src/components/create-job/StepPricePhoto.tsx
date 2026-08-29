import { RefObject } from 'react';
import Icon from '@/components/ui/icon';
import { money } from '@/data/mock';
import { categoryMeta } from '@/data/categories';
import { prepareJobPhoto } from '@/lib/image';
import { toast } from '@/hooks/use-toast';

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

const PRICE_CHIPS = [500, 1000, 1500, 2000, 3000];

interface Props {
  price: string;
  setPrice: (v: string) => void;
  avgPrice: number;
  errors: Record<string, string>;
  photoThumb: string;
  setPhotoThumb: (v: string) => void;
  setPhotoFull: (v: string) => void;
  photoBusy: boolean;
  setPhotoBusy: (v: boolean) => void;
  fileRef: RefObject<HTMLInputElement>;
  title: string;
  cityName: string;
  district: string;
  when: string;
  description: string;
  category: string;
}

const StepPricePhoto = ({
  price,
  setPrice,
  avgPrice,
  errors,
  photoThumb,
  setPhotoThumb,
  setPhotoFull,
  photoBusy,
  setPhotoBusy,
  fileRef,
  title,
  cityName,
  district,
  when,
  description,
  category,
}: Props) => {
  const cat = categoryMeta(category);

  const err = (k: string) =>
    errors[k] ? <p className="mt-1.5 text-sm text-destructive">{errors[k]}</p> : null;

  return (
    <>
      <div>
        <label className="mb-2 block text-sm font-medium">Сумма оплаты</label>
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
        <div className="mt-2.5 flex flex-wrap gap-2">
          {PRICE_CHIPS.map((p) => (
            <button
              key={p}
              onClick={() => setPrice(String(p))}
              className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors ${
                Number(price) === p
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-line bg-tile text-muted-foreground hover:border-primary/50'
              }`}
            >
              {p.toLocaleString('ru-RU')} ₽
            </button>
          ))}
        </div>
        <p className="mt-2.5 flex items-start gap-2 text-xs text-chip">
          <Icon name="Info" size={14} className="mt-0.5 shrink-0" />
          {avgPrice
            ? `Средняя цена по похожим задачам в ленте — около ${money(avgPrice)}.`
            : 'Ориентир по области: простая помощь — от 700 ₽, работа на несколько часов — 1500–3000 ₽.'}
        </p>
        {err('price')}
      </div>

      <div>
        <p className="text-sm font-medium">Добавьте фото</p>
        <p className="mb-2 mt-1 text-xs text-chip">Заказы с фото берут в 2 раза чаще.</p>
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
            <img src={photoThumb} alt="Фото задачи" className="h-44 w-full object-cover" />
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
            className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-line bg-tile px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary/60 disabled:opacity-60"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon name={photoBusy ? 'Loader' : 'Camera'} size={20} />
            </span>
            {photoBusy ? 'Готовим фото…' : 'Загрузить фото с телефона или компьютера'}
          </button>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Так его увидят исполнители</p>
        <div className="rounded-3xl border border-line bg-tile p-4">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border ${cat.tone}`}
            >
              <Icon name={cat.icon} size={19} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 break-words font-head text-base font-medium leading-snug">
                  {title.trim() || 'Название задачи'}
                </p>
                <span className="shrink-0 whitespace-nowrap font-head text-xl font-semibold leading-none text-primary">
                  {money(Number(price) || 0)}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-chip">
                {[cityName, district].filter(Boolean).join(', ')} · {when.trim() || '—'}
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-start gap-3">
            {photoThumb && (
              <img
                src={photoThumb}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl border border-line object-cover"
              />
            )}
            <p className="line-clamp-2 min-w-0 flex-1 break-words text-sm text-muted-foreground">
              {description.trim() || 'Описание задачи появится здесь'}
            </p>
          </div>
          <span
            className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${cat.tone}`}
          >
            <Icon name={cat.icon} size={13} />
            {cat.short}
          </span>
        </div>
      </div>

      <p className="flex items-start gap-2.5 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
        <Icon name="TriangleAlert" size={18} className="mt-0.5 shrink-0 text-primary" />
        Модераторы проверят задание и после проверки выставят его в ленту заказов.
      </p>
    </>
  );
};

export default StepPricePhoto;