import Icon from '@/components/ui/icon';
import ProfessionSelect from '@/components/create-job/ProfessionSelect';
import { money } from '@/data/mock';
import { CATEGORY_META, PRESETS, categoryMeta } from '@/data/categories';

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

interface Props {
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  profession: string;
  setProfession: (v: string) => void;
  errors: Record<string, string>;
  usePreset: (p: (typeof PRESETS)[number]) => void;
  activePreset?: string;
}

const StepTaskDetails = ({
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  profession,
  setProfession,
  errors,
  usePreset,
  activePreset,
}: Props) => {
  const err = (k: string) =>
    errors[k] ? <p className="mt-1.5 text-sm text-destructive">{errors[k]}</p> : null;

  return (
    <>
      <div>
        <p className="text-sm font-medium">Подсказка: выберите готовую задачу</p>
        <p className="mt-1 text-xs text-chip">
          Заполним название, категорию и примерную цену — а текст ниже вы поправите под себя.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {PRESETS.map((p) => {
            const m = categoryMeta(p.category);
            const active = activePreset === p.title;
            return (
              <button
                key={p.title}
                onClick={() => usePreset(p)}
                className={`flex min-h-[44px] items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                  active
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                    : 'border-line bg-tile hover:border-primary/50'
                }`}
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
                {active && <Icon name="Check" size={16} className="shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-line pt-5">
        <label className="mb-2 block text-sm font-medium">Название задачи</label>
        <input
          className={field}
          placeholder="Что нужно сделать"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        {err('title')}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Кто нужен</p>
        <p className="mb-2 text-xs text-chip">
          Выберите специальность — уведомление придёт мастерам именно этого профиля.
        </p>
        <ProfessionSelect
          value={profession}
          onChange={setProfession}
          error={errors.profession}
        />
        {err('profession')}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">Категория</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORY_META.map((m) => (
            <button
              key={m.id}
              onClick={() => setCategory(m.label)}
              className={`flex min-h-[44px] items-center gap-2 rounded-2xl border px-3 py-3 transition-colors ${
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
        <p className="mb-2 text-xs text-chip">
          Опишите задачу своими словами — так исполнители точнее поймут объём работы.
        </p>
        <textarea
          className={`${field} min-h-[110px] resize-none`}
          placeholder="Подробности: объём работ, инструмент, этаж, сроки"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {err('description')}
      </div>
    </>
  );
};

export default StepTaskDetails;