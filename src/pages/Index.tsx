import { AppStateProvider } from '@/hooks/use-app-state';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RolePreview from '@/components/RolePreview';
import HowItWorks from '@/components/HowItWorks';
import ExecutorsCta from '@/components/ExecutorsCta';
import Reviews from '@/components/Reviews';
import CityLinks from '@/components/CityLinks';
import Faq from '@/components/Faq';
import HomeContent from '@/components/HomeContent';
import Footer from '@/components/Footer';
import LoginDialog from '@/components/LoginDialog';
import useSeo from '@/hooks/use-seo';

const Index = () => {
  useSeo({
    title: 'Доделай.ру — подработка и разовые заказы в Ярославской области',
    description:
      'Разовая работа в Ярославской области: Ярославль, Рыбинск, Тутаев, Углич, Ростов. Разместите задачу бесплатно или найдите подработку — без комиссии.',
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
          <HomeContent />
          <CityLinks />
          <Faq />
        </main>
        <Footer />
        <LoginDialog />
      </div>
    </AppStateProvider>
  );
};

export default Index;