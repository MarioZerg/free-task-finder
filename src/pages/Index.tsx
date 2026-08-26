import { AppStateProvider } from '@/hooks/use-app-state';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import RolePreview from '@/components/RolePreview';
import Feed from '@/components/Feed';
import HowItWorks from '@/components/HowItWorks';
import ExecutorsCta from '@/components/ExecutorsCta';
import People from '@/components/People';
import CompletedFeed from '@/components/CompletedFeed';
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
        <Feed />
        <HowItWorks />
        <ExecutorsCta />
        <People />
        <CompletedFeed />
        <Faq />
      </main>
      <Footer />
      <LoginDialog />
    </div>
  </AppStateProvider>
);

export default Index;