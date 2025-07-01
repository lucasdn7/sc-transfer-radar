
import { NavLink } from "react-router-dom";
import { 
  Home, 
  FileText, 
  Building, 
  MapPin, 
  BarChart3, 
  Settings,
  Users,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTechnicalAuth } from "@/hooks/useTechnicalAuth";

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

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { isAuthenticated } = useTechnicalAuth();

  const getNavItems = () => {
    let items = [...publicNavItems];
    
    if (isAuthenticated) {
      items = [...items, ...technicalNavItems];
    }
    
    return items;
  };

  return (
    <div className={cn(
      "fixed left-0 top-16 z-40 w-64 bg-white border-r border-gray-200 h-screen flex flex-col transform transition-transform duration-200 ease-in-out md:translate-x-0",
      isOpen ? "translate-x-0" : "-translate-x-full"
    )}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-blue-600" />
          <div>
            <h2 className="font-semibold text-gray-900">Transfer Radar</h2>
            <p className="text-xs text-gray-600">Santa Catarina</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {getNavItems().map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )
                }
                onClick={onClose}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
          
          <li>
            <NavLink
              to="/app-settings"
              className={({ isActive }) =>
                cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )
              }
              onClick={onClose}
            >
              <Settings className="h-5 w-5" />
              <span>Configurações</span>
            </NavLink>
          </li>
        </ul>

        {isAuthenticated && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Área Técnica</span>
            </div>
            <p className="text-xs text-blue-700">
              Acesso autenticado para edição e gerenciamento de dados.
            </p>
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Portal desenvolvido pela GEINFRA
        </p>
      </div>
    </div>
  );
}
