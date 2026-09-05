import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import type { CityPage } from '@/data/cityPages';
import type { DistrictPage } from '@/data/districtPages';
import { PROFESSIONS } from '@/data/professionsCatalog';
import { pick } from '@/data/faqVariants';

/** Развёрнутый текст страницы района. В отличие от городов, здесь почти
 *  нет общих формулировок: каждый блок построен на собственных данных
 *  района — микрорайоны, тип застройки, ориентиры, специфика спроса
 *  и логистики. Поэтому шесть страниц не пересекаются между собой. */

const DistrictContent = ({
  district,
  city,
}: {
  district: DistrictPage;
  city: CityPage;
}) => {
  // Сдвиг по слагу района: соседние районы одного города получают разные
  // связки и подзаголовки, иначе страницы читаются как копии.
  const seed = district.slug.split('').reduce((a, c) => a + c.charCodeAt(0), 0);

  const top = district.topProfessions
    .map((slug) => PROFESSIONS.find((p) => p.slug === slug))
    .filter((p): p is (typeof PROFESSIONS)[number] => !!p);

  return (
    <>
      <section className="mt-16 max-w-[820px]">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">Район</p>
        <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
          {pick(
            [
              `Какие заказы чаще всего в ${district.name}`,
              `Что заказывают в ${district.name}: частые задачи`,
              `Спрос на мастеров в ${district.name}`,
            ],
            seed,
          )}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          {district.demand}
        </p>

        <h3 className="mt-8 font-head text-lg font-medium">
          {pick(['Застройка и жилой фонд', 'Каким жильём застроен район', 'Дома и инфраструктура'], seed, 1)}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {district.housing}
        </p>

        <h3 className="mt-8 font-head text-lg font-medium">
          {pick(['Микрорайоны и местные названия', 'Как здесь называют места', 'Части района на слуху у жителей'], seed, 2)}
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {pick(
            [
              'Жители обычно называют не район, а свою часть города. В объявлении пишите привычное название — так исполнитель быстрее поймёт, куда ехать:',
              'В обиходе официальное имя района звучит редко — люди ориентируются по местным названиям. Используйте их в заявке, мастеру будет понятнее:',
              'Указывайте в объявлении то название, которым пользуются соседи: исполнитель определит маршрут с первого взгляда, не уточняя адрес отдельно:',
            ],
            seed,
            2,
          )}
        </p>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {district.areas.map((a) => (
            <span
              key={a}
              className="flex items-center gap-2 rounded-full border border-line bg-tile px-4 py-2.5 text-sm text-muted-foreground"
            >
              <Icon name="MapPin" size={14} />
              {a}
            </span>
          ))}
        </div>
        <p className="mt-4 text-sm leading-relaxed text-chip">
          Ориентиры района: {district.landmarks.join(', ')}.
        </p>
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          {pick(['Как добраться и что учесть', 'Дорога и транспортная доступность', 'Что учесть исполнителю при выезде'], seed, 3)}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          {district.logistics}
        </p>
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          Востребованные мастера в {district.name}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {pick(
            [
              'Специальности, которые здесь заказывают чаще остальных — с ориентиром по цене типовой работы:',
              'Ниже — направления с самым устойчивым спросом в районе и примерная стоимость стандартной задачи:',
              'Эти мастера получают больше всего заявок именно отсюда. Рядом — ориентировочная цена типовой работы:',
            ],
            seed,
            4,
          )}
        </p>
        <div className="mt-6 overflow-hidden rounded-3xl border border-line">
          <table className="w-full text-left text-sm">
            <tbody>
              {top.map((p, i) => (
                <tr key={p.slug} className={i % 2 ? 'bg-tile' : 'bg-surface'}>
                  <td className="px-5 py-4">
                    <Link
                      to={`/podrabotka/${city.slug}/${p.slug}`}
                      className="font-medium text-foreground transition-colors hover:text-primary"
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
          {pick(
            [
              'Цены указаны за работу и служат ориентиром: точную сумму заказчик и исполнитель согласуют между собой. Комиссию сервис не удерживает.',
              'Суммы приведены без учёта материалов и носят справочный характер — окончательную цену стороны обсуждают напрямую, без нашего участия.',
              'Это средние расценки по району: конкретная стоимость зависит от объёма и срочности. Процент с оплаты площадка не берёт.',
            ],
            seed,
            5,
          )}
        </p>
      </section>

    </>
  );
};

export default DistrictContent;
