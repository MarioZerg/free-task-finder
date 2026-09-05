import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@/components/ui/icon';
import { PROFESSIONS, professionsByGroup } from '@/data/professionsCatalog';

/** Выбор специальности для заказа. Профессий много, поэтому список
 *  открывается по кнопке: направления + поиск, а не 48 пунктов подряд. */
const ProfessionSelect = ({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange: (slug: string) => void;
  error?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  const chosen = PROFESSIONS.find((p) => p.slug === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return professionsByGroup();
    return professionsByGroup()
      .map((g) => ({
        group: g.group,
        items: g.items.filter(
          (p) =>
            p.label.toLowerCase().includes(q) ||
            p.short.toLowerCase().includes(q) ||
            // Синонимы: человек ищет «клининг», а в каталоге «Уборка»
            (p.synonyms || []).some((sy) => sy.toLowerCase().includes(q)),
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [query]);

  const pick = (slug: string) => {
    onChange(slug);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border bg-tile px-4 py-3 text-left transition-colors ${
          error ? 'border-destructive' : 'border-line hover:border-primary/60'
        }`}
      >
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
            chosen ? 'bg-primary text-primary-foreground' : 'bg-surface text-chip'
          }`}
        >
          <Icon name={chosen?.icon || 'Search'} size={17} fallback="Wrench" />
        </span>
        <span className="min-w-0 flex-1">
          {chosen ? (
            <>
              <span className="block truncate text-sm font-medium">{chosen.label}</span>
              <span className="block truncate text-xs text-chip">{chosen.short}</span>
            </>
          ) : (
            <span className="block text-sm text-chip">Выберите специальность</span>
          )}
        </span>
        <Icon
          name="ChevronDown"
          size={17}
          className={`shrink-0 text-chip transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 z-50 mt-2 max-h-[min(420px,60vh)] overflow-y-auto rounded-2xl border border-line bg-surface p-2 shadow-lg">
          <div className="sticky top-0 z-10 bg-surface pb-2">
            <div className="relative">
              <Icon
                name="Search"
                size={15}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-chip"
              />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Например, электрик"
                className="min-h-[44px] w-full rounded-xl border border-line bg-tile pl-10 pr-3 text-base outline-none focus:border-primary/60"
              />
            </div>
          </div>

          {groups.map((g) => (
            <div key={g.group} className="mt-1">
              <p className="px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-chip">
                {g.group}
              </p>
              {g.items.map((p) => (
                <button
                  key={p.slug}
                  type="button"
                  onClick={() => pick(p.slug)}
                  className={`flex min-h-[48px] w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors ${
                    p.slug === value ? 'bg-primary/10' : 'hover:bg-tile'
                  }`}
                >
                  <Icon
                    name={p.icon}
                    size={16}
                    fallback="Wrench"
                    className="shrink-0 text-primary"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{p.label}</span>
                    <span className="block truncate text-xs text-chip">{p.short}</span>
                  </span>
                  {p.slug === value && (
                    <Icon name="Check" size={16} className="shrink-0 text-primary" />
                  )}
                </button>
              ))}
            </div>
          ))}

          {groups.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-chip">
              Ничего не нашлось. Выберите «Разнорабочий» — подойдёт для любой задачи.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfessionSelect;