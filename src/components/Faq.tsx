import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const items = [
  {
    q: 'Сервис правда бесплатный?',
    a: 'Да. Публикация объявлений, отклики и подтверждение исполнителя не стоят ничего. Комиссии с оплаты мы не берём — заказчик и исполнитель рассчитываются напрямую.',
  },
  {
    q: 'Зачем вход через MAX?',
    a: 'Так у каждого аккаунта есть подтверждённый контакт, а вам не нужно придумывать пароли. Одна кнопка — и вы в своей роли: заказчика или исполнителя.',
  },
  {
    q: 'Можно опубликовать заказ без фото?',
    a: 'Конечно. Фото помогает исполнителю оценить объём, но объявление публикуется и без него — достаточно описания, суммы и срока.',
  },
  {
    q: 'Как выбирается исполнитель?',
    a: 'Все отклики видны в карточке заказа: имя, рейтинг, число выполненных работ и пара слов от человека. Заказчик подтверждает одного — остальные видят, что заказ закрыт.',
  },
  {
    q: 'Работает ли сервис с телефона?',
    a: 'Да, интерфейс одинаково удобен на телефоне и компьютере: лента, создание объявления и отклики адаптированы под маленький экран.',
  },
];

const Faq = () => (
  <section className="bg-background py-24 md:py-32">
    <div className="mx-auto max-w-[900px] px-6 md:px-16">
      <p className="text-sm uppercase tracking-[0.2em] text-foreground/60">Вопросы</p>
      <h2 className="mt-4 font-head text-3xl font-normal leading-tight tracking-tight md:text-5xl">
        Коротко о главном
      </h2>

      <Accordion type="single" collapsible className="mt-10">
        {items.map((it) => (
          <AccordionItem key={it.q} value={it.q} className="border-foreground/20">
            <AccordionTrigger className="py-6 text-left font-head text-lg font-medium hover:no-underline">
              {it.q}
            </AccordionTrigger>
            <AccordionContent className="pb-6 text-base leading-relaxed text-muted-foreground/85">
              {it.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default Faq;
