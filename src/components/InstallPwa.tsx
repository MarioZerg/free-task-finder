import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Icon from '@/components/ui/icon';

interface PromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true;

const isIos = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

export const useInstallPwa = () => {
  const [prompt, setPrompt] = useState<PromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPrompt(e as PromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPrompt(null);
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  return { prompt, installed, ios: isIos() };
};

const InstallPwa = ({ variant = 'button' }: { variant?: 'button' | 'link' }) => {
  const { prompt, installed } = useInstallPwa();
  const [help, setHelp] = useState(false);

  if (installed) return null;

  const install = async () => {
    if (prompt) {
      await prompt.prompt();
      await prompt.userChoice;
      return;
    }
    setHelp(true);
  };

  return (
    <>
      <button
        onClick={install}
        className={
          variant === 'link'
            ? 'flex min-h-[44px] items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground'
            : 'flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium transition-colors hover:border-primary/60'
        }
      >
        <Icon name="Download" size={16} />
        Установить приложение
      </button>

      <Dialog open={help} onOpenChange={setHelp}>
        <DialogContent className="border-line bg-surface text-foreground sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="font-head text-2xl font-medium tracking-tight">
              Доделай.ру на телефон
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Приложение откроется на весь экран, как обычное — из списка программ.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="rounded-2xl border border-line bg-tile p-4">
              <p className="flex items-center gap-2 font-medium">
                <Icon name="Apple" size={16} className="text-primary" />
                iPhone и iPad
              </p>
              <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>1. Откройте сайт в Safari</li>
                <li>2. Нажмите кнопку «Поделиться» внизу экрана</li>
                <li>3. Выберите «На экран «Домой»» и подтвердите</li>
              </ol>
            </div>

            <div className="rounded-2xl border border-line bg-tile p-4">
              <p className="flex items-center gap-2 font-medium">
                <Icon name="Smartphone" size={16} className="text-primary" />
                Android
              </p>
              <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                <li>1. Откройте сайт в Chrome</li>
                <li>2. Нажмите три точки в правом верхнем углу</li>
                <li>3. Выберите «Установить приложение»</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default InstallPwa;