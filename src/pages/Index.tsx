import { AppStateProvider } from '@/hooks/use-app-state';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RolePreview from '@/components/RolePreview';
import HowItWorks from '@/components/HowItWorks';
import ExecutorsCta from '@/components/ExecutorsCta';
import Reviews from '@/components/Reviews';
import Faq from '@/components/Faq';
import Footer from '@/components/Footer';
import LoginDialog from '@/components/LoginDialog';
import useSeo from '@/hooks/use-seo';

const Index = () => {
  useSeo({
    title: 'Доделай.ру — шабашка и подработка в Ярославле',
    description:
      'Бесплатные объявления о разовой подработке в Ярославле и области: заказчики публикуют задачи, исполнители откликаются. Вход через MAX.',
    canonical: 'https://dodelay.ru/',
  });

  return (
    <AppStateProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-background font-body text-foreground">
        <Header />
        <main>
          <Hero />
          <RolePreview />
          <HowItWorks />
          <ExecutorsCta />
          <Reviews />
          <Faq />
        </main>
        <Footer />
        <LoginDialog />
      </div>
    </AppStateProvider>
  );
};

export default Index;
