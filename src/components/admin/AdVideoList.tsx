import { useMemo } from 'react';
import Icon from '@/components/ui/icon';
import { toast } from '@/hooks/use-toast';
import { PROFESSIONS } from '@/data/professionsCatalog';
import {
  PROFESSION_CREATIVE,
  DEFAULT_CREATIVE,
  VIDEO_FORMATS,
} from '@/data/adKeywords';

/** Человеческие названия тем: в файлах они латиницей, а выбирать ролик
 *  удобнее по смыслу — «Сантехника», а не «plumb». */
const THEME_LABEL: Record<string, string> = {
  plumb: 'Сантехника',
  electric: 'Электрика и техника',
  tile: 'Ремонт и отделка',
  clean: 'Уборка',
  furniture: 'Мебель и мелкий ремонт',
  move: 'Переезды и доставка',
  waste: 'Вывоз мусора',
  dacha: 'Сад и участок',
  aircon: 'Кондиционеры',
  worker: 'Разнорабочие',
};

/** Что показывает пропорция и куда попадёт ролик */
const FORMAT_HINT: Record<string, string> = {
  '16x9': 'Десктоп, широкие блоки',
  '1x1': 'Ленты и квадратные блоки',
  '9x16': 'Мобильные, вертикальные блоки',
};

/** Список видеокреативов для ручной загрузки в Директ.
 *
 *  Ролики нельзя передать через файл импорта: колонки видео ждут ID из
 *  библиотеки Директа, а не адрес файла. Поэтому их загружают руками
 *  в кабинете — а здесь собраны все ссылки, чтобы не искать по папке. */
const AdVideoList = ({ siteUrl }: { siteUrl?: string }) => {
  const base = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');

  /** Какие профессии закрывает каждая тема — чтобы понимать, что грузить */
  const themes = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const p of PROFESSIONS) {
      const t = PROFESSION_CREATIVE[p.slug] || DEFAULT_CREATIVE;
      map.set(t, [...(map.get(t) || []), p.label]);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, []);

  const copyAll = async () => {
    const all = themes
      .flatMap(([theme]) => VIDEO_FORMATS.map((f) => `${base}/ads/${theme}-${f}.mp4`))
      .join('\n');
    await navigator.clipboard.writeText(all);
    toast({ title: `Скопировано ссылок: ${themes.length * VIDEO_FORMATS.length}` });
  };

  return (
    <div className="rounded-3xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold">Видеоролики для объявлений</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {themes.length} тем по {VIDEO_FORMATS.length} пропорции — всего{' '}
            {themes.length * VIDEO_FORMATS.length} роликов по 8 секунд
          </p>
        </div>
        <button
          type="button"
          onClick={copyAll}
          className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"
        >
          <Icon name="Copy" size={15} />
          Скопировать все ссылки
        </button>
      </div>

      <p className="mt-4 flex items-start gap-2.5 rounded-2xl border border-primary/40 bg-primary/5 p-4 text-sm text-muted-foreground">
        <Icon name="Info" size={16} className="mt-0.5 shrink-0 text-primary" />
        <span>
          Через файл импорта видео не передаются — Директ ждёт ID ролика из
          своей библиотеки. Загрузите их в кабинете: объявление → блок
          «Видео». Достаточно сделать это для главных направлений.
        </span>
      </p>

      <div className="mt-5 space-y-3">
        {themes.map(([theme, profs]) => (
          <div key={theme} className="rounded-2xl border border-line bg-tile p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{THEME_LABEL[theme] || theme}</span>
              <span className="text-xs text-muted-foreground">
                {profs.length}{' '}
                {profs.length === 1 ? 'специальность' : 'специальностей'}:{' '}
                {profs.slice(0, 3).join(', ')}
                {profs.length > 3 ? ' и другие' : ''}
              </span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {VIDEO_FORMATS.map((f) => (
                <a
                  key={f}
                  href={`${base}/ads/${theme}-${f}.mp4`}
                  download
                  className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-sm transition hover:border-primary hover:text-primary"
                >
                  <Icon name="Download" size={14} className="shrink-0" />
                  <span className="font-medium">{f}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {FORMAT_HINT[f]}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdVideoList;
