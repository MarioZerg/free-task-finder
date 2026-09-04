/** Стабильный «случайный» выбор варианта текста по ключу страницы.
 *  Один и тот же адрес всегда даёт один и тот же текст — это важно,
 *  иначе поисковик при каждом обходе видел бы другую страницу. */
export const seedOf = (key: string): number => {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h;
};

/** Берёт вариант из списка по ключу и смещению */
export const pick = <T,>(list: T[], key: string, offset = 0): T =>
  list[(seedOf(key) + offset) % list.length];
