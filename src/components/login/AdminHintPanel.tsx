import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';

interface Props {
  setLoginOpen: (v: boolean) => void;
}

const AdminHintPanel = ({ setLoginOpen }: Props) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <button
        onClick={() => {
          setLoginOpen(false);
          navigate('/admin');
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
      >
        <Icon name="ShieldCheck" size={18} />
        Перейти в админку
      </button>
      <button
        onClick={() => {
          setLoginOpen(false);
          navigate('/dashboard');
        }}
        className="w-full rounded-full border border-line py-4 text-base font-medium transition-colors hover:border-primary/50"
      >
        В обычный кабинет
      </button>
    </div>
  );
};

export default AdminHintPanel;
