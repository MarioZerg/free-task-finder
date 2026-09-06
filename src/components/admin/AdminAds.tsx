import { useMemo, useState } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import AdVideoList from '@/components/admin/AdVideoList';
import { PROFESSIONS, PROFESSION_GROUPS } from '@/data/professionsCatalog';
import { CITY_PAGES } from '@/data/cityPages';
import { NEGATIVE_GROUPS, WORKER_NEGATIVE_GROUPS } from '@/data/adKeywords';
import {
  buildRows,
  buildWorkerRows,
  downloadCsv,
  DEFAULT_BID,
  negativesLine,
  landingUrl,
} from '@/lib/directExport';

/** Шесть направлений, с которых стоит начинать: самые денежные и
 *  с понятным разовым заказом. Запускать сразу все 48 — верный способ
 *  размазать бюджет и не набрать статистику ни по одному. */
const STARTER = ['plumber', 'electrician', 'aircon', 'furniture', 'handyman', 'wasteremoval'];

const AdminAds = () => {
  const [audience, setAudience] = useState<'customer' | 'worker'>('customer');
  const [profs, setProfs] = useState<string[]>(STARTER);
  const [cities, setCities] = useState<string[]>(['yaroslavl']);
  const [utm, setUtm] = useState(true);
  const [bid, setBid] = useState(DEFAULT_BID);
  const [bidNet, setBidNet] = useState(DEFAULT_BID);
  const [showNeg, setShowNeg] = useState(false);

  const rows = useMemo(() => {
    const opts = { professions: profs, cities, budget: 500, siteUrl: '', utm };
    return audience === 'worker' ? buildWorkerRows(opts) : buildRows(opts);
  }, [profs, cities, utm, audience]);

  const negativeGroups = audience === 'worker' ? WORKER_NEGATIVE_GROUPS : NEGATIVE_GROUPS;

  const groups = useMemo(() => new Set(rows.map((r) => r.group)).size, [rows]);

  const toggle = (list: string[], set: (v: string[]) => void, id: string) =>
    set(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const download = () => {
    if (!rows.length) {
      toast({ title: 'Выберите хотя бы одну профессию и город' });
      return;
    }
    const who = audience === 'worker' ? 'ispolniteli' : 'zakazchiki';
    const name = `direct-${who}-${cities.join('-')}.txt`;
    downloadCsv(rows, name, { bid, bidNet, audience });
    toast({ title: `Файл готов: ${rows.length} строк` });
  };

  const copyNegatives = async () => {
    await navigator.clipboard.writeText(negativesLine(audience));
    toast({ title: 'Минус-слова скопированы' });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-line bg-surface p-5">
        <h3 className="font-head text-lg font-medium tracking-tight">Кому показываем</h3>
        <p className="mt-1 text-sm text-chip">
          Две аудитории нельзя смешивать в одной кампании — у них
          противоположные запросы и свои минус-слова
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            {
              id: 'customer' as const,
              title: 'Заказчикам',
              hint: 'Ищут мастера: «вызвать сантехника»',
            },
            {
              id: 'worker' as const,
              title: 'Исполнителям',
              hint: 'Ищут подработку: «работа сантехником»',
            },
          ].map((a) => (
            <button
              key={a.id}
              onClick={() => setAudience(a.id)}
              className={`rounded-2xl border p-4 text-left transition-colors ${
                audience === a.id
                  ? 'border-primary bg-primary/5'
                  : 'border-line hover:border-primary/50'
              }`}
            >
              <p className="font-medium">{a.title}</p>
              <p className="mt-0.5 text-xs text-chip">{a.hint}</p>
            </button>
          ))}
        </div>
      </div>

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
        <h3 className="font-head text-lg font-medium tracking-tight">Ставки</h3>
        <p className="mt-1 text-sm text-chip">
          Сколько готовы платить за переход. Начните со скромной — поднять
          в кабинете проще, чем внезапно потратить бюджет
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm text-muted-foreground">На поиске, ₽</span>
            <input
              type="number"
              min={1}
              max={5000}
              value={bid}
              onChange={(e) => setBid(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-tile px-4 text-base outline-none transition-colors focus:border-primary"
            />
          </label>
          <label className="block">
            <span className="text-sm text-muted-foreground">В сетях (РСЯ), ₽</span>
            <input
              type="number"
              min={1}
              max={5000}
              value={bidNet}
              onChange={(e) => setBidNet(Math.max(1, Number(e.target.value) || 1))}
              className="mt-1.5 h-12 w-full rounded-2xl border border-line bg-tile px-4 text-base outline-none transition-colors focus:border-primary"
            />
          </label>
        </div>
        <p className="mt-3 flex items-start gap-2.5 rounded-2xl border border-line bg-tile px-4 py-3 text-sm text-muted-foreground">
          <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>
            Дневной бюджет задаётся в самой кампании — в файл импорта он не
            передаётся, такого поля в формате Директа нет. При ставке {bid} ₽
            бюджет 500 ₽ в день — это примерно {Math.floor(500 / Math.max(1, bid))}{' '}
            переходов. Если включите автоматическую стратегию, ставки из файла
            Директ проигнорирует и будет управлять ценой сам.
          </span>
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {[15, 30, 50, 100].map((v) => (
            <button
              key={v}
              onClick={() => {
                setBid(v);
                setBidNet(v);
              }}
              className={`min-h-[40px] rounded-full border px-4 py-2 text-sm transition-colors ${
                bid === v && bidNet === v
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-line text-muted-foreground hover:border-primary/50'
              }`}
            >
              {v} ₽
            </button>
          ))}
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
              {profs.length} профессий в {cities.length} городах · ставка {bid} ₽
              {bidNet !== bid && ` / ${bidNet} ₽ в сетях`}
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
              Уже включены в файл — это главная защита от пустых кликов
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
            {negativeGroups.map((g) => (
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
            3. Создайте пустую кампанию типа «Единая перфоманс-кампания» и
            выберите её в списке — файл добавит в неё группы и объявления.
          </li>
          <li>
            4. Вкладка «Объявления» → кнопка «Импорт» → «Импортировать из
            файла». Выберите скачанный файл.
          </li>
          <li>5. Проверьте результат и отправьте кампанию на сервер.</li>
          <li>
            6. В настройках кампании задайте дневной бюджет и стратегию — через
            файл они не передаются.
          </li>
        </ol>
        <p className="mt-4 rounded-2xl border border-line bg-tile p-4 text-sm text-muted-foreground">
          Регионы показа, ставки и минус-слова уже проставлены в файле —
          вручную заполнять не нужно.
        </p>
        <p className="mt-3 flex items-start gap-2.5 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
          <Icon name="Image" size={16} className="mt-0.5 shrink-0 text-primary" />
          <span>
            К объявлениям приложены тематические картинки для РСЯ — по четыре
            пропорции на каждую специальность. Директ забирает их по ссылке
            с сайта, поэтому загружайте файл после публикации проекта: иначе
            картинки ещё не будут доступны и объявления уйдут без них.
            Видеоролики к ним — в списке ниже, их загружают отдельно.
          </span>
        </p>
        <p className="mt-3 rounded-2xl border border-line bg-tile p-4 text-sm text-muted-foreground">
          Объявления создаются комбинаторными: Директ с июля не заводит
          текстово-графические и сам собирает связку из заголовков и текстов,
          показывая ту, что откликается лучше.
        </p>
        <p className="mt-3 rounded-2xl border border-line bg-tile p-4 text-sm text-muted-foreground">
          Регион показа у каждой группы свой — тот город, под который она
          собрана. Бюджет, стратегию и организацию в Яндекс Бизнесе задайте
          в настройках кампании: через файл они не передаются.
        </p>
        <p className="mt-4 rounded-2xl border border-line bg-tile p-4 text-sm text-muted-foreground">
          {audience === 'worker'
            ? 'Объявления ведут на страницу города и на страницы специальностей, например '
            : 'Каждое объявление ведёт на свою страницу услуги, например '}
          <span className="break-all text-primary">
            {landingUrl('plumber', 'yaroslavl', false)}
          </span>
          . Совпадение запроса, объявления и страницы — то, что вытягивает отклик.
        </p>
      </div>

      <AdVideoList />
    </div>
  );
};

export default AdminAds;