/** Мигающий логотип вместо текста «Загружаем…».
 *  full — на весь экран (переход между страницами),
 *  inline — внутри блока (подгрузка списка). */
const Logo = ({ size }: { size: 'lg' | 'sm' }) => (
  <span
    className={`animate-logo-pulse font-head font-bold leading-none tracking-tight text-primary ${
      size === 'lg' ? 'text-3xl md:text-4xl' : 'text-xl'
    }`}
  >
    ДОДЕЛАЙ
    <sup className="align-super text-[0.42em] font-normal">.РУ</sup>
  </span>
);

export const PageLoader = () => (
  <div className="flex min-h-screen items-center justify-center bg-background px-6">
    <Logo size="lg" />
  </div>
);

const Loader = ({ className = '' }: { className?: string }) => (
  <div className={`flex items-center justify-center py-10 ${className}`}>
    <Logo size="sm" />
  </div>
);

export default Loader;
