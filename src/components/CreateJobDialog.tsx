import { useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { CATEGORIES, CITY_DISTRICTS, CITY_LIST, money } from '@/data/mock';
import { CATEGORY_META, PRESETS, categoryMeta } from '@/data/categories';
import { prepareJobPhoto } from '@/lib/image';
import { toast } from '@/hooks/use-toast';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

const STEPS = ['Что нужно сделать', 'Когда и где', 'Цена и фото'];
const WHEN_CHIPS = ['Сегодня', 'Завтра', 'На этой неделе', 'Договоримся'];
const PRICE_CHIPS = [500, 1000, 1500, 2000, 3000];

const CreateJobDialog = ({ open, onOpenChange }: Props) => {
  const { createJob, feed } = useAppState();
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cityName, setCityName] = useState(CITY_LIST[0]);
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [when, setWhen] = useState('Сегодня');
  const [category, setCategory] = useState(CATEGORIES[1]);
  const [photoThumb, setPhotoThumb] = useState('');
  const [photoFull, setPhotoFull] = useState('');
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const districts = CITY_DISTRICTS[cityName] || [];
  const cat = categoryMeta(category);

  const avgPrice = useMemo(() => {
    const same = feed.filter((j) => j.category === category && j.price > 0);
    if (same.length < 2) return 0;
    return Math.round(same.reduce((s, j) => s + j.price, 0) / same.length / 50) * 50;
  }, [feed, category]);

  const checkStep = (s: number) => {
    const next: Record<string, string> = {};
    if (s === 0) {
      if (title.trim().length < 3) next.title = 'Коротко назовите задачу — минимум 3 символа';
      if (description.trim().length < 10)
        next.description = 'Опишите подробнее — минимум 10 символов';
    }
    if (s === 1) {
      if (!cityName) next.city = 'Выберите город';
      if (districts.length && !district) next.district = 'Выберите район';
      if (!when.trim()) next.when = 'Укажите, когда нужно выполнить';
    }
    if (s === 2) {
      if (!price || Number(price) < 1) next.price = 'Укажите сумму';
    }
    return next;
  };

  const goNext = () => {
    const next = checkStep(step);
    setErrors(next);
    if (Object.keys(next).length) return;
    setStep((v) => Math.min(2, v + 1));
  };

  const usePreset = (p: (typeof PRESETS)[number]) => {
    setTitle(p.title);
    setCategory(p.category);
    setDescription(p.description);
    setPrice(String(p.price));
    setErrors({});
    setStep(1);
  };

  const reset = () => {
    setStep(0);
    setTitle('');
    setDescription('');
    setPrice('');
    setAddress('');
    setWhen('Сегодня');
    setPhotoThumb('');
    setPhotoFull('');
    setErrors({});
  };

  const submit = async () => {
    const all = { ...checkStep(0), ...checkStep(1), ...checkStep(2) };
    setErrors(all);
    if (Object.keys(all).length) {
      if (all.title || all.description) setStep(0);
      else if (all.city || all.district || all.when) setStep(1);
      return;
    }

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
      reset();
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

  const field =
    'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

  const err = (k: string) =>
    errors[k] ? <p className="mt-1.5 text-sm text-destructive">{errors[k]}</p> : null;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setErrors({});
        onOpenChange(v);
      }}
    >
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden border-line bg-surface p-0 text-foreground sm:max-w-[600px]">
        <DialogHeader className="shrink-0 space-y-3 border-b border-line px-5 pb-4 pt-5 text-left sm:px-6">
          <DialogTitle className="font-head text-xl font-medium tracking-tight sm:text-2xl">
            Новое объявление
          </DialogTitle>
          <DialogDescription className="sr-only">
            Заполните задание в три шага: что нужно сделать, когда и где, цена и фото.
          </DialogDescription>
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <span
                key={s}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i <= step ? 'bg-primary' : 'bg-line'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            Шаг {step + 1} из 3 · {STEPS[step]}
          </p>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 sm:px-6">
          {step === 0 && (
            <>
              <div>
                <p className="text-sm font-medium">Выберите готовую задачу</p>
                <p className="mt-1 text-xs text-chip">
                  Подставим название, категорию и примерную цену — потом всё можно поправить.
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PRESETS.map((p) => {
                    const m = categoryMeta(p.category);
                    return (
                      <button
                        key={p.title}
                        onClick={() => usePreset(p)}
                        className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-line bg-tile p-3 text-left transition-colors hover:border-primary/50"
                      >
                        <span
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${m.tone}`}
                        >
                          <Icon name={m.icon} size={18} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">{p.title}</span>
                          <span className="block text-xs text-chip">
                            {m.short} · от {money(p.price)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-line pt-5">
                <label className="mb-2 block text-sm font-medium">Своя задача</label>
                <input
                  className={field}
                  placeholder="Что нужно сделать"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                {err('title')}
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Категория</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CATEGORY_META.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setCategory(m.label)}
                      className={`flex min-h-[44px] flex-col items-start gap-2 rounded-2xl border p-3 text-left transition-colors ${
                        category === m.label
                          ? `${m.tone} ring-2 ring-primary/40`
                          : 'border-line bg-tile text-muted-foreground hover:border-primary/40'
                      }`}
                    >
                      <Icon name={m.icon} size={18} />
                      <span className="text-sm font-medium leading-tight">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Описание</label>
                <textarea
                  className={`${field} min-h-[110px] resize-none`}
                  placeholder="Подробности: объём работ, инструмент, этаж, сроки"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                {err('description')}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium">Город</label>
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
                  {err('city')}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">
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
                  {err('district')}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Улица и дом</label>
                <input
                  className={field}
                  placeholder="Необязательно"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div>
                <p className="mb-2 text-sm font-medium">Когда нужно</p>
                <div className="flex flex-wrap gap-2">
                  {WHEN_CHIPS.map((w) => (
                    <button
                      key={w}
                      onClick={() => setWhen(w)}
                      className={`min-h-[44px] rounded-full border px-4 py-2 text-sm transition-colors ${
                        when === w
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-line bg-tile text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {w}
                    </button>
                  ))}
                </div>
                <input
                  className={`${field} mt-3`}
                  placeholder="Или впишите своё: «Суббота с утра»"
                  value={when}
                  onChange={(e) => setWhen(e.target.value)}
                />
                {err('when')}
              </div>
            </>
          )}

          {step === 2 && (
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
          )}
        </div>

        <div className="shrink-0 border-t border-line bg-surface px-5 py-4 sm:px-6">
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => setStep((v) => v - 1)}
                className="min-h-[44px] shrink-0 rounded-full border border-line px-5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50"
              >
                Назад
              </button>
            )}
            {step < 2 ? (
              <button
                onClick={goNext}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
              >
                Далее
                <Icon name="ArrowRight" size={18} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={busy}
                className="flex min-h-[48px] flex-1 items-center justify-center gap-2 rounded-full bg-primary px-6 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-60"
              >
                <Icon name="Send" size={18} />
                {busy ? 'Публикуем…' : 'Разместить задание'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;