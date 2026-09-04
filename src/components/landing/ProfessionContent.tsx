import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import type { CityPage } from '@/data/cityPages';
import type { ProfessionCityPage } from '@/data/professionCityPages';
import { getDistrictPagesByCity } from '@/data/districtPages';
import { getCityPage } from '@/data/cityPages';
import { pick } from '@/lib/variant';

/** Развёрнутый текстовый блок посадочной «профессия + город».
 *  Формулировки собираются из реальных данных — район, население,
 *  соседние города, конкретные задачи и цены, — поэтому у каждой
 *  из 300 страниц получается свой текст, а не копия соседней. */

const ProfessionContent = ({
  page,
  city,
}: {
  page: ProfessionCityPage;
  city: CityPage;
}) => {
  // Ключ страницы: города и профессии дают разные тексты, но один адрес — всегда один текст
  const key = `${page.citySlug}-${page.professionSlug}`;
  const districts = getDistrictPagesByCity(city.slug);
  const districtNames = districts.length
    ? districts.map((d) => d.nameNominative)
    : city.districts;
  const nearby = city.nearbyCities
    .map((s) => getCityPage(s))
    .filter((c): c is CityPage => !!c);

  const prices = page.tasks.map((t) => Number(t.price.replace(/\D/g, ''))).filter(Boolean);
  const min = prices.length ? Math.min(...prices) : 0;
  const max = prices.length ? Math.max(...prices) : 0;
  const cheapest = page.tasks.find((t) => Number(t.price.replace(/\D/g, '')) === min);
  const priciest = page.tasks.find((t) => Number(t.price.replace(/\D/g, '')) === max);

  return (
    <>
      <section className="mt-16 max-w-[820px]">
        <p className="text-sm uppercase tracking-[0.2em] text-chip">Как выбрать</p>
        <h2 className="mt-3 font-head text-2xl font-medium tracking-tight md:text-3xl">
          {pick(
            [
              `На что смотреть, когда ищете ${page.professionGenitive} в ${city.name}`,
              `${page.professionLabel} в ${city.name}: как выбрать мастера`,
              `Как не ошибиться с выбором: ${page.professionLabel} в ${city.name}`,
            ],
            key,
          )}
        </h2>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            {pick(
              [
                `Частный мастер в ${city.name} обходится дешевле фирмы по простой причине: вы платите за работу, а не за офис, рекламу и менеджера. Мы тоже не берём процент с оплаты — деньги идут напрямую исполнителю, поэтому цены начинаются от ${min.toLocaleString('ru-RU')} ₽.`,
                `Разница в цене между частником и компанией в ${city.name} объясняется просто: в счёте фирмы заложены аренда, реклама и зарплата менеджера. Здесь вы договариваетесь с мастером напрямую и платите только за работу — от ${min.toLocaleString('ru-RU')} ₽ по типовым задачам.`,
                `Заказывая ${page.professionGenitive} напрямую, вы экономите на посредниках: сервис не удерживает комиссию, а расчёт идёт между вами и исполнителем. По ${city.nameNominative}у типовые работы начинаются от ${min.toLocaleString('ru-RU')} ₽ — в компаниях за тот же объём просят заметно больше.`,
              ],
              key,
            )}
          </p>
          <p>
            {pick(
              [
                `Перед тем как договариваться, опишите задачу конкретнее. «${page.tasks[0]?.task}» и «${page.tasks[page.tasks.length - 1]?.task}» — работы разного объёма, и мастеру нужно понимать, что предстоит сделать. Приложите фото: по снимку исполнитель сразу оценит масштаб и назовёт цену.`,
                `Чем точнее описана задача, тем меньше сюрпризов в цене. Между «${page.tasks[0]?.task}» и «${page.tasks[page.tasks.length - 1]?.task}» разница существенная, поэтому укажите объём сразу и добавьте пару снимков — так мастер ответит готовой суммой, а не встречными вопросами.`,
                `Фотография экономит время обеим сторонам. Задачи вроде «${page.tasks[0]?.task}» и «${page.tasks[page.tasks.length - 1]?.task}» требуют разного времени и инструмента: увидев снимок, исполнитель сразу поймёт масштаб и назовёт цену без долгих уточнений.`,
              ],
              key,
              1,
            )}
          </p>
          <p>
            {pick(
              [
                `Смотрите на рейтинг и отзывы в анкете — их оставляют заказчики после завершённых заданий. Если работа срочная, обращайте внимание на отметку «онлайн»: такой человек ответит быстрее. И обязательно уточните, чей инструмент и расходники.`,
                `Отзывы в профиле появляются только после реально выполненных заданий, так что рейтингу можно доверять. Для срочной задачи выбирайте исполнителя с отметкой «онлайн», а до начала работ проговорите, кто покупает материалы — это самая частая причина спора.`,
                `Анкета мастера показывает рейтинг и отзывы прошлых заказчиков — начните с них. Дальше уточните два момента: свой ли у него инструмент и за чей счёт расходники. Пара сообщений до начала работы избавляет от разногласий при расчёте.`,
              ],
              key,
              2,
            )}
          </p>
        </div>
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          {page.professionLabel} по районам {city.nameGenitive}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {city.population ? `Население — ${city.population}. ` : ''}
          Мастера обычно берут заказы рядом с домом, поэтому в объявлении полезно сразу
          указать район: {districtNames.slice(0, 3).join(', ')} или другой. Так исполнитель
          поймёт, сколько ехать, и не станет закладывать дорогу в стоимость.
        </p>

        {districts.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {districts.map((d) => (
              <Link
                key={d.slug}
                to={`/podrabotka/${city.slug}/rayon/${d.slug}`}
                className="flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm text-muted-foreground transition-colors hover:border-primary/60 hover:text-foreground"
              >
                <Icon name="MapPin" size={14} />
                {d.nameNominative}
              </Link>
            ))}
          </div>
        ) : (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {districtNames.map((d) => (
              <span
                key={d}
                className="flex items-center gap-2 rounded-full border border-line bg-tile px-4 py-2.5 text-sm text-muted-foreground"
              >
                <Icon name="MapPin" size={14} />
                {d}
              </span>
            ))}
          </div>
        )}

        {nearby.length > 0 && (
          <p className="mt-6 text-sm leading-relaxed text-muted-foreground">
            Если подходящего мастера в {city.name} не нашлось, посмотрите соседние города —
            многие исполнители готовы выехать:{' '}
            {nearby.map((c, i) => (
              <span key={c.slug}>
                {i > 0 && ', '}
                <Link
                  to={`/podrabotka/${c.slug}/${page.professionSlug}`}
                  className="text-foreground underline decoration-line underline-offset-4 transition-colors hover:decoration-primary"
                >
                  {page.professionLabel} в {c.name}
                </Link>
              </span>
            ))}
            .
          </p>
        )}
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          Спрос на {page.professionGenitive} в {city.name}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {city.intro}
        </p>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {pick(
            [
              `Задачи по специальности «${page.professionLabel}» здесь появляются регулярно — от разовых мелочей до работы на несколько дней. Заказы публикуют и жители, и небольшие компании, которым проще позвать частного мастера, чем держать своего.`,
              `Направление «${page.professionLabel}» — одно из востребованных в ленте ${city.nameGenitive}. Часть заявок закрывается за один выезд, часть перерастает в постоянное сотрудничество: заказчики нередко возвращаются к мастеру, с которым уже работали.`,
              `На специальность «${page.professionLabel}» в ${city.name} стабильно есть спрос: у одних задача разовая, у других — регулярная. Исполнителю это удобно тем, что можно набрать несколько заказов рядом и не тратить время на дорогу через весь город.`,
            ],
            key,
            3,
          )}
        </p>
      </section>

      <section className="mt-14 max-w-[820px]">
        <h2 className="font-head text-2xl font-medium tracking-tight md:text-3xl">
          {pick(
            ['От чего зависит цена', `Из чего складывается стоимость работ`, `Почему цены отличаются`],
            key,
            1,
          )}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Разброс по типовым работам — от {min.toLocaleString('ru-RU')} до{' '}
          {max.toLocaleString('ru-RU')} ₽. Дешевле всего выходит «{cheapest?.task}», дороже —
          «{priciest?.task}». На итоговую сумму влияет несколько вещей:
        </p>
        <ul className="mt-5 space-y-3">
          {[
            {
              icon: 'Ruler',
              t: 'Объём работ',
              d: 'Несколько задач за один выезд почти всегда дешевле, чем вызывать мастера отдельно под каждую.',
            },
            {
              icon: 'Clock',
              t: 'Срочность',
              d: 'Заказ «на сегодня» или на выходной обычно дороже: исполнитель подстраивает под вас свой график.',
            },
            {
              icon: 'MapPin',
              t: 'Удалённость',
              d: `Работа в пределах района — по базовой цене, выезд за город или в другой конец ${city.nameGenitive} мастер закладывает в стоимость.`,
            },
            {
              icon: 'Package',
              t: 'Материалы',
              d: 'Цены в таблице — за работу. Расходники обычно покупает заказчик либо мастер с последующим возмещением.',
            },
          ].map((x) => (
            <li key={x.t} className="flex gap-3.5 rounded-2xl border border-line bg-surface p-4">
              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon name={x.icon} size={17} fallback="Info" />
              </span>
              <span>
                <span className="block font-head text-base font-medium text-foreground">
                  {x.t}
                </span>
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
          {pick(
            [
              'Как заказать за четыре шага',
              `Как найти ${page.professionGenitive}: четыре шага`,
              'Порядок работы: от заявки до оплаты',
            ],
            key,
            2,
          )}
        </h2>
        <ol className="mt-6 space-y-3">
          {[
            {
              t: 'Опишите задачу',
              d: `Что нужно сделать, в каком районе ${city.nameGenitive} и когда. Фото помогает мастеру оценить работу сразу.`,
            },
            {
              t: 'Получите отклики',
              d: `Заявку видят исполнители, указавшие специальность «${page.professionLabel}» в ${city.name}. Первые ответы обычно приходят в день публикации.`,
            },
            {
              t: 'Выберите мастера',
              d: 'Сравните рейтинг, отзывы и цену. Уточните в переписке детали — чей инструмент, входят ли материалы.',
            },
            {
              t: 'Примите работу',
              d: 'Расплачиваетесь напрямую, без комиссии сервиса. После завершения оставьте отзыв — он помогает следующим заказчикам.',
            },
          ].map((s, i) => (
            <li key={s.t} className="flex gap-4 rounded-2xl border border-line bg-tile p-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-head text-sm font-medium text-primary-foreground">
                {i + 1}
              </span>
              <span>
                <span className="block font-head text-base font-medium text-foreground">
                  {s.t}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">
                  {s.d}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </section>
    </>
  );
};

export default ProfessionContent;
