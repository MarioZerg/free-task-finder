import { AppStateProvider } from '@/hooks/use-app-state';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RolePreview from '@/components/RolePreview';
import HowItWorks from '@/components/HowItWorks';
import ExecutorsCta from '@/components/ExecutorsCta';
import Faq from '@/components/Faq';
import Footer from '@/components/Footer';
import LoginDialog from '@/components/LoginDialog';

const Index = () => (
  <AppStateProvider>
    <div className="relative min-h-screen overflow-x-hidden bg-background font-body text-foreground">
      <Header />
      <main>
        <Hero />
        <RolePreview />
        <HowItWorks />
        <ExecutorsCta />
        <Faq />
      </main>
      <Footer />
      <LoginDialog />
    </div>
  </AppStateProvider>
);

export default Index;