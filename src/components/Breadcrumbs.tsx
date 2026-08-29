import { Link } from 'react-router-dom';
import Icon from '@/components/ui/icon';

const Breadcrumbs = ({ current }: { current: string }) => (
  <nav aria-label="Хлебные крошки" className="text-sm text-chip">
    <ol className="flex flex-wrap items-center gap-2">
      <li>
        <Link to="/" className="story-link">
          Главная
        </Link>
      </li>
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
