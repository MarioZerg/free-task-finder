import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import type { CityPage } from '@/data/cityPages';
import type { DistrictPage } from '@/data/districtPages';
import { PROFESSIONS } from '@/data/professionsCatalog';

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
  const top = district.topProfessions
    .map((slug) => PROFESSIONS.find((p) => p.slug === slug))
    .filter((p): p is (typeof PROFESSIONS)[number] => !!p);

  return (
    <>
      <section className="mt-16 max-w-[820px]">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">Район</p>
        <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
          Какие заказы чаще всего в {district.name}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          {district.demand}
        </p>

        <h3 className="mt-8 font-head text-lg font-medium">Застройка и жилой фонд</h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {district.housing}
        </p>

        <h3 className="mt-8 font-head text-lg font-medium">
          Микрорайоны и местные названия
        </h3>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Жители обычно называют не район, а свою часть города. В объявлении пишите привычное
          название — так исполнитель быстрее поймёт, куда ехать:
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
          Как добраться и что учесть
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
          Специальности, которые здесь заказывают чаще остальных — с ориентиром по цене
          типовой работы:
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
          Цены указаны за работу и служат ориентиром: точную сумму заказчик и исполнитель
          согласуют между собой. Комиссию сервис не удерживает.
        </p>
      </section>

    </>
  );
};

export default DistrictContent;
