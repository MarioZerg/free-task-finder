import { useEffect, useState } from 'react';

/**
 * Сколько экрана снизу занимает клавиатура телефона.
 *
 * Мобильная клавиатура не уменьшает окно браузера: она просто накрывает
 * нижнюю часть страницы. Поэтому диалог, посчитанный от высоты экрана,
 * уезжает под неё — поле ввода становится не видно, и человек печатает
 * вслепую.
 *
 * Настоящую видимую область знает visualViewport — по нему и считаем,
 * насколько нужно поджать окно чата. Где его нет, возвращаем 0: там
 * поведение остаётся прежним.
 */
export const useKeyboardInset = () => {
  const [inset, setInset] = useState(0);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      /* Разница между высотой окна и видимой областью — это и есть
         клавиатура. Мелкие отклонения (панели браузера) игнорируем. */
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      setInset(hidden > 80 ? Math.round(hidden) : 0);
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return inset;
};

export default useKeyboardInset;
