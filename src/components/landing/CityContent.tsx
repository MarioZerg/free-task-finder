import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import type { CityPage } from '@/data/cityPages';
import { getCityPage } from '@/data/cityPages';
import { PROFESSIONS } from '@/data/professionsCatalog';
import { getDistrictPagesByCity } from '@/data/districtPages';
import { CITY_PAGES } from '@/data/cityPages';

/** Развёрнутый текст страницы города. Формулировки собираются из данных
 *  самого города — население, районы, соседи, реальные цены каталога, —
 *  поэтому страницы шести городов не выглядят копиями друг друга. */

/** Профессии, по которым считаем «сколько можно заработать» */
const EARN_SLUGS = ['mover', 'cleaner', 'handyman', 'other', 'gardener', 'courier'];

const CityContent = ({ city }: { city: CityPage }) => {
  // Вариант текста выбираем по номеру города: у шести городов гарантированно
  // разные формулировки, без случайных совпадений хеша.
  const idx = CITY_PAGES.findIndex((c) => c.slug === city.slug);
  const v = <T,>(list: T[], offset = 0): T => list[(idx + offset) % list.length];
  const districts = getDistrictPagesByCity(city.slug);
  const nearby = city.nearbyCities
    .map((s) => getCityPage(s))
    .filter((c): c is CityPage => !!c);

  const earn = EARN_SLUGS.map((s) => PROFESSIONS.find((p) => p.slug === s)).filter(
    (p): p is (typeof PROFESSIONS)[number] => !!p,
  );

  const shiftPrice = PROFESSIONS.find((p) => p.slug === 'other')?.tasks.find((t) =>
    t.task.includes('Смена'),
  )?.price;

  return (
    <>
      <section className="mt-16 max-w-[820px]">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">Исполнителям</p>
        <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
          {v(
            [
              `Кому подходит подработка в ${city.name}`,
              `Кто находит здесь работу: подработка в ${city.name}`,
              `Подработка в ${city.name}: для кого она`,
              `Разовые заказы в ${city.name}: кому подойдут`,
            ],
          )}
        </h2>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            {v(
              [
                `Разовые заказы в ${city.name} берут очень разные люди: студенты между парами, вахтовики в межсезонье, мастера с основной работой, которым нужна подработка на выходных. Общее одно — свободный график: вы сами решаете, какие задачи брать и в какие дни выходить.`,
                `Подработка в ${city.name} удобна тем, кто не готов к жёсткому графику: смену можно взять на один день, а можно набрать несколько заказов подряд. Среди исполнителей и студенты, и специалисты с основным местом работы, и те, кто ищет постоянную занятость через разовые задания.`,
                `За разовыми заданиями в ${city.name} приходят и новички без опыта, и мастера с инструментом. Для первых это простые задачи вроде погрузки или уборки, для вторых — профильные заказы по своей специальности. График каждый выстраивает сам.`,
                `Формат разовой занятости в ${city.name} выбирают ради гибкости: заказ можно взять на пару часов, на день или на несколько смен подряд. Никаких обязательств перед работодателем — вы откликаетесь только на то, что вам подходит по времени и цене.`,
                `Чаще всего разовые задания в ${city.name} берут те, кому нужен доход без привязки к смене: подработка после основной работы, занятость на время отпуска или между проектами. Кто-то приходит за разовой суммой, кто-то постепенно набирает постоянных заказчиков.`,
              ],
            )}
          </p>
          <p>
            {v(
              [
                `Опыт нужен не везде. На погрузку, уборку территории или помощь по хозяйству берут без требований к квалификации — достаточно прийти вовремя и аккуратно сделать работу. Для профильных задач вроде электрики или сварки заказчик, наоборот, смотрит на отзывы и примеры.`,
                `Порог входа низкий: часть заказов не требует ни опыта, ни инструмента — разгрузить машину, убрать участок, помочь с переездом. Специальности вроде сантехники или отделки требуют подтверждённых навыков, зато и оплата там заметно выше.`,
                `Начать можно с простого — подсобные работы, доставка, уборка. Такие задания не требуют квалификации, но дают первые отзывы, а с рейтингом открывается доступ к более дорогим профильным заказам в ${city.name}.`,
                `Требования зависят от задачи: разгрузку или уборку территории доверят любому ответственному человеку, а вот за отопление или кровлю возьмётся только тот, кто в этом разбирается. Начните с простого и наберите отзывы — дальше выбор заказов станет шире.`,
              ],
              1,
            )}
          </p>
        </div>
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          Сколько можно заработать в {city.name}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Заработок зависит от специальности и того, сколько заказов вы берёте.
          {shiftPrice ? ` Смена разнорабочего — ${shiftPrice.replace('от ', 'от ')}.` : ''} Вот
          ориентир по самым частым направлениям — суммы взяты со страниц специальностей:
        </p>
        <div className="mt-6 overflow-hidden rounded-3xl border border-line">
          <table className="w-full text-left text-sm">
            <tbody>
              {earn.map((p, i) => (
                <tr key={p.slug} className={i % 2 ? 'bg-tile' : 'bg-surface'}>
                  <td className="px-5 py-4">
                    <Link
                      to={`/podrabotka/${city.slug}/${p.slug}`}
                      className="text-muted-foreground transition-colors hover:text-primary"
                    >
                      {p.label}
                    </Link>
                    <span className="mt-0.5 block text-xs text-chip">{p.tasks[0]?.task}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-head font-medium">
                    {p.tasks[0]?.price}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Сервис не удерживает комиссию: сколько заказчик заплатил — столько исполнитель и
          получил. Расчёт происходит напрямую, без блокировки денег на счёте сервиса.
        </p>
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          Когда в {city.name} больше всего заказов
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {v(
            [
              `Спрос заметно меняется по сезонам. Весной и летом добавляются дачные задачи — покос, грядки, заборы, вывоз хлама. Осенью растёт число ремонтов и переездов, зимой — уборка снега и работы внутри помещений.`,
              `Загрузка неравномерная в течение года: тёплый сезон — это участки, покос и стройка на дачах, холодный — внутренняя отделка, ремонт техники и расчистка снега. Переезды и уборка идут круглый год.`,
              `Летом основной поток — загородные работы и стройка, зимой — снег, ремонт внутри квартир и бытовые задачи. Межсезонье традиционно даёт всплеск ремонтов: люди приводят жильё в порядок до холодов.`,
              `Сезонность заметна: в тёплые месяцы преобладают участки, покос и стройка, ближе к холодам — утепление, отделка и уборка снега. Опытные исполнители держат в запасе несколько специальностей, чтобы не простаивать в межсезонье.`,
              `Поток заказов идёт волнами: дачный сезон приносит покос и работы на участке, зима — снег и задачи внутри дома, а весна и осень дают пик ремонтов. Бытовые задачи вроде переезда или сборки мебели встречаются в любое время года.`,
            ],
            2,
          )}
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {[
            { icon: 'Sun', t: 'Весна и лето', d: 'Покос, участки, заборы, стройка, вывоз мусора' },
            { icon: 'Leaf', t: 'Осень', d: 'Ремонты, переезды, утепление, уборка листьев' },
            { icon: 'Snowflake', t: 'Зима', d: 'Уборка снега, отделка внутри, ремонт техники' },
            { icon: 'Repeat', t: 'Круглый год', d: 'Переезды, уборка, сборка мебели, курьерские задачи' },
          ].map((s) => (
            <div key={s.t} className="flex gap-3 rounded-2xl border border-line bg-surface p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name={s.icon} size={17} fallback="Calendar" />
              </span>
              <span>
                <span className="block font-head text-base font-medium text-foreground">{s.t}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {s.d}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          Как не нарваться на обман
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Разовая работа — сфера, где встречаются недобросовестные люди с обеих сторон. Несколько
          правил снимают почти все риски:
        </p>
        <ul className="mt-5 space-y-3">
          {[
            {
              icon: 'ShieldCheck',
              t: 'Никаких предоплат за доступ к заказам',
              d: 'Сервис бесплатный. Если кто-то просит «взнос за регистрацию» или оплату за просмотр заявок — это мошенник, сообщите нам.',
            },
            {
              icon: 'MessageSquare',
              t: 'Обсуждайте детали в переписке',
              d: 'Объём, сроки, цена и кто покупает материалы — всё это лучше зафиксировать сообщениями до начала работы.',
            },
            {
              icon: 'Star',
              t: 'Смотрите рейтинг и отзывы',
              d: 'Отзывы появляются только после завершённых заданий, поэтому дают реальную картину, а не рекламу.',
            },
            {
              icon: 'Wallet',
              t: 'Расчёт после приёмки',
              d: 'Заказчику стоит проверить результат до оплаты, исполнителю — не начинать работу без ясной договорённости о сумме.',
            },
          ].map((x) => (
            <li key={x.t} className="flex gap-3.5 rounded-2xl border border-line bg-tile p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name={x.icon} size={17} fallback="Info" />
              </span>
              <span>
                <span className="block font-head text-base font-medium text-foreground">{x.t}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {x.d}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          Подработка рядом с домом
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {city.population ? `При населении ${city.population} ` : ''}
          {districts.length > 0
            ? `в ${city.name} почти всегда находится задача недалеко от дома — по городу ${districts.length} районов, и в объявлениях заказчики обычно указывают свой. Дорога через весь город съедает время и бензин, поэтому фильтровать заказы по району выгоднее, чем брать первый попавшийся.`
            : city.districts.length > 0
              ? `в ${city.name} заказы разбросаны по всему городу: ${city.districts.join(', ')}. Указывайте в объявлении свою часть города — так исполнителю проще прикинуть дорогу.`
              : `${city.nameNominative} компактный, добраться из одного конца в другой несложно — поэтому исполнители здесь редко отказываются от заказа из-за расстояния.`}
        </p>

        {districts.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {districts.map((d) => (
              <Link
                key={d.slug}
                to={`/podrabotka/${city.slug}/rayon/${d.slug}`}
                className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <Icon name="MapPin" size={14} />
                Подработка в {d.name}
              </Link>
            ))}
          </div>
        )}

        {nearby.length > 0 && (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Многие исполнители берут заказы и в соседних городах области:{' '}
            {nearby.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && ', '}
                <Link
                  to={`/podrabotka/${c.slug}`}
                  className="text-foreground underline decoration-line underline-offset-4 transition-colors hover:decoration-primary"
                >
                  подработка в {c.name}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
      </section>
    </>
  );
};

export default CityContent;
