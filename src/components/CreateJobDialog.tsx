import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import type { JobItem } from '@/lib/api';
import { CATEGORIES, CITY_DISTRICTS, CITY_LIST } from '@/data/mock';
import { PRESETS } from '@/data/categories';
import { toast } from '@/hooks/use-toast';
import StepTaskDetails from '@/components/create-job/StepTaskDetails';
import StepWhenWhere from '@/components/create-job/StepWhenWhere';
import StepPricePhoto from '@/components/create-job/StepPricePhoto';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  job?: JobItem | null;
}

const STEPS = ['Что нужно сделать', 'Когда и где', 'Цена и фото'];

const splitCity = (raw: string) => {
  const parts = (raw || '').split(',').map((s) => s.trim());
  const city = parts[0] || CITY_LIST[0];
  const known = CITY_DISTRICTS[city] || [];
  const second = parts[1] || '';
  const isDistrict = known.includes(second);
  return {
    city,
    district: isDistrict ? second : '',
    address: (isDistrict ? parts.slice(2) : parts.slice(1)).filter(Boolean).join(', '),
  };
};

const CreateJobDialog = ({ open, onOpenChange, job }: Props) => {
  const { createJob, editJob, feed } = useAppState();
  const editing = !!job;
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

  useEffect(() => {
    if (!open) return;
    if (job) {
      const loc = splitCity(job.city);
      setStep(0);
      setTitle(job.title);
      setDescription(job.description);
      setPrice(String(job.price));
      setCityName(loc.city);
      setDistrict(loc.district);
      setAddress(loc.address);
      setWhen(job.when);
      setCategory(job.category);
      setPhotoThumb(job.photo || '');
      setPhotoFull('');
      setErrors({});
    } else {
      setStep(0);
      setTitle('');
      setDescription('');
      setPrice('');
      setDistrict('');
      setAddress('');
      setWhen('Сегодня');
      setCategory(CATEGORIES[1]);
      setPhotoThumb('');
      setPhotoFull('');
      setErrors({});
    }
  }, [open, job]);

  const districts = CITY_DISTRICTS[cityName] || [];

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
    const payload = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      city: [cityName, district, address.trim()].filter(Boolean).join(', '),
      when: when.trim() || 'Дата не указана',
      category,
      photoThumb: photoFull ? photoThumb : undefined,
      photoFull: photoFull || undefined,
    };
    try {
      if (editing && job) {
        await editJob({ ...payload, jobId: job.id });
        toast({
          title: 'Изменения сохранены',
          description: 'Объявление снова уйдёт на проверку модератору.',
        });
      } else {
        await createJob(payload);
        toast({
          title: 'Задание отправлено на проверку',
          description: 'После одобрения модератором оно появится в ленте заказов.',
        });
      }
      reset();
      onOpenChange(false);
    } catch (e) {
      const code = (e as Error).message;
      toast({
        title:
          code === 'active_job_exists'
            ? 'Уже есть активное задание'
            : code === 'job_in_work'
              ? 'Задание уже в работе'
              : editing
                ? 'Не удалось сохранить'
                : 'Не удалось опубликовать',
        description:
          code === 'active_job_exists'
            ? 'Новое можно выставить после завершения текущего или через 24 часа.'
            : code === 'job_in_work'
              ? 'Редактировать можно только объявления, которые ещё не взяли в работу.'
              : 'Проверьте поля и попробуйте ещё раз.',
      });
    } finally {
      setBusy(false);
    }
  };

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
            {editing ? 'Редактирование объявления' : 'Новое объявление'}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Заполните задание в три шага: что нужно сделать, когда и где, цена и фото.
          </DialogDescription>
          {editing && (
            <p className="flex items-start gap-2 rounded-2xl border border-line bg-tile px-3.5 py-2.5 text-xs text-muted-foreground">
              <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-primary" />
              После изменений объявление снова уйдёт на проверку модератору и на время
              скроется из ленты.
            </p>
          )}
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
            <StepTaskDetails
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              category={category}
              setCategory={setCategory}
              errors={errors}
              usePreset={usePreset}
              activePreset={PRESETS.find((p) => p.title === title)?.title}
            />
          )}

          {step === 1 && (
            <StepWhenWhere
              cityName={cityName}
              setCityName={setCityName}
              district={district}
              setDistrict={setDistrict}
              address={address}
              setAddress={setAddress}
              when={when}
              setWhen={setWhen}
              errors={errors}
            />
          )}

          {step === 2 && (
            <StepPricePhoto
              price={price}
              setPrice={setPrice}
              avgPrice={avgPrice}
              errors={errors}
              photoThumb={photoThumb}
              setPhotoThumb={setPhotoThumb}
              setPhotoFull={setPhotoFull}
              photoBusy={photoBusy}
              setPhotoBusy={setPhotoBusy}
              fileRef={fileRef}
              title={title}
              cityName={cityName}
              district={district}
              when={when}
              description={description}
              category={category}
            />
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
                <Icon name={editing ? 'Check' : 'Send'} size={18} />
                {busy
                  ? editing
                    ? 'Сохраняем…'
                    : 'Публикуем…'
                  : editing
                    ? 'Сохранить изменения'
                    : 'Разместить задание'}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateJobDialog;