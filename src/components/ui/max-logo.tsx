/** Знак мессенджера MAX для кнопок входа.
 *
 *  Рисуем вектором, а не картинкой: логотип стоит рядом с текстом кнопки,
 *  и на экранах телефонов растровая иконка выглядела бы мылом. Цвет
 *  наследуется от кнопки через currentColor — знак одинаково читается
 *  и на зелёной заливке, и на светлой подложке.
 */
const MaxLogo = ({ size = 20, className }: { size?: number; className?: string }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    className={className}
  >
    <rect x="1.5" y="1.5" width="21" height="21" rx="6.5" fill="currentColor" opacity="0.16" />
    <path
      d="M6 17V8.6c0-.5.62-.73.94-.34L12 14.4l5.06-6.14c.32-.39.94-.16.94.34V17"
      stroke="currentColor"
      strokeWidth="2.1"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default MaxLogo;
