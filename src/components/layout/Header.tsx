
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { useAuth } from "@/hooks/useAuth";
import { LogIn, LogOut, User, Shield } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export function Header() {
  const { isAuthenticated, user, userRole, signOut } = useAuth();
  const navigate = useNavigate();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      signOut();
    } else {
      navigate('/auth');
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'technical':
        return 'Técnico';
      default:
        return 'Visualizador';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Transfer Radar SC</h1>
              <p className="text-xs text-gray-600">Sistema de Transferências Financeiras</p>
            </div>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <>
              <NotificationCenter />
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-600" />
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email}
                  </p>
                  {userRole && (
                    <Badge className={getRoleColor(userRole)}>
                      {getRoleLabel(userRole)}
                    </Badge>
                  )}
                </div>
              </div>
            </>
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
    </header>
  );
}
