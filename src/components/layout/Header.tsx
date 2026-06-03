
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from '@/hooks/useAuth';
import { LogIn, LogOut, User, Shield, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { TestGoogleSheetsButton } from "./TestGoogleSheetsButton";
import { ThemeToggle } from "./ThemeToggle";

interface HeaderProps {
  onMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
}

export function Header({ onMenuToggle, isMobileMenuOpen }: HeaderProps) {
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
    <header className="fixed left-0 right-0 top-0 z-50 border-b border-border bg-[var(--bg-surface)] px-4 py-3 backdrop-blur-xl transition-colors duration-200 md:left-[212px] md:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {onMenuToggle && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onMenuToggle}
              className="md:hidden"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-[var(--accent-green)]" />
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Transfer Radar SC</h1>
              <p className="text-xs text-muted-foreground">Sistema de Transferências Financeiras</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <>
              <NotificationCenter />
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <Badge className="border-emerald-400/20 bg-[var(--accent-green-muted)] text-[var(--accent-green)]">
                  Área Técnica
                </Badge>
              </div>
              <TestGoogleSheetsButton />
            </>
          )}

          <ThemeToggle />

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
    </header>
  );
}
