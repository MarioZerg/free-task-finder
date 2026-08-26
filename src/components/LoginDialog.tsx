import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';
import { useAppState } from '@/hooks/use-app-state';
import { Role } from '@/data/mock';
import { toast } from '@/hooks/use-toast';

const roleCopy: Record<Role, { title: string; hint: string; icon: string }> = {
  customer: {
    title: 'Вход для заказчика',
    hint: 'Публикуйте объявления, смотрите отклики и подтверждайте исполнителя.',
    icon: 'ClipboardList',
  },
  executor: {
    title: 'Вход для исполнителя',
    hint: 'Смотрите общую ленту заказов рядом и откликайтесь в один клик.',
    icon: 'Hammer',
  },
};

const LoginDialog = () => {
  const { loginOpen, setLoginOpen, loginRole, login, openLogin } = useAppState();
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const copy = roleCopy[loginRole];

  const submit = () => {
    const value = name.trim();
    if (value.length < 2) {
      setError('Введите имя — так вас увидят в ленте');
      return;
    }
    setError('');
    login(loginRole, value);
    toast({
      title: 'Вы вошли через MAX',
      description:
        loginRole === 'customer'
          ? 'Теперь можно опубликовать объявление.'
          : 'Лента заказов открыта — откликайтесь.',
    });
    setName('');
  };

  return (
    <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
      <DialogContent className="border-line bg-surface text-foreground sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle className="font-head text-2xl font-medium tracking-tight">
            {copy.title}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">{copy.hint}</DialogDescription>
        </DialogHeader>

        <div className="mt-2 flex gap-2 rounded-full border border-line p-1">
          {(['customer', 'executor'] as Role[]).map((r) => (
            <button
              key={r}
              onClick={() => openLogin(r)}
              className={`flex-1 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                loginRole === r
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground/80 hover:text-foreground'
              }`}
            >
              {r === 'customer' ? 'Я заказчик' : 'Я исполнитель'}
            </button>
          ))}
        </div>

        <label className="mt-4 block text-sm text-muted-foreground/80" htmlFor="login-name">
          Как вас зовут
        </label>
        <input
          id="login-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          placeholder="Например, Алексей"
          className="w-full rounded-2xl border border-line bg-tile px-4 py-3.5 text-base outline-none transition-colors placeholder:text-chip focus:border-primary/60"
        />
        {error && <p className="text-sm text-destructive-foreground/90">{error}</p>}

        <button
          onClick={submit}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-base font-medium text-primary-foreground transition-transform hover:scale-[1.02]"
        >
          <Icon name="MessageCircle" size={18} />
          Продолжить через MAX
        </button>

        <p className="text-center text-xs text-chip">
          Демо-вход: подтверждение из MAX здесь не запрашивается. Сервис бесплатный, комиссий нет.
        </p>
      </DialogContent>
    </Dialog>
  );
};

export default LoginDialog;
