
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import { AuthGuard } from "./components/auth/AuthGuard";
import { AppLayout } from "./components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Processes from "./pages/Processes";
import Municipalities from "./pages/Municipalities";
import RegionalNuclei from "./pages/RegionalNuclei";
import Map from "./pages/Map";
import Reports from "./pages/Reports";
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/*"
              element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route 
                      path="/processes" 
                      element={
                        <AuthGuard requireRole="technical">
                          <Processes />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/municipalities" 
                      element={
                        <AuthGuard requireRole="technical">
                          <Municipalities />
                        </AuthGuard>
                      } 
                    />
                    <Route 
                      path="/regional-nuclei" 
                      element={
                        <AuthGuard requireRole="technical">
                          <RegionalNuclei />
                        </AuthGuard>
                      } 
                    />
                    <Route path="/map" element={<Map />} />
                    <Route path="/reports/*" element={<Reports />} />
                    <Route 
                      path="/settings" 
                      element={
                        <AuthGuard requireRole="admin">
                          <Settings />
                        </AuthGuard>
                      } 
                    />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
