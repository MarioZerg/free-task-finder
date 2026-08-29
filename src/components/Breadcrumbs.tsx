import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  current: string;
  trail?: Crumb[];
}

const Breadcrumbs = ({ current, trail = [] }: Props) => (
  <nav aria-label="Хлебные крошки" className="text-sm text-chip">
    <ol className="flex flex-wrap items-center gap-2">
      <li>
        <Link to="/" className="story-link">
          Главная
        </Link>
      </li>
      {trail.map((t) => (
        <li key={t.label} className="flex items-center gap-2">
          <span aria-hidden="true" className="flex items-center text-chip/60">
            <Icon name="ChevronRight" size={14} />
          </span>
          {t.href ? (
            <Link to={t.href} className="story-link">
              {t.label}
            </Link>
          ) : (
            <span>{t.label}</span>
          )}
        </li>
      ))}
      <li aria-hidden="true" className="flex items-center text-chip/60">
        <Icon name="ChevronRight" size={14} />
      </li>
      <li aria-current="page" className="text-muted-foreground">
        {current}
      </li>
    </ol>
  </nav>
);

export default Breadcrumbs;