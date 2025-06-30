
import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  Building, 
  MapPin, 
  Users, 
  BarChart3,
  Settings,
  HelpCircle,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Processos', href: '/processes', icon: FileText },
  { name: 'Municípios', href: '/municipalities', icon: Building },
  { name: 'Mapa Interativo', href: '/map', icon: MapPin },
  {
    name: 'Relatórios',
    icon: BarChart3,
    children: [
      { name: 'Estatísticas Gerais', href: '/reports/stats' },
      { name: 'Financeiro', href: '/reports/financial' },
      { name: 'Por Região', href: '/reports/regions' },
    ]
  },
  { name: 'Núcleos Regionais', href: '/regional-nuclei', icon: Users },
];

const bottomNavigation = [
  { name: 'Configurações', href: '/settings', icon: Settings },
  { name: 'Ajuda', href: '/help', icon: HelpCircle },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<string[]>(['Relatórios']);

  const toggleGroup = (groupName: string) => {
    setOpenGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    );
  };

  const isActiveLink = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  const renderNavItem = (item: any) => {
    if (item.children) {
      const isOpen = openGroups.includes(item.name);
      const hasActiveChild = item.children.some((child: any) => isActiveLink(child.href));
      
      return (
        <Collapsible key={item.name} open={isOpen} onOpenChange={() => toggleGroup(item.name)}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-between h-10 px-3 text-left font-normal",
                (hasActiveChild || isOpen) && "bg-accent text-accent-foreground"
              )}
            >
              <div className="flex items-center">
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </div>
              {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 pl-6">
            {item.children.map((child: any) => (
              <NavLink
                key={child.href}
                to={child.href}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    "flex items-center h-9 px-3 text-sm rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActive && "bg-accent text-accent-foreground font-medium"
                  )
                }
              >
                {child.name}
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <NavLink
        key={item.href}
        to={item.href}
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            "flex items-center h-10 px-3 rounded-md transition-colors hover:bg-accent hover:text-accent-foreground",
            isActive && "bg-accent text-accent-foreground font-medium"
          )
        }
      >
        <item.icon className="mr-3 h-4 w-4" />
        {item.name}
      </NavLink>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={cn(
        "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-background border-r transition-transform duration-200 ease-in-out md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-auto py-4">
            <nav className="space-y-1 px-3">
              {navigation.map(renderNavItem)}
            </nav>
          </div>
          
          <div className="border-t p-3">
            <nav className="space-y-1">
              {bottomNavigation.map(renderNavItem)}
            </nav>
          </div>
        </div>
      </aside>
    </>
  );
}
