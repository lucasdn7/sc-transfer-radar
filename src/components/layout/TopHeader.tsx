
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, User, Shield, Menu, X, Home, FileText, Building, MapPin, BarChart3, Settings } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ExpiringContractsReportButton } from "@/components/layout/ExpiringContractsReportButton";
import { ThemeToggle } from "./ThemeToggle";

const publicNavItems = [
  { to: "/", icon: Home, label: "Dashboard" },
  { to: "/map", icon: MapPin, label: "Mapa" },
  { to: "/reports", icon: BarChart3, label: "Relatórios" },
];

const technicalNavItems = [
  { to: "/processes", icon: FileText, label: "Processos" },
  { to: "/municipalities", icon: Building, label: "Municípios" },
  { to: "/regional-nuclei", icon: MapPin, label: "Núcleos Regionais" },
];

export function TopHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      navigate('/technical-auth');
    }
  };

  const getNavItems = () => {
    let items = [...publicNavItems];
    
    if (isAuthenticated) {
      items = [...items, ...technicalNavItems];
    }
    
    return items;
  };

  return (
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-[var(--bg-surface)] backdrop-blur-xl transition-colors duration-200">
      {/* Main Header */}
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-[var(--accent-green)]" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Transfer Radar SC</h1>
              <p className="text-xs text-muted-foreground">Sistema de Transferências Financeiras</p>
            </div>
          </Link>

          <div className="flex items-center space-x-4">
            {isAuthenticated && <NotificationCenter />}
            <ThemeToggle />
            <ExpiringContractsReportButton />

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>

            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated && (
                <div className="flex items-center space-x-2 mr-4">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <Badge className="border-emerald-400/20 bg-[var(--accent-green-muted)] text-[var(--accent-green)]">
                    Área Técnica
                  </Badge>
                </div>
              )}

              <Button
                variant={isAuthenticated ? "outline" : "default"}
                size="sm"
                onClick={handleAuthAction}
                className="flex items-center space-x-2"
              >
                {isAuthenticated ? (
                  <>
                    <LogOut className="h-4 w-4" />
                    <span>Sair</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Área Técnica</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="border-t border-border bg-background/60">
        <div className="px-6">
          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-1">
            {getNavItems().map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                  location.pathname === item.to
                    ? "rounded-full border-[var(--accent-green)] bg-[var(--accent-green)] text-black"
                    : "rounded-full border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            
            <Link
              to="/app-settings"
              className={cn(
                "flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2",
                location.pathname === "/app-settings"
                  ? "rounded-full border-[var(--accent-green)] bg-[var(--accent-green)] text-black"
                  : "rounded-full border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </Link>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-2 space-y-1">
              {getNavItems().map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                    location.pathname === item.to
                      ? "bg-[var(--accent-green)] text-black"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              <Link
                to="/app-settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  location.pathname === "/app-settings"
                    ? "bg-[var(--accent-green)] text-black"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Settings className="h-4 w-4" />
                <span>Configurações</span>
              </Link>

              <div className="px-4 py-2">
                <ExpiringContractsReportButton />
              </div>

              {/* Mobile Auth */}
              <div className="pt-2 border-t border-gray-200 mt-2">
                {isAuthenticated && (
                  <div className="flex items-center space-x-2 px-4 py-2 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <Badge className="border-emerald-400/20 bg-[var(--accent-green-muted)] text-[var(--accent-green)]">
                      Área Técnica
                    </Badge>
                  </div>
                )}
                
                <Button
                  variant={isAuthenticated ? "outline" : "default"}
                  size="sm"
                  onClick={handleAuthAction}
                  className="w-full mx-4 mt-2 flex items-center justify-center space-x-2"
                >
                  {isAuthenticated ? (
                    <>
                      <LogOut className="h-4 w-4" />
                      <span>Sair da Área Técnica</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      <span>Acessar Área Técnica</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
