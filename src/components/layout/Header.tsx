
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, User, Shield, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "@/lib/utils";

interface HeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  isSidebarCollapsed?: boolean;
}

export function Header({ onMenuToggle, isMobileMenuOpen, isSidebarCollapsed }: HeaderProps) {
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      navigate('/technical-auth');
    }
  };

  return (
    <header className={cn("fixed left-0 right-0 top-0 z-50 border-b border-border bg-[var(--bg-surface)] px-3 py-3 backdrop-blur-xl transition-[left,padding] duration-200 sm:px-6 lg:px-8", isSidebarCollapsed ? "lg:left-16" : "lg:left-64")}>
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2 sm:gap-4">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuToggle}
              className="shrink-0 lg:hidden"
              aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <Shield className="h-6 w-6 shrink-0 text-[var(--accent-green)] sm:h-8 sm:w-8" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold tracking-tight text-foreground sm:text-xl">Transfer Radar SC</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">Sistema de Transferências Financeiras</p>
            </div>
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-4">
          {isAuthenticated && (
            <>
              <NotificationCenter />
              <div className="hidden items-center space-x-2 sm:flex">
                <User className="h-4 w-4 text-muted-foreground" />
                <Badge className="border-emerald-400/20 bg-[var(--accent-green-muted)] text-[var(--accent-green)]">
                  Área Técnica
                </Badge>
              </div>
            </>
          )}

          <ThemeToggle />

          <Button
            variant={isAuthenticated ? "outline" : "default"}
            size="sm"
            onClick={handleAuthAction}
            className="flex shrink-0 items-center gap-2"
            aria-label={isAuthenticated ? "Sair da área técnica" : "Acessar área técnica"}
          >
            {isAuthenticated ? (
              <>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
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
    </header>
  );
}
