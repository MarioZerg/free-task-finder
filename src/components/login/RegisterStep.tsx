import { Link } from 'react-router-dom';
import { Role } from '@/hooks/use-app-state';
import { CITIES } from '@/data/mock';
import { formatPhone, isPhoneValid } from '@/lib/phone';

const field =
  'w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60';

interface Props {
  name: string;
  setName: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  skill: string;
  setSkill: (v: string) => void;
  about: string;
  setAbout: (v: string) => void;
  terms: boolean;
  setTerms: (v: boolean) => void;
  loginRole: Role;
}

const RegisterStep = ({
  name,
  setName,
  city,
  setCity,
  phone,
  setPhone,
  skill,
  setSkill,
  about,
  setAbout,
  terms,
  setTerms,
  loginRole,
}: Props) => (
  <div className="space-y-3">
    <input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Как вас зовут"
      className={field}
    />
    <input
      value={city}
      onChange={(e) => setCity(e.target.value)}
      placeholder="Город или район области"
      list="cities-list"
      className={field}
    />
    <datalist id="cities-list">
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
    {loginRole === 'executor' && (
      <>
        <input
          value={skill}
          onChange={(e) => setSkill(e.target.value)}
          placeholder="Чем занимаетесь: грузчик, сборка мебели…"
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

    <label className="flex cursor-pointer gap-3 rounded-2xl border border-line bg-tile p-4 text-sm text-muted-foreground">
      <input
        type="checkbox"
        checked={terms}
        onChange={(e) => setTerms(e.target.checked)}
        className="mt-0.5 h-5 w-5 shrink-0 accent-[hsl(var(--primary))]"
      />
      <span>
        Я принимаю{' '}
        <Link to="/terms" className="underline underline-offset-2 hover:text-foreground">
          условия оферты
        </Link>{' '}
        и{' '}
        <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">
          политику конфиденциальности
        </Link>
      </span>
    </label>
  </div>
);

export default RegisterStep;
