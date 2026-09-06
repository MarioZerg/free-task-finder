import { money } from '@/data/mock';

export type PriceType = 'fixed' | 'range' | 'negotiable';

export interface PriceLike {
  price: number;
  priceType?: PriceType;
  priceMax?: number | null;
}

/**
 * Цена заказа одной строкой.
 *
 * Заказчик не всегда знает точную сумму заранее: где-то она понятна, где-то
 * зависит от объёма, а где-то её честнее обсудить. Поэтому три варианта —
 * точная, вилка «от и до» и договорная.
 */
export const priceText = (j: PriceLike): string => {
  const type = j.priceType || 'fixed';
  if (type === 'negotiable') return 'Договорная';
  if (type === 'range' && j.priceMax) {
    return `${j.price.toLocaleString('ru-RU')}–${money(j.priceMax)}`;
  }
  return money(j.price);
};

/** Короткий вид для тесных мест — карточек в ленте. */
export const priceShort = (j: PriceLike): string => {
  const type = j.priceType || 'fixed';
  if (type === 'negotiable') return 'Договорная';
  if (type === 'range' && j.priceMax) {
    return `от ${money(j.price)}`;
  }
  return money(j.price);
};

/** Сумма для сортировок и расчётов: у договорных её нет. */
export const priceValue = (j: PriceLike): number =>
  (j.priceType || 'fixed') === 'negotiable' ? 0 : j.price;

export const PRICE_TYPES: { id: PriceType; label: string; hint: string }[] = [
  { id: 'fixed', label: 'Точная', hint: 'Знаю, сколько заплачу' },
  { id: 'range', label: 'От и до', hint: 'Зависит от объёма работы' },
  { id: 'negotiable', label: 'Договорная', hint: 'Обсудим с исполнителем' },
];
