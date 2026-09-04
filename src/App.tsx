
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import TrailingSlashRedirect from "./components/TrailingSlashRedirect";
import useMetrika from "./hooks/use-metrika";
import { PageLoader } from "./components/Loader";

// Каждая страница — отдельный файл: браузер качает только то, что открыли.
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const Contacts = lazy(() => import("./pages/Contacts"));
const CityLanding = lazy(() => import("./pages/CityLanding"));
const ProfessionCityLanding = lazy(() => import("./pages/ProfessionCityLanding"));
const DistrictLanding = lazy(() => import("./pages/DistrictLanding"));

const RouteFallback = () => <PageLoader />;

const queryClient = new QueryClient();

const MetrikaTracker = () => {
  useMetrika();
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <TrailingSlashRedirect />
        <MetrikaTracker />
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/contacts" element={<Contacts />} />
            <Route path="/podrabotka/:citySlug/rayon/:districtSlug" element={<DistrictLanding />} />
            <Route path="/podrabotka/:citySlug/:professionSlug" element={<ProfessionCityLanding />} />
            <Route path="/podrabotka/:slug" element={<CityLanding />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
