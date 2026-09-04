import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { CITY_PAGES } from '@/data/cityPages';
import { FEATURED_PROFESSIONS } from '@/data/professionCityPages';

/** Текстовый блок главной. Главная борется за самый частотный запрос
 *  области — «подработка Ярославль», — а объёма текста на ней было
 *  вдвое меньше, чем на внутренних страницах. */

const HomeContent = () => (
  <section className="bg-background py-20 md:py-24">
    <div className="mx-auto max-w-[1400px] px-6 md:px-10 lg:px-16">
      <div className="max-w-[820px]">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">О сервисе</p>
        <h2 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-4xl">
          Подработка в Ярославле и области без посредников
        </h2>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Доделай.ру — доска объявлений о разовой работе в Ярославской области. Заказчик
            описывает задачу, исполнители откликаются, дальше стороны договариваются напрямую.
            Сервис не участвует в расчётах и не берёт комиссию: сколько заказчик заплатил —
            столько исполнитель и получил.
          </p>
          <p>
            Формат подходит для задач, ради которых неудобно вызывать фирму: помочь с
            переездом, собрать шкаф, повесить полки, убрать квартиру после ремонта, покосить
            траву на участке, разгрузить машину. Такие работы закрываются за пару часов или за
            день, и искать под них подрядчика через компанию дороже и дольше.
          </p>
          <p>
            Для исполнителей это способ подработать со свободным графиком: смену можно взять на
            один день или набрать несколько заказов подряд. Часть задач не требует опыта и
            инструмента — с них удобно начать и набрать первые отзывы, а с рейтингом открывается
            доступ к более дорогим профильным заказам.
          </p>
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: 'BadgeRussianRuble',
            t: 'Без комиссии',
            d: 'Расчёт напрямую между заказчиком и исполнителем. Сервис не удерживает процент с оплаты.',
          },
          {
            icon: 'Zap',
            t: 'Отклики в день заявки',
            d: 'Задачу видят исполнители нужной специальности в вашем городе — первые ответы приходят быстро.',
          },
          {
            icon: 'Star',
            t: 'Рейтинг и отзывы',
            d: 'Оценки появляются только после завершённых заданий, поэтому показывают реальную картину.',
          },
          {
            icon: 'MapPin',
            t: 'Мастера рядом',
            d: 'Поиск по городам и районам области — исполнитель не закладывает в цену дорогу через весь город.',
          },
        ].map((x) => (
          <div key={x.t} className="rounded-3xl border border-line bg-surface p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Icon name={x.icon} size={20} fallback="Check" />
            </span>
            <h3 className="mt-4 font-head text-base font-medium text-foreground">{x.t}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          Кого чаще всего ищут
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          В каталоге 48 специальностей — от мужа на час и грузчиков до сварщиков, кровельщиков и
          садовых работ. Вот направления с самым большим спросом:
        </p>
        <div className="mt-5 flex flex-wrap gap-2.5">
          {FEATURED_PROFESSIONS.map((p) => (
            <Link
              key={p.slug}
              to={`/podrabotka/yaroslavl/${p.slug}`}
              className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
            >
              <Icon name={p.icon} size={14} fallback="Wrench" />
              {p.label}
            </Link>
          ))}
        </div>

        <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
          Страницы со стоимостью работ и анкетами мастеров есть для каждого города области:{' '}
          {CITY_PAGES.map((c, i) => (
            <span key={c.slug}>
              {i > 0 && ', '}
              <Link
                to={`/podrabotka/${c.slug}`}
                className="text-foreground underline decoration-line underline-offset-4 transition-colors hover:decoration-primary"
              >
                {c.nameNominative}
              </Link>
            </span>
          ))}
          .
        </p>
      </div>
    </div>
  </section>
);

export default HomeContent;
