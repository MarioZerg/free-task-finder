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
import { useAppState } from '@/hooks/use-app-state';
import { PageLoader } from '@/components/Loader';

const Index = () => {
  const { user, authPending } = useAppState();

  useSeo({
    title: 'Доделай.ру — подработка и разовые заказы в Ярославской области',
    description:
      'Разовая работа в Ярославской области: Ярославль, Рыбинск, Тутаев, Углич, Ростов. Разместите задачу бесплатно или найдите подработку — без комиссии.',
    canonical: 'https://dodelay.ru/',
  });

  /* Ключ входа в браузере есть, профиль ещё едет — показываем загрузку.
     Иначе вернувшийся из MAX человек долю секунды видит главную в гостевом
     виде: кнопка «Войти», приглашения зарегистрироваться. Робота это не
     касается — у него ключа нет, и он сразу получает готовый текст. */
  if (authPending && !user) return <PageLoader />;

  return (
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
  );
};

export default Index;