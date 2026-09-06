import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { PROFESSIONS, PROFESSION_GROUPS } from '@/data/professionsCatalog';
import { CITY_PAGES } from '@/data/cityPages';
import { NEGATIVE_GROUPS } from '@/data/adKeywords';
import {
  buildRows,
  downloadCsv,
  negativesLine,
  landingUrl,
} from '@/lib/directExport';

/** Шесть направлений, с которых стоит начинать: самые денежные и
 *  с понятным разовым заказом. Запускать сразу все 48 — верный способ
 *  размазать бюджет и не набрать статистику ни по одному. */
const STARTER = ['plumber', 'electrician', 'aircon', 'furniture', 'handyman', 'wasteremoval'];

const AdminAds = () => {
  const [profs, setProfs] = useState<string[]>(STARTER);
  const [cities, setCities] = useState<string[]>(['yaroslavl']);
  const [utm, setUtm] = useState(true);
  const [showNeg, setShowNeg] = useState(false);

  const rows = useMemo(
    () => buildRows({ professions: profs, cities, budget: 500, siteUrl: '', utm }),
    [profs, cities, utm],
  );

  const groups = useMemo(() => new Set(rows.map((r) => r.group)).size, [rows]);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const download = () => {
    if (!rows.length) {
      toast({ title: 'Выберите хотя бы одну профессию и город' });
      return;
    }
    const name = `direct-${cities.join('-')}-${profs.length}prof.csv`;
    downloadCsv(rows, name);
    toast({ title: `Файл готов: ${rows.length} строк` });
  };

  const copyNegatives = async () => {
    await navigator.clipboard.writeText(negativesLine());
    toast({ title: 'Минус-слова скопированы' });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-surface p-5">
        <h3 className="font-head text-lg font-medium tracking-tight">Города</h3>
        <p className="mt-1 text-sm text-chip">
          Для каждого города создаётся отдельная кампания
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CITY_PAGES.map((c) => (
            <button
              key={c.slug}
              onClick={() => toggle(cities, setCities, c.slug)}
              className={`min-h-[44px] rounded-full border px-5 py-2.5 text-sm transition-colors ${
                cities.includes(c.slug)
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-line text-muted-foreground hover:border-primary/50'
              }`}
            >
              {c.nameNominative}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-head text-lg font-medium tracking-tight">Профессии</h3>
            <p className="mt-1 text-sm text-chip">
              Каждая станет отдельной группой со своей страницей
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setProfs(STARTER)}
              className="min-h-[44px] rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/60"
            >
              Стартовый набор
            </button>
            <button
              onClick={() => setProfs(PROFESSIONS.map((p) => p.slug))}
              className="min-h-[44px] rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/60"
            >
              Все
            </button>
            <button
              onClick={() => setProfs([])}
              className="min-h-[44px] rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/60"
            >
              Снять
            </button>
          </div>
        </div>

        <div className="mt-5 space-y-5">
          {PROFESSION_GROUPS.map((g) => {
            const list = PROFESSIONS.filter((p) => p.group === g);
            if (!list.length) return null;
            return (
              <div key={g}>
                <p className="text-xs font-medium uppercase tracking-wide text-chip">{g}</p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {list.map((p) => (
                    <button
                      key={p.slug}
                      onClick={() => toggle(profs, setProfs, p.slug)}
                      className={`min-h-[40px] rounded-full border px-4 py-2 text-sm transition-colors ${
                        profs.includes(p.slug)
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-line text-muted-foreground hover:border-primary/50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={utm}
            onChange={(e) => setUtm(e.target.checked)}
            className="h-5 w-5 accent-[hsl(var(--primary))]"
          />
          <span className="text-sm">
            Добавлять метки к ссылкам
            <span className="block text-xs text-chip">
              Чтобы в статистике видеть, какая кампания привела человека
            </span>
          </span>
        </label>
      </div>

      <div className="rounded-3xl border border-primary/30 bg-tile p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="font-head text-xl font-medium tracking-tight">
              {rows.length} объявлений · {groups} групп · {cities.length} кампаний
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {profs.length} профессий в {cities.length} городах
            </p>
          </div>
          <button
            onClick={download}
            className="flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.03]"
          >
            <Icon name="Download" size={18} />
            Скачать файл
          </button>
        </div>

        {rows.length > 0 && (
          <div className="mt-5 rounded-2xl border border-line bg-surface p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-chip">
              Пример объявления
            </p>
            <p className="mt-2 font-medium text-primary">
              {rows[0].title} — {rows[0].title2}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">{rows[0].text}</p>
            <p className="mt-1.5 break-all text-xs text-chip">{rows[0].url}</p>
            <p className="mt-2 text-xs text-chip">Фраза: {rows[0].phrase}</p>
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-head text-lg font-medium tracking-tight">Минус-слова</h3>
            <p className="mt-1 text-sm text-chip">
              Вставьте их на уровне кампании — это главная защита от пустых кликов
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowNeg((v) => !v)}
              className="min-h-[44px] rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/60"
            >
              {showNeg ? 'Скрыть' : 'Показать'}
            </button>
            <button
              onClick={copyNegatives}
              className="flex min-h-[44px] items-center gap-2 rounded-full border border-line px-4 py-2 text-sm transition-colors hover:border-primary/60"
            >
              <Icon name="Copy" size={16} />
              Копировать
            </button>
          </div>
        </div>

        {showNeg && (
          <div className="mt-4 space-y-3">
            {NEGATIVE_GROUPS.map((g) => (
              <div key={g.title} className="rounded-2xl border border-line bg-tile p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-chip">
                  {g.title} · {g.words.length}
                </p>
                <p className="mt-1.5 text-sm text-muted-foreground">{g.words.join(', ')}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-line bg-surface p-5">
        <h3 className="font-head text-lg font-medium tracking-tight">Как загрузить</h3>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li>1. Скачайте файл кнопкой выше.</li>
          <li>2. Откройте Директ Коммандер, войдите под своим логином.</li>
          <li>
            3. Кампании → Импорт → Из файла. Выберите скачанный файл.
          </li>
          <li>4. Проверьте кампании и отправьте их на сервер кнопкой отправки.</li>
          <li>
            5. В каждой кампании вставьте минус-слова из блока выше и задайте
            дневной бюджет.
          </li>
        </ol>
        <p className="mt-4 rounded-2xl border border-line bg-tile p-4 text-sm text-muted-foreground">
          Каждое объявление ведёт на свою страницу услуги, например{' '}
          <span className="break-all text-primary">
            {landingUrl('plumber', 'yaroslavl', false)}
          </span>
          . Совпадение запроса, объявления и страницы — то, что вытягивает отклик.
        </p>
      </div>
    </div>
  );
};

export default AdminAds;
