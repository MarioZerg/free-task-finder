import { CITY_DISTRICTS, CITY_LIST } from '@/data/mock';

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

const WHEN_CHIPS = ['Сегодня', 'Завтра', 'На этой неделе', 'Договоримся'];

interface Props {
  cityName: string;
  setCityName: (v: string) => void;
  district: string;
  setDistrict: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  when: string;
  setWhen: (v: string) => void;
  errors: Record<string, string>;
}

const StepWhenWhere = ({
  cityName,
  setCityName,
  district,
  setDistrict,
  address,
  setAddress,
  when,
  setWhen,
  errors,
}: Props) => {
  const districts = CITY_DISTRICTS[cityName] || [];

  const err = (k: string) =>
    errors[k] ? <p className="mt-1.5 text-sm text-destructive">{errors[k]}</p> : null;

  return (
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
  );
};

export default StepWhenWhere;
