
import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Contacts from "./pages/Contacts";
import CityLanding from "./pages/CityLanding";
import ProfessionCityLanding from "./pages/ProfessionCityLanding";
import DistrictLanding from "./pages/DistrictLanding";
import ScrollToTop from "./components/ScrollToTop";
import TrailingSlashRedirect from "./components/TrailingSlashRedirect";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <TrailingSlashRedirect />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route
            path="/dashboard"
            element={
              <Suspense fallback={null}>
                <Dashboard />
              </Suspense>
            }
          />
          <Route
            path="/admin"
            element={
              <Suspense fallback={null}>
                <Admin />
              </Suspense>
            }
          />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/podrabotka/:citySlug/rayon/:districtSlug" element={<DistrictLanding />} />
          <Route path="/podrabotka/:citySlug/:professionSlug" element={<ProfessionCityLanding />} />
          <Route path="/podrabotka/:slug" element={<CityLanding />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;