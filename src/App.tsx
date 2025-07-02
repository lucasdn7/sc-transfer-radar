
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { TechnicalAuthProvider } from "./hooks/useTechnicalAuth";
import { ThemeProvider } from "./components/providers/ThemeProvider";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Processes from "./pages/Processes";
import ProcessTimeline from "./pages/ProcessTimeline";
import ProcessCalendar from "./pages/ProcessCalendar";
import Municipalities from "./pages/Municipalities";
import RegionalNuclei from "./pages/RegionalNuclei";
import Documents from "./pages/Documents";
import Map from "./pages/Map";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AppSettings from "./pages/AppSettings";
import Auth from "./pages/Auth";
import TechnicalAuth from "./pages/TechnicalAuth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TechnicalAuthProvider>
      <ThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/processes" element={<Processes />} />
                <Route path="/process-timeline" element={<ProcessTimeline />} />
                <Route path="/process-calendar" element={<ProcessCalendar />} />
                <Route path="/municipalities" element={<Municipalities />} />
                <Route path="/regional-nuclei" element={<RegionalNuclei />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/map" element={<Map />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/app-settings" element={<AppSettings />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/technical-auth" element={<TechnicalAuth />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </TechnicalAuthProvider>
  </QueryClientProvider>
);

export default App;
