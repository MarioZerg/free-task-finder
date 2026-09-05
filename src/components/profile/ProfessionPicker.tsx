import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { PROFESSIONS } from '@/data/professionsCatalog';
import type { Profession } from '@/lib/api';

/** Выбор специальностей: группы, поиск и жёсткий лимит.
 *  Порядок групп берём из каталога, чтобы список не был свалкой из 48 пунктов. */
const ProfessionPicker = ({
  professions,
  selected,
  onToggle,
  max,
}: {
  professions: Profession[];
  selected: number[];
  onToggle: (id: number) => void;
  max: number;
}) => {
  const [query, setQuery] = useState('');
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const groupOf = useMemo(() => {
    const m = new Map<string, string>();
    PROFESSIONS.forEach((p) => m.set(p.slug, p.group));
    return m;
  }, []);

  const shortOf = useMemo(() => {
    const m = new Map<string, string>();
    PROFESSIONS.forEach((p) => m.set(p.slug, p.short));
    return m;
  }, []);

  // Синонимы профессий: поиск по слову «клининг» должен находить «Уборку»
  const synOf = useMemo(() => {
    const m = new Map<string, string>();
    PROFESSIONS.forEach((p) => m.set(p.slug, (p.synonyms || []).join(' ').toLowerCase()));
    return m;
  }, []);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? professions.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            (shortOf.get(p.slug) || '').toLowerCase().includes(q) ||
            (synOf.get(p.slug) || '').includes(q),
        )
      : professions;

    const order: string[] = [];
    PROFESSIONS.forEach((p) => {
      if (!order.includes(p.group)) order.push(p.group);
    });

    return order
      .map((group) => ({
        group,
        items: list.filter((p) => groupOf.get(p.slug) === group),
      }))
      .filter((g) => g.items.length > 0);
  }, [professions, query, groupOf, shortOf]);

  const chosen = professions.filter((p) => selected.includes(p.id));
  const full = selected.length >= max;
  const searching = query.trim().length > 0;

  return (
    <div>
      {chosen.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {chosen.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onToggle(p.id)}
              className="flex min-h-[40px] items-center gap-2 rounded-full border border-primary bg-primary px-3.5 py-2 text-sm text-primary-foreground"
            >
              <Icon name={p.icon} size={14} fallback="Wrench" />
              {p.label}
              <Icon name="X" size={14} className="opacity-70" />
            </button>
          ))}
        </div>
      )}

      <div className="relative mt-3">
        <Icon
          name="Search"
          size={16}
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chip"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Найти специальность"
          className="min-h-[46px] w-full rounded-2xl border border-line bg-tile pl-11 pr-4 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60"
        />
      </div>

      {full && (
        <p className="mt-3 flex items-start gap-2 rounded-2xl border border-line bg-tile px-4 py-3 text-xs text-muted-foreground">
          <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-primary" />
          Выбрано максимум. Снимите одну специальность, чтобы добавить другую.
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {groups.map((g) => {
          const openNow = searching || openGroup === g.group;
          const picked = g.items.filter((p) => selected.includes(p.id)).length;
          return (
            <div key={g.group} className="overflow-hidden rounded-2xl border border-line">
              <button
                type="button"
                onClick={() => setOpenGroup(openNow && !searching ? null : g.group)}
                className="flex min-h-[48px] w-full items-center gap-2.5 bg-tile px-4 py-3 text-left text-sm transition-colors hover:bg-line/40"
              >
                <span className="min-w-0 flex-1 truncate font-medium">{g.group}</span>
                {picked > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold leading-none text-primary-foreground">
                    {picked}
                  </span>
                )}
                <span className="shrink-0 text-xs text-chip">{g.items.length}</span>
                <Icon
                  name="ChevronDown"
                  size={16}
                  className={`shrink-0 text-chip transition-transform ${openNow ? 'rotate-180' : ''}`}
                />
              </button>

              {openNow && (
                <div className="flex flex-col gap-1 bg-surface p-2">
                  {g.items.map((p) => {
                    const on = selected.includes(p.id);
                    const blocked = !on && full;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        disabled={blocked}
                        onClick={() => onToggle(p.id)}
                        className={`flex min-h-[52px] w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                          on
                            ? 'bg-primary/10'
                            : blocked
                              ? 'opacity-40'
                              : 'hover:bg-tile'
                        }`}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            on ? 'bg-primary text-primary-foreground' : 'bg-tile text-primary'
                          }`}
                        >
                          <Icon name={p.icon} size={16} fallback="Wrench" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate text-sm ${on ? 'font-medium text-primary' : ''}`}
                          >
                            {p.label}
                          </span>
                          {shortOf.get(p.slug) && (
                            <span className="mt-0.5 block truncate text-xs text-chip">
                              {shortOf.get(p.slug)}
                            </span>
                          )}
                        </span>
                        {on && <Icon name="Check" size={17} className="shrink-0 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {groups.length === 0 && (
        <p className="mt-4 rounded-2xl border border-line bg-tile px-4 py-5 text-center text-sm text-chip">
          Ничего не нашлось. Попробуйте другое слово.
        </p>
      )}
    </div>
  );
};

export default ProfessionPicker;
