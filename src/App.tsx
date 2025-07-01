
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TechnicalAuthProvider } from "./hooks/useTechnicalAuth";
import { ThemeProvider } from "./hooks/useTheme";
import { TechnicalAuthGuard } from "./components/auth/TechnicalAuthGuard";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Processes from "./pages/Processes";
import Municipalities from "./pages/Municipalities";
import RegionalNuclei from "./pages/RegionalNuclei";
import Map from "./pages/Map";
import Reports from "./pages/Reports";
import TechnicalAuth from "./pages/TechnicalAuth";
import AppSettings from "./pages/AppSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ThemeProvider>
          <TechnicalAuthProvider>
            <Routes>
              <Route path="/technical-auth" element={<TechnicalAuth />} />
              <Route
                path="/*"
                element={
                  <AppLayout>
                    <Routes>
                      {/* Páginas públicas */}
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/map" element={<Map />} />
                      <Route path="/reports/*" element={<Reports />} />
                      <Route path="/app-settings" element={<AppSettings />} />
                      
                      {/* Páginas da área técnica */}
                      <Route 
                        path="/processes" 
                        element={
                          <TechnicalAuthGuard fallback={<div className="text-center py-8 text-gray-600">Acesso restrito à área técnica</div>}>
                            <Processes />
                          </TechnicalAuthGuard>
                        } 
                      />
                      <Route 
                        path="/municipalities" 
                        element={
                          <TechnicalAuthGuard fallback={<div className="text-center py-8 text-gray-600">Acesso restrito à área técnica</div>}>
                            <Municipalities />
                          </TechnicalAuthGuard>
                        } 
                      />
                      <Route 
                        path="/regional-nuclei" 
                        element={
                          <TechnicalAuthGuard fallback={<div className="text-center py-8 text-gray-600">Acesso restrito à área técnica</div>}>
                            <RegionalNuclei />
                          </TechnicalAuthGuard>
                        } 
                      />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </AppLayout>
                }
              />
            </Routes>
          </TechnicalAuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
